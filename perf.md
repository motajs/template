# `Map.getOrInsert` vs `Map.getOrInsertComputed`

- 使用 `Map.getOrInsert`: 数字、短字符串（约 100 以内）、布尔值、空数组、空对象、对象引用
- 使用 `Map.getOrInsertComputed`: 长字符串、空 Set、空 Map、自定义类构建出的实例（new Class()）、有内容的数组、有内容的对象、有内容的 Set、有内容的 Map。
- 使用哪个都可以: 函数

注：如果是直接传引用，那么用 `Map.getOrInsert`，以上对比的是现场构建条件下的性能表现，而非直接传入引用，对比直接传入引用没有任何意义。

Benchmark:

- [Benchmark1](https://www.measurethat.net/Benchmarks/Show/35964/1/getorinsert-vs-getorinsertcomputed-1)
- [Benchmark2](https://www.measurethat.net/Benchmarks/Show/35965/1/getorinsert-vs-getorinsertcomputed-2)
- [Benchmark3](https://www.measurethat.net/Benchmarks/Show/35966/1/getorinsert-vs-getorinsertcomputed-3)
