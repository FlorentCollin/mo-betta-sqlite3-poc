#pragma once

#include <v8.h>
#include <node.h>
#include <sqlite3.h>
#include <memory>

class Database {
public:
    static void Init(v8::Local<v8::Object> exports);
    static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Prepare(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Exec(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Close(const v8::FunctionCallbackInfo<v8::Value>& args);

    sqlite3* GetDb() const { return db_; }
    bool IsOpen() const { return db_ != nullptr; }

private:
    Database(const char* filename);
    ~Database();

    static v8::Persistent<v8::Function> constructor;
    sqlite3* db_;
    
    static Database* Unwrap(v8::Local<v8::Object> obj);
    void Wrap(v8::Local<v8::Object> obj);
};
