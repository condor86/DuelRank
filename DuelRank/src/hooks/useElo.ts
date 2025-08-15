// src/hooks/useElo.ts
import { useEffect, useMemo, useState } from "react";
import { loadState, saveState, type PersistStateV1 } from "../storage";

export type Rating = { id: number; rating: number; games: number };

type IdLike = { id: number };

/**
 * 通用 Elo Hook：只要求 items 含 id:number
 * 会自动从本地存储加载/保存 rating 与出现次数（appear）
 */
export default function useElo<T extends IdLike>(items: T[]) {
  const loaded = loadState();

  const [ratings, setRatings] = useState<Rating[]>(() => {
    if (loaded) {
      return items.map((m) => {
        const r = loaded.ratings[m.id];
        return r
          ? { id: m.id, rating: r.rating, games: r.games }
          : { id: m.id, rating: 1000, games: 0 };
      });
    }
    return items.map((m) => ({ id: m.id, rating: 1000, games: 0 }));
  });

  const [appear, setAppear] = useState<Map<number, number>>(() => {
    const map = new Map<number, number>();
    if (loaded) {
      for (const k of Object.keys(loaded.appear || {})) {
        map.set(Number(k), loaded.appear[Number(k)]);
      }
    }
    return map;
  });

  // 当 items 变化时，补齐/裁剪 ratings 与 appear
  useEffect(() => {
    setRatings((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      return items.map(
        (m) => map.get(m.id) ?? { id: m.id, rating: 1000, games: 0 }
      );
    });
    setAppear((prev) => {
      const next = new Map<number, number>();
      const ids = new Set(items.map((m) => m.id));
      for (const [id, cnt] of prev.entries()) if (ids.has(id)) next.set(id, cnt);
      return next;
    });
  }, [items]);

  const get = (id: number) => ratings.find((r) => r.id === id);

  const update = (winnerId: number, loserId: number, k = 24) => {
    const Ra = get(winnerId)?.rating ?? 1000;
    const Rb = get(loserId)?.rating ?? 1000;
    const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
    const Eb = 1 - Ea;

    const newRa = Ra + k * (1 - Ea);
    const newRb = Rb + k * (0 - Eb);

    setRatings((prev) =>
      prev.map((r) => {
        if (r.id === winnerId)
          return { ...r, rating: newRa, games: r.games + 1 };
        if (r.id === loserId)
          return { ...r, rating: newRb, games: r.games + 1 };
        return r;
      })
    );

    setAppear((prev) => {
      const next = new Map(prev);
      next.set(winnerId, (next.get(winnerId) ?? 0) + 1);
      next.set(loserId, (next.get(loserId) ?? 0) + 1);
      return next;
    });
  };

  const sorted = useMemo(
    () => [...ratings].sort((a, b) => b.rating - a.rating),
    [ratings]
  );

  // 节流持久化
  useEffect(() => {
    const t = setTimeout(() => {
      const persist: PersistStateV1 = {
        version: 1,
        ratings: Object.fromEntries(
          ratings.map((r) => [r.id, { rating: r.rating, games: r.games }])
        ) as any,
        appear: Object.fromEntries(appear.entries()),
      };
      saveState(persist);
    }, 120);
    return () => clearTimeout(t);
  }, [ratings, appear]);

  return { ratings, sorted, update, appear };
}
