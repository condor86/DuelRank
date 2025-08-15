// src/utils/pickPair.ts

export type IdLike = { id: number };

/**
 * 从给定池中抽取两项，尽量均衡出现次数（根据 historyCount）。
 * 泛型 T 只要求包含 id:number，可与任意实体类型搭配使用。
 */
export default function pickPair<T extends IdLike>(
  pool: T[],
  historyCount: Map<number, number>
): [T, T] {
  const count = (id: number) => historyCount.get(id) ?? 0;
  const min = pool.reduce((m, x) => Math.min(m, count(x.id)), Infinity);

  let cand = pool.filter((x) => count(x.id) === min);
  if (cand.length < 2) cand = pool.filter((x) => count(x.id) <= min + 1);
  if (cand.length < 2) cand = [...pool];

  const a = Math.floor(Math.random() * cand.length);
  let b = Math.floor(Math.random() * cand.length);
  while (b === a) b = Math.floor(Math.random() * cand.length);

  return [cand[a], cand[b]];
}
