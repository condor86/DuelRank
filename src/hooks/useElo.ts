// src/hooks/useElo.ts
import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadState,
  saveState,
  type PersistStateV1,
} from "../storage";
import {
  ELO_INITIAL_RATING,
  ELO_K_FACTOR,
} from "../constants";

type Rating = { id: number; rating: number; games: number };

export default function useElo(items: { id: number }[]) {
  /** 是否已完成从 localStorage 的一次性恢复（避免用空 items 覆盖本地） */
  const [hydrated, setHydrated] = useState(false);

  /** 评分表 */
  const [ratings, setRatings] = useState<Rating[]>(() =>
    items.map((m) => ({ id: m.id, rating: ELO_INITIAL_RATING, games: 0 }))
  );

  /** 出场计数 */
  const [appear, setAppear] = useState<Map<number, number>>(() => new Map());

  /** 一次性恢复：等 items 到位（length > 0）后，从本地加载并对齐当前 items */
  useEffect(() => {
    if (hydrated) return;
    if (items.length === 0) return;

    const loaded = loadState();

    if (loaded) {
      // 用本地分数恢复；对不存在的 id 给默认值
      setRatings(
        items.map((m) => {
          const r = loaded.ratings[m.id];
          return r
            ? { id: m.id, rating: r.rating, games: r.games }
            : { id: m.id, rating: ELO_INITIAL_RATING, games: 0 };
        })
      );
      const ap = new Map<number, number>();
      for (const k of Object.keys(loaded.appear || {})) {
        ap.set(Number(k), loaded.appear[Number(k)]);
      }
      setAppear(ap);
    } else {
      // 本地没有存档：按默认值初始化
      setRatings(items.map((m) => ({ id: m.id, rating: ELO_INITIAL_RATING, games: 0 })));
      setAppear(new Map());
    }

    setHydrated(true); // ✅ 只做这一遍
  }, [items, hydrated]);

  /** items 变化（新增/删除机体）后的迁移对齐 —— 只在已 hydrate 后生效 */
  useEffect(() => {
    if (!hydrated) return;

    setRatings((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      return items.map(
        (m) => map.get(m.id) ?? { id: m.id, rating: ELO_INITIAL_RATING, games: 0 }
      );
    });

    setAppear((prev) => {
      const next = new Map<number, number>();
      const ids = new Set(items.map((m) => m.id));
      for (const [id, cnt] of prev.entries()) if (ids.has(id)) next.set(id, cnt);
      return next;
    });
  }, [items, hydrated]);

  const get = (id: number) => ratings.find((r) => r.id === id)!;

  /** 胜负更新 */
  const update = (winnerId: number, loserId: number, k = ELO_K_FACTOR) => {
    const Ra = get(winnerId)?.rating ?? ELO_INITIAL_RATING;
    const Rb = get(loserId)?.rating ?? ELO_INITIAL_RATING;
    const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
    const Eb = 1 - Ea;

    const newRa = Ra + k * (1 - Ea);
    const newRb = Rb + k * (0 - Eb);

    setRatings((prev) =>
      prev.map((r) => {
        if (r.id === winnerId) return { ...r, rating: newRa, games: r.games + 1 };
        if (r.id === loserId)  return { ...r, rating: newRb, games: r.games + 1 };
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

  /** 平局更新（备用） */
  const draw = (idA: number, idB: number, k = ELO_K_FACTOR) => {
    const Ra = get(idA)?.rating ?? ELO_INITIAL_RATING;
    const Rb = get(idB)?.rating ?? ELO_INITIAL_RATING;
    const Ea = 1 / (1 + Math.pow(10, (Rb - Ra) / 400));
    const Eb = 1 - Ea;

    const newRa = Ra + k * (0.5 - Ea);
    const newRb = Rb + k * (0.5 - Eb);

    setRatings((prev) =>
      prev.map((r) => {
        if (r.id === idA) return { ...r, rating: newRa, games: r.games + 1 };
        if (r.id === idB) return { ...r, rating: newRb, games: r.games + 1 };
        return r;
      })
    );

    setAppear((prev) => {
      const next = new Map(prev);
      next.set(idA, (next.get(idA) ?? 0) + 1);
      next.set(idB, (next.get(idB) ?? 0) + 1);
      return next;
    });
  };

  const sorted = useMemo(
    () => [...ratings].sort((a, b) => b.rating - a.rating),
    [ratings]
  );

  /** 持久化 —— 只在完成 hydrate 后保存，避免把默认值覆盖到本地 */
  useEffect(() => {
    if (!hydrated) return;
    const persist: PersistStateV1 = {
      version: 1,
      ratings: Object.fromEntries(
        ratings.map((r) => [r.id, { rating: r.rating, games: r.games }])
      ) as any,
      appear: Object.fromEntries(appear.entries()),
    };
    saveState(persist);
  }, [ratings, appear, hydrated]);

  return { ratings, sorted, update, draw, appear };
}
