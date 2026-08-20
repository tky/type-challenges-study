import type { Equal } from '@type-challenges/utils'

// 候補A: 三項演算子チェーン風（? と : を行頭に揃える）
type IncludesA<T extends readonly any[], U> = T extends readonly [infer V, ...infer Rest]
  ? Equal<V, U> extends true
    ? true
    : IncludesA<Rest, U>
  : false

// 候補B: 外側だけ改行、内側は1行
type IncludesB<T extends readonly any[], U> = T extends readonly [infer V, ...infer Rest]
  ? (Equal<V, U> extends true ? true : IncludesB<Rest, U>)
  : false

// 候補C: 補助型に切り出す
type IncludesC<T extends readonly any[], U> = T extends readonly [infer V, ...infer Rest]
  ? Equal<V, U> extends true ? true : IncludesC<Rest, U>
  : false
