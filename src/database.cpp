#include "database.h"
#include "statement.h"
#include <iostream>
#include <string>

using v8::Context;
using v8::Exception;
using v8::External;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> Database::constructor;

Database::Database(const char* filename) : db_(nullptr) {
    int rc = sqlite3_open_v2(filename, &db_, 
        SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_NOMUTEX, nullptr);
    
    if (rc != SQLITE_OK) {
        std::string error = "Cannot open database: ";
        if (db_) {
            error += sqlite3_errmsg(db_);
            sqlite3_close(db_);
        } else {
            error += "Out of memory";
        }
        db_ = nullptr;
        throw std::runtime_error(error);
    }

    // Set pragma to use UTF-16 encoding for text
    rc = sqlite3_exec(db_, "PRAGMA encoding = 'UTF-16'", nullptr, nullptr, nullptr);
    if (rc != SQLITE_OK) {
        std::string error = "Cannot set UTF-16 encoding: ";
        error += sqlite3_errmsg(db_);
        sqlite3_close(db_);
        db_ = nullptr;
        throw std::runtime_error(error);
    }
}

Database::~Database() {
    if (db_) {
        sqlite3_close(db_);
        db_ = nullptr;
    }
}

void Database::Init(Local<Object> exports) {
    Isolate* isolate = exports->GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();

    Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
    tpl->SetClassName(String::NewFromUtf8(isolate, "Database", NewStringType::kNormal).ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(tpl, "prepare", Prepare);
    NODE_SET_PROTOTYPE_METHOD(tpl, "exec", Exec);
    NODE_SET_PROTOTYPE_METHOD(tpl, "close", Close);

    Local<Function> constructor_local = tpl->GetFunction(context).ToLocalChecked();
    constructor.Reset(isolate, constructor_local);
    exports->Set(context, String::NewFromUtf8(isolate, "Database", NewStringType::kNormal).ToLocalChecked(),
                constructor_local).FromJust();
}

void Database::New(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();

    if (args.IsConstructCall()) {
        if (args.Length() < 1 || !args[0]->IsString()) {
            isolate->ThrowException(Exception::TypeError(
                String::NewFromUtf8(isolate, "Database path required", NewStringType::kNormal).ToLocalChecked()));
            return;
        }

        String::Utf8Value path(isolate, args[0]);
        
        try {
            Database* obj = new Database(*path);
            obj->Wrap(args.This());
            args.GetReturnValue().Set(args.This());
        } catch (const std::exception& e) {
            isolate->ThrowException(Exception::Error(
                String::NewFromUtf8(isolate, e.what(), NewStringType::kNormal).ToLocalChecked()));
        }
    } else {
        const int argc = 1;
        Local<Value> argv[argc] = { args[0] };
        Local<Function> cons = Local<Function>::New(isolate, constructor);
        Local<Object> result = cons->NewInstance(context, argc, argv).ToLocalChecked();
        args.GetReturnValue().Set(result);
    }
}

void Database::Prepare(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    Database* db = Unwrap(args.Holder());
    if (!db || !db->IsOpen()) {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "Database is closed", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "SQL string required", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    String::Utf8Value sql(isolate, args[0]);
    
    sqlite3_stmt* stmt;
    int rc = sqlite3_prepare_v3(db->db_, *sql, -1, 0, &stmt, nullptr);
    
    if (rc != SQLITE_OK) {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, sqlite3_errmsg(db->db_), NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    args.GetReturnValue().Set(Statement::NewInstance(isolate, stmt, db));
}

void Database::Exec(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    
    Database* db = Unwrap(args.Holder());
    if (!db || !db->IsOpen()) {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "Database is closed", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "SQL string required", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    String::Utf8Value sql(isolate, args[0]);
    
    char* errMsg = nullptr;
    int rc = sqlite3_exec(db->db_, *sql, nullptr, nullptr, &errMsg);
    
    if (rc != SQLITE_OK) {
        std::string error = errMsg ? errMsg : "Unknown error";
        if (errMsg) sqlite3_free(errMsg);
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, error.c_str(), NewStringType::kNormal).ToLocalChecked()));
        return;
    }
}

void Database::Close(const FunctionCallbackInfo<Value>& args) {
    Database* db = Unwrap(args.Holder());
    if (db && db->db_) {
        sqlite3_close(db->db_);
        db->db_ = nullptr;
    }
}

Database* Database::Unwrap(Local<Object> obj) {
    Local<External> external = Local<External>::Cast(obj->GetInternalField(0));
    return static_cast<Database*>(external->Value());
}

void Database::Wrap(Local<Object> obj) {
    obj->SetInternalField(0, v8::External::New(obj->GetIsolate(), this));
}
