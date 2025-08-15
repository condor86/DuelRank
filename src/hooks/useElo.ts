// src/hooks/useElo.ts
import { useEffect, useMemo, useState } from "react";
import {
  loadState,
  saveState,
  type PersistStateV1,
} from "../storage";
import {
  ELO_INITIAL_RATING,
  ELO_K_FACTOR,
  PERSIST_DEBOUNCE_MS,
} from "../constants";

type Rating = { id: number; rating: number; games: number };

export default function useElo(items: { id: number }[]) {
  const loaded = loadState();

  const [ratings, setRatings] = useState<Rating[]>(() => {
    if (loaded) {
      return items.map((m) => {
        const r = loaded.ratings[m.id];
        return r
          ? { id: m.id, rating: r.rating, games: r.games }
          : { id: m.id, rating: ELO_INITIAL_RATING, games: 0 };
      });
    }
    return items.map((m) => ({ id: m.id, rating: ELO_INITIAL_RATING, games: 0 }));
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

  // 当 items 变化时，对齐已有的评分 & 出场
  useEffect(() => {
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
  }, [items]);

  const get = (id: number) => ratings.find((r) => r.id === id)!;

  /** 胜负更新（winnerId 胜，loserId 负） */
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

  /** 平局（双方各 0.5）—— 备用：如果以后“我全都喜欢”要计为 draw 可直接用 */
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

  // 持久化（防抖）
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
    }, PERSIST_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [ratings, appear]);

  return { ratings, sorted, update, draw, appear };
}
