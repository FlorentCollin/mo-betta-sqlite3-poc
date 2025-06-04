#pragma once

#include <v8.h>
#include <node.h>
#include <sqlite3.h>
#include <vector>

class Database;

class Statement {
public:
    static void Init(v8::Local<v8::Object> exports);
    static v8::Local<v8::Object> NewInstance(v8::Isolate* isolate, sqlite3_stmt* stmt, Database* db);
    
    static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Step(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Get(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Finalize(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Iterate(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Iterator(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Next(const v8::FunctionCallbackInfo<v8::Value>& args);
    static void Reset(const v8::FunctionCallbackInfo<v8::Value>& args);

    sqlite3_stmt* GetStmt() const { return stmt_; }
    bool IsValid() const { return stmt_ != nullptr; }

private:
    Statement(sqlite3_stmt* stmt, Database* db);
    ~Statement();

    static v8::Persistent<v8::Function> constructor;
    sqlite3_stmt* stmt_;
    Database* db_;
    
    // Cached column names for performance
    std::vector<v8::Global<v8::String>> cached_column_names_;
    bool column_names_initialized_;
    
    v8::Local<v8::Value> GetColumnValue(v8::Isolate* isolate, int columnIndex);
    v8::Local<v8::Object> GetCurrentRow(v8::Isolate* isolate);
    void InitializeColumnNames(v8::Isolate* isolate);
    
    static Statement* Unwrap(v8::Local<v8::Object> obj);
    void Wrap(v8::Local<v8::Object> obj);
};
