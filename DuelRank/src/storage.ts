// src/storage.ts
export type PersistRating = { rating: number; games: number };
export type PersistStateV1 = {
  version: 1;
  ratings: Record<number, PersistRating>; // key 是 mecha.id
  appear: Record<number, number>;         // 出场计数（可选）
};

const KEY = "duelrank.v1";

export function loadState(): PersistStateV1 | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // 兼容/校验
    if (data && typeof data === "object" && data.version === 1) {
      return data as PersistStateV1;
    }
    return null; // 版本不匹配就忽略
  } catch {
    return null;
  }
}

export function saveState(state: PersistStateV1) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 存储满了或隐私模式会失败，先忽略
  }
}

export function resetState() {
  localStorage.removeItem(KEY);
}

export function exportState(): string {
  const raw = localStorage.getItem(KEY) ?? "";
  return raw || JSON.stringify({ version: 1, ratings: {}, appear: {} } as PersistStateV1);
}

export function importStateFromText(text: string): boolean {
  try {
    const data = JSON.parse(text);
    if (data && typeof data === "object" && data.version === 1) {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
