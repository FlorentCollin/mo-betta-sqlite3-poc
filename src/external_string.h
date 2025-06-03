#pragma once

#include <v8.h>
#include <cstddef>

class SQLiteExternalString : public v8::String::ExternalStringResource {
public:
    SQLiteExternalString(const uint16_t* data, size_t length);
    ~SQLiteExternalString() override = default;

    const uint16_t* data() const override;
    size_t length() const override;
    void Dispose() override;

private:
    const uint16_t* data_;
    size_t length_;
};
