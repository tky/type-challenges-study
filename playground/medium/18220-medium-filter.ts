/*
  18220 - Filter
  -------
  by Mu-Hun (@mu-hun) #中級 #array #filter

  ### 質問

  Implement the type `Filter<T, Predicate>`. Here `T` is an array, and `Predicate` is a primitive type or a union of primitive types. The result should be an array that contains only those elements whose types are included in `Predicate`.

  > GitHubで確認する：https://tsch.js.org/18220/ja
*/

/* _____________ ここにコードを記入 _____________ */

type Filter<T extends any[], P> = []

/* _____________ テストケース _____________ */
import type { Equal, Expect } from '@type-challenges/utils'

type Falsy = false | 0 | '' | null | undefined

type cases = [
  Expect<Equal<Filter<[0, 1, 2], 2>, [2]>>,
  Expect<Equal<Filter<[0, 1, 2], 0 | 1>, [0, 1]>>,
  Expect<Equal<Filter<[0, 1, 2], Falsy>, [0]>>,
]

/* _____________ 次のステップ _____________ */
/*
  > 解答を共有する：https://tsch.js.org/18220/answer/ja
  > 解答を見る：https://tsch.js.org/18220/solutions
  > その他の課題：https://tsch.js.org/ja
*/
