{
  "targets": [
    {
      "target_name": "mo_betta_sqlite3",
      "sources": [
        "src/addon.cpp",
        "src/database.cpp",
        "src/statement.cpp",
        "src/external_string.cpp",
        "deps/sqlite3/sqlite3.c"
      ],
      "include_dirs": [
        "deps/sqlite3",
        "src"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "cflags_cc": ["-std=c++20", "-O3"],
      "defines": [
        "SQLITE_THREADSAFE=0",
        "SQLITE_ENABLE_COLUMN_METADATA",
        "SQLITE_OMIT_LOAD_EXTENSION",
        "SQLITE_ENABLE_JSON1"
      ],
      "conditions": [
        ["OS=='win'", {
          "actions": [{
            "action_name": "error_on_windows",
            "inputs": [],
            "outputs": ["error"],
            "action": ["echo", "Windows is not supported"]
          }]
        }],
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CPLUSPLUSFLAGS": ["-std=c++20", "-stdlib=libc++"],
            "GCC_OPTIMIZATION_LEVEL": "3",
            "GCC_GENERATE_DEBUGGING_SYMBOLS": "NO",
            "DEAD_CODE_STRIPPING": "YES",
            "GCC_INLINES_ARE_PRIVATE_EXTERN": "YES",
          }
        }],
        ["OS=='linux'", {
          "cflags_cc": ["-std=c++20"]
        }]
      ]
    }
  ]
}
