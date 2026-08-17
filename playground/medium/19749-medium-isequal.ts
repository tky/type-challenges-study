/*
  19749 - IsEqual
  -------
  by Takahiro Kato (@doz13189) #中級 #utils

  ### 質問

  Implements the equal operator that returns a boolean for whether the two given types are equal.

  For example:

  ```ts
  type X1 = 1
  type Y1 = 1
  type T1 = IsEqual<X1, Y1> // expected to be true

  type X2 = 1
  type Y2 = 2
  type T2 = IsEqual<X2, Y2> // expected to be false
  ```

  > GitHubで確認する：https://tsch.js.org/19749/ja
*/

/* _____________ ここにコードを記入 _____________ */

type IsEqual<X, Y> = any

/* _____________ テストケース _____________ */
import type { Equal, Expect } from '@type-challenges/utils'

type cases = [
  Expect<Equal<IsEqual<number, string>, false>>,
  Expect<Equal<IsEqual<1, 1>, true>>,
  Expect<Equal<IsEqual<any, 1>, false>>,
  Expect<Equal<IsEqual<1 | 2, 1>, false>>,
  Expect<Equal<IsEqual<any, never>, false>>,
  Expect<Equal<IsEqual<[any], [number]>, false>>,
]

/* _____________ 次のステップ _____________ */
/*
  > 解答を共有する：https://tsch.js.org/19749/answer/ja
  > 解答を見る：https://tsch.js.org/19749/solutions
  > その他の課題：https://tsch.js.org/ja
*/
