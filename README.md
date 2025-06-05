# mo-betta-sqlite3
PoC based on https://x.com/aboodman/status/1929621162679730291

# Install
```
bun install
```

# Rebuild the C++ bindings
```
bun run build
```

# Benchmarks
```
node benchmarks/setup-data.js && hyperfine --warmup 7 \
        'node benchmarks/read-mo-betta.js benchmark-utf16.db' \
        'node benchmarks/read-mo-betta.js benchmark-utf8.db' \
        'node benchmarks/read-better-sqlite3.js benchmark-utf16.db' \
        'node benchmarks/read-better-sqlite3.js benchmark-utf8.db' \
        'bun benchmarks/read-bun.js benchmark-utf16.db' \
        'bun benchmarks/read-bun.js benchmark-utf8.db'
```

Here are the results when I ran the benchmark on my M1 Max.
```
Benchmark 1: node benchmarks/read-mo-betta.js benchmark-utf16.db
  Time (mean ± σ):     132.8 ms ±   5.0 ms    [User: 80.5 ms, System: 51.4 ms]
  Range (min … max):   128.8 ms … 152.6 ms    22 runs
 
Benchmark 2: node benchmarks/read-mo-betta.js benchmark-utf8.db
  Time (mean ± σ):     164.2 ms ±   2.1 ms    [User: 119.7 ms, System: 43.9 ms]
  Range (min … max):   161.0 ms … 169.2 ms    17 runs
 
Benchmark 3: node benchmarks/read-better-sqlite3.js benchmark-utf16.db
  Time (mean ± σ):     229.2 ms ±   2.5 ms    [User: 176.1 ms, System: 52.8 ms]
  Range (min … max):   223.5 ms … 233.3 ms    12 runs
 
Benchmark 4: node benchmarks/read-better-sqlite3.js benchmark-utf8.db
  Time (mean ± σ):     140.9 ms ±   3.5 ms    [User: 90.8 ms, System: 49.9 ms]
  Range (min … max):   136.4 ms … 149.3 ms    21 runs
 
Benchmark 5: bun benchmarks/read-bun.js benchmark-utf16.db
  Time (mean ± σ):     206.7 ms ±   6.2 ms    [User: 158.4 ms, System: 52.2 ms]
  Range (min … max):   201.8 ms … 227.5 ms    14 runs
 
  Warning: Statistical outliers were detected. Consider re-running this benchmark on a quiet system without any interferences from other programs. It might help to use the '--warmup' or '--prepare' options.
 
Benchmark 6: bun benchmarks/read-bun.js benchmark-utf8.db
  Time (mean ± σ):      86.2 ms ±   1.3 ms    [User: 51.2 ms, System: 39.5 ms]
  Range (min … max):    83.3 ms …  89.3 ms    33 runs
 
Summary
  bun benchmarks/read-bun.js benchmark-utf8.db ran
    1.54 ± 0.06 times faster than node benchmarks/read-mo-betta.js benchmark-utf16.db
    1.63 ± 0.05 times faster than node benchmarks/read-better-sqlite3.js benchmark-utf8.db
    1.91 ± 0.04 times faster than node benchmarks/read-mo-betta.js benchmark-utf8.db
    2.40 ± 0.08 times faster than bun benchmarks/read-bun.js benchmark-utf16.db
    2.66 ± 0.05 times faster than node benchmarks/read-better-sqlite3.js benchmark-utf16.db
```

It seems that the PRAGMA to set the encoding to UTF16 has a great impact on the performance which is logic because there must be the conversion when using one or the other string encoding.