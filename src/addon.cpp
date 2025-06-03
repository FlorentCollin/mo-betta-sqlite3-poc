#include <node.h>
#include <v8.h>
#include "database.h"
#include "statement.h"

using v8::Local;
using v8::Object;

void InitAll(Local<Object> exports) {
    Database::Init(exports);
    Statement::Init(exports);
}

NODE_MODULE(mo_betta_sqlite3, InitAll)
