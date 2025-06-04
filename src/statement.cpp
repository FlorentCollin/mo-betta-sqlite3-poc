#include "statement.h"
#include "database.h"
#include "external_string.h"
#include <node_buffer.h>

using v8::BigInt;
using v8::Boolean;
using v8::Context;
using v8::Exception;
using v8::External;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Null;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Symbol;
using v8::Value;

Persistent<Function> Statement::constructor;

Statement::Statement(sqlite3_stmt *stmt, Database *db) : stmt_(stmt), db_(db), column_names_initialized_(false)
{
}

Statement::~Statement()
{
    // Clear cached column names
    for (auto &name : cached_column_names_)
    {
        name.Reset();
    }
    cached_column_names_.clear();

    if (stmt_)
    {
        sqlite3_finalize(stmt_);
        stmt_ = nullptr;
    }
}

void Statement::Init(Local<Object> exports)
{
    Isolate *isolate = exports->GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();

    Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
    tpl->SetClassName(String::NewFromUtf8(isolate, "Statement", NewStringType::kNormal).ToLocalChecked());
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(tpl, "step", Step);
    NODE_SET_PROTOTYPE_METHOD(tpl, "get", Get);
    NODE_SET_PROTOTYPE_METHOD(tpl, "finalize", Finalize);
    NODE_SET_PROTOTYPE_METHOD(tpl, "iterate", Iterate);
    NODE_SET_PROTOTYPE_METHOD(tpl, "next", Next);
    NODE_SET_PROTOTYPE_METHOD(tpl, "reset", Reset);

    // Set up Symbol.iterator
    tpl->PrototypeTemplate()->Set(Symbol::GetIterator(isolate), FunctionTemplate::New(isolate, Iterator));

    Local<Function> constructor_local = tpl->GetFunction(context).ToLocalChecked();
    constructor.Reset(isolate, constructor_local);
    exports->Set(context, String::NewFromUtf8(isolate, "Statement", NewStringType::kNormal).ToLocalChecked(),
                 constructor_local)
        .FromJust();
}

Local<Object> Statement::NewInstance(Isolate *isolate, sqlite3_stmt *stmt, Database *db)
{
    Local<Context> context = isolate->GetCurrentContext();
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> instance = cons->NewInstance(context, 0, nullptr).ToLocalChecked();

    Statement *statement = new Statement(stmt, db);
    statement->Wrap(instance);

    return instance;
}

void Statement::New(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    if (args.IsConstructCall())
    {
        args.GetReturnValue().Set(args.This());
    }
    else
    {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "Statement constructor called without new", NewStringType::kNormal).ToLocalChecked()));
    }
}

void Statement::Step(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    Statement *stmt = Unwrap(args.Holder());
    if (!stmt || !stmt->IsValid())
    {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "Statement is finalized", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    int rc = sqlite3_step(stmt->stmt_);

    if (rc == SQLITE_ROW)
    {
        args.GetReturnValue().Set(Boolean::New(isolate, true));
    }
    else if (rc == SQLITE_DONE)
    {
        args.GetReturnValue().Set(Boolean::New(isolate, false));
    }
    else
    {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, sqlite3_errmsg(sqlite3_db_handle(stmt->stmt_)), NewStringType::kNormal).ToLocalChecked()));
    }
}

void Statement::Get(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    Statement *stmt = Unwrap(args.Holder());
    if (!stmt || !stmt->IsValid())
    {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "Statement is finalized", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    if (sqlite3_data_count(stmt->stmt_) == 0)
    {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "No row available", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    int colIndex;
    if (args[0]->IsString())
    {
        String::Utf8Value colName(isolate, args[0]);
        int colCount = sqlite3_column_count(stmt->stmt_);
        colIndex = -1;
        for (int i = 0; i < colCount; i++)
        {
            const char *name = sqlite3_column_name(stmt->stmt_, i);
            if (name && strcmp(name, *colName) == 0)
            {
                colIndex = i;
                break;
            }
        }
        if (colIndex == -1)
        {
            isolate->ThrowException(Exception::RangeError(
                String::NewFromUtf8(isolate, "Column name not found", NewStringType::kNormal).ToLocalChecked()));
            return;
        }
    }
    else
    {
        colIndex = args[0]->Int32Value(isolate->GetCurrentContext()).FromMaybe(0);
    }

    if (colIndex < 0 || colIndex >= sqlite3_column_count(stmt->stmt_))
    {
        isolate->ThrowException(Exception::RangeError(
            String::NewFromUtf8(isolate, "Column index out of range", NewStringType::kNormal).ToLocalChecked()));
        return;
    }

    args.GetReturnValue().Set(stmt->GetColumnValue(isolate, colIndex));
}

void Statement::Finalize(const FunctionCallbackInfo<Value> &args)
{
    Statement *stmt = Unwrap(args.Holder());
    if (stmt && stmt->stmt_)
    {
        sqlite3_finalize(stmt->stmt_);
        stmt->stmt_ = nullptr;
    }
}

void Statement::Iterate(const FunctionCallbackInfo<Value> &args)
{
    args.GetReturnValue().Set(args.Holder());
}

void Statement::Iterator(const FunctionCallbackInfo<Value> &args)
{
    args.GetReturnValue().Set(args.Holder());
}

void Statement::Next(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();

    Statement *stmt = Unwrap(args.Holder());
    if (!stmt || !stmt->IsValid())
    {
        Local<Object> result = Object::New(isolate);
        result->Set(context, String::NewFromUtf8(isolate, "done", NewStringType::kNormal).ToLocalChecked(),
                    Boolean::New(isolate, true))
            .Check();
        args.GetReturnValue().Set(result);
        return;
    }

    int rc = sqlite3_step(stmt->stmt_);

    if (rc == SQLITE_ROW)
    {
        Local<Object> result = Object::New(isolate);
        result->Set(context, String::NewFromUtf8(isolate, "value", NewStringType::kNormal).ToLocalChecked(),
                    stmt->GetCurrentRow(isolate))
            .Check();
        result->Set(context, String::NewFromUtf8(isolate, "done", NewStringType::kNormal).ToLocalChecked(),
                    Boolean::New(isolate, false))
            .Check();
        args.GetReturnValue().Set(result);
    }
    else if (rc == SQLITE_DONE)
    {
        sqlite3_reset(stmt->stmt_);
        Local<Object> result = Object::New(isolate);
        result->Set(context, String::NewFromUtf8(isolate, "done", NewStringType::kNormal).ToLocalChecked(),
                    Boolean::New(isolate, true))
            .Check();
        args.GetReturnValue().Set(result);
    }
    else
    {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, sqlite3_errmsg(sqlite3_db_handle(stmt->stmt_)), NewStringType::kNormal).ToLocalChecked()));
    }
}

void Statement::Reset(const FunctionCallbackInfo<Value> &args)
{
    Statement *stmt = Unwrap(args.Holder());
    if (stmt && stmt->IsValid())
    {
        sqlite3_reset(stmt->stmt_);
    }
}

inline v8::Local<v8::Value> SqliteColumnToJS(v8::Isolate *isolate, sqlite3_stmt *stmt, int index)
{
    using namespace v8;

    int type = sqlite3_column_type(stmt, index);
    switch (type)
    {
    case SQLITE_INTEGER:
    {
        sqlite3_int64 ival = sqlite3_column_int64(stmt, index);
        if (ival >= -9007199254740992LL && ival <= 9007199254740992LL)
        {
            return Number::New(isolate, static_cast<double>(ival));
        }
        else
        {
            return BigInt::New(isolate, ival);
        }
    }
    case SQLITE_FLOAT:
        return Number::New(isolate, sqlite3_column_double(stmt, index));
    case SQLITE_TEXT:
    {
        const char *text = reinterpret_cast<const char *>(sqlite3_column_text(stmt, index));
        int bytes = sqlite3_column_bytes(stmt, index);
        if (!text || bytes == 0)
        {
            return String::Empty(isolate);
        }

        return String::NewFromUtf8(isolate, text, NewStringType::kNormal, bytes).ToLocalChecked();
    }
    case SQLITE_BLOB:
    {
        const void *blob = sqlite3_column_blob(stmt, index);
        int len = sqlite3_column_bytes(stmt, index);
        if (!blob || len == 0)
        {
            return node::Buffer::New(isolate, 0).ToLocalChecked();
        }
        return node::Buffer::Copy(isolate, static_cast<const char *>(blob), len).ToLocalChecked();
    }
    default:
        return Null(isolate);
    }
}
Local<Value> Statement::GetColumnValue(Isolate *isolate, int columnIndex)
{
    return SqliteColumnToJS(isolate, stmt_, columnIndex);
}

void Statement::InitializeColumnNames(Isolate *isolate)
{
    if (column_names_initialized_)
        return;

    int colCount = sqlite3_column_count(stmt_);
    cached_column_names_.reserve(colCount);

    for (int i = 0; i < colCount; i++)
    {
        const char *colName = sqlite3_column_name(stmt_, i);
        Local<String> nameStr = String::NewFromUtf8(isolate, colName, NewStringType::kInternalized).ToLocalChecked();
        cached_column_names_.emplace_back(isolate, nameStr);
    }

    column_names_initialized_ = true;
}

Local<Object> Statement::GetCurrentRow(Isolate *isolate)
{
    Local<Context> context = isolate->GetCurrentContext();
    Local<Object> row = Object::New(isolate);

    // Initialize column names cache if needed
    if (!column_names_initialized_)
    {
        InitializeColumnNames(isolate);
    }

    int colCount = sqlite3_column_count(stmt_);
    for (int i = 0; i < colCount; i++)
    {
        Local<String> colName = cached_column_names_[i].Get(isolate);
        Local<Value> value = SqliteColumnToJS(isolate, stmt_, i);

        row->Set(context, colName, value).Check();
    }

    return row;
}

Statement *Statement::Unwrap(Local<Object> obj)
{
    Local<External> external = Local<External>::Cast(obj->GetInternalField(0));
    return static_cast<Statement *>(external->Value());
}

void Statement::Wrap(Local<Object> obj)
{
    obj->SetInternalField(0, External::New(obj->GetIsolate(), this));
}
