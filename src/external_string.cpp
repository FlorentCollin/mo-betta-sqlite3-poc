#include "external_string.h"

SQLiteExternalString::SQLiteExternalString(const uint16_t* data, size_t length)
    : data_(data), length_(length) {
}

const uint16_t* SQLiteExternalString::data() const {
    return data_;
}

size_t SQLiteExternalString::length() const {
    return length_;
}

void SQLiteExternalString::Dispose() {
    // Do not delete data_ as it's owned by SQLite
    // This is called when V8 GC no longer needs the string
}
