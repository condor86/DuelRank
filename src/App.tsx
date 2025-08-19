// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";

import { exportState, importStateFromText, resetState } from "./storage";
import useElo from "./hooks/useElo";
import pickPair from "./utils/pickPair";

import NavBar from "./components/NavBar";
import HeaderBar from "./components/HeaderBar";
import DuelGrid from "./components/DuelGrid";
import RankTable from "./components/RankTable";

import {
  CARD_ASPECT,
  DATA_URL,
  SERIES_URL,
  EXPORT_FILENAME,
  LOAD_TIMEOUT_MS,
} from "./constants";

/* ===== DEV 全局错误日志（只在开发环境注册一次） ===== */
if (import.meta.env.DEV) {
  // @ts-ignore
  if (!window.__duelrank_err_hook__) {
    // @ts-ignore
    window.__duelrank_err_hook__ = true;
    window.addEventListener("error", (e) => {
      console.error("[window error]", e.error || e.message);
    });
    window.addEventListener("unhandledrejection", (e) => {
      console.error("[unhandledrejection]", e.reason);
    });
  }
}

/* ===== 类型定义 ===== */
type Classification = "MS" | "MA" | "MD" | "MW" | string;

type MobileWeapon = {
  id: number;

  // 新增：拆分后的两段标题（可选）
  code?: string;        // 例：RX-78-2
  modelName?: string;   // 例：GUNDAM / Hi-ν GUNDAM
  // 兼容旧字段（方法A会在加载时补齐为 code + ' ' + modelName）
  name?: string;

  // 其它字段
  kana?: string;
  classification: Classification;
  series?: string;
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number; // 0-100：0=最左/最上；50=居中；100=最右/最下
};

type SeriesEntry = {
  name: string;
  logoUrl?: string;
  logo_url?: string;
};

/* 辅助：生成展示名（供方法A使用） */
const makeDisplayName = (x: Partial<MobileWeapon>) =>
  [x.code, x.modelName].filter(Boolean).join(" ").trim() || x.name || "";

/* ===== 主组件 ===== */
export default function App() {
  // 加载数据（机体 + 作品 LOGO）
  const [data, setData] = useState<MobileWeapon[] | null>(null);
  const [seriesMap, setSeriesMap] = useState<Map<string, string> | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchJson = async (url: string) => {
      console.debug("[fetch] ->", url);
      const res = await fetch(url, { cache: "no-store" });
      console.debug("[fetch] <-", url, res.status, res.statusText);
      if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
      return res.json();
    };

    // 兜底：防止一直卡“正在加载…”
    const tFailSafe = setTimeout(() => {
      if (!cancelled && (!data || !seriesMap)) {
        console.warn("[load timeout] public/MobileWeapons.json 或 Series.json 可能无法访问");
        setLoadErr("资源加载超时：请检查 public/MobileWeapons.json 与 Series.json 是否可访问。");
      }
    }, LOAD_TIMEOUT_MS);

    Promise.all([fetchJson(DATA_URL), fetchJson(SERIES_URL)])
      .then(([list, sList]: [MobileWeapon[], SeriesEntry[]]) => {
        if (cancelled) return;

        // === 方法A：在加载阶段补齐 name（若缺） ===
        const normalized: MobileWeapon[] = (list ?? []).map((m) => {
          const display = makeDisplayName(m);
          return { ...m, name: m.name ?? display };
        });

        // 过滤有效项：id + imgUrl + （name 现在已补齐）
        const ok = normalized.filter(
          (m) => Number.isFinite(m.id) && !!m.imgUrl && !!(m.name && m.name.trim())
        );
        if (ok.length === 0) {
          throw new Error("MobileWeapons.json 为空或格式不正确（至少需要 id/imgUrl，且能生成展示名）");
        }
        setData(ok);

        // 作品名 -> logoUrl 映射
        const m = new Map<string, string>();
        for (const s of sList ?? []) {
          const url = (s.logoUrl ?? s.logo_url ?? "") as string;
          if (s.name && url) m.set(s.name, url);
        }
        setSeriesMap(m);
      })
      .catch((e) => {
        console.error("[load error]", e);
        setLoadErr(e?.message || "数据加载失败");
      })
      .finally(() => clearTimeout(tFailSafe));

    return () => {
      cancelled = true;
      clearTimeout(tFailSafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: MobileWeapon[] = data ?? [];
  const { sorted, update, appear } = useElo(items);

  // 对战 pair
  const [pair, setPair] = useState<[MobileWeapon, MobileWeapon] | null>(null);
  useEffect(() => {
    if (items.length >= 2) setPair(pickPair(items, appear));
    else setPair(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, appear]);

  const reshuffle = () => {
    if (items.length >= 2) setPair(pickPair(items, appear));
  };

  // 导出/导入/重置
  const handleExport = () => {
    const txt = exportState();
    const blob = new Blob([txt], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = EXPORT_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importStateFromText(String(reader.result ?? "")); // 成功后直接刷新
      if (ok) location.reload();
      else alert("导入失败：文件内容不合法或版本不匹配。");
    };
    reader.readAsText(file, "utf-8");
  };

  const handleReset = () => {
    if (confirm("确认重置本地 Elo 数据吗？此操作不可撤销。")) {
      resetState();
      location.reload();
    }
  };

  /* ===== 渲染 ===== */

  if (loadErr) {
    return <div style={{ padding: 24, color: "#fff" }}>数据加载失败：{loadErr}</div>;
  }
  if (!data || !seriesMap) {
    return <div style={{ padding: 24, color: "#fff" }}>正在加载数据…</div>;
  }
  if (items.length < 2) {
    return (
      <div style={{ padding: 24, color: "#fff", lineHeight: 1.6 }}>
        机体数据不足（当前 {items.length} 条）。<br />
        请在 <code>public/MobileWeapons.json</code> 中至少添加 2 条记录；并确认 <code>public/Series.json</code> 中包含对应作品与 logoUrl。
      </div>
    );
  }

  const logoFor = (series?: string) => (series ? seriesMap.get(series) : undefined);

  return (
    <div className="page">
      {/* 顶部导航 */}
      <NavBar activeTab="Mobile Weapons" />

      {/* 主体 */}
      <main className="page-inner container">
        {/* 标题区 + 操作 */}
        <HeaderBar
          onReshuffle={reshuffle}
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleReset}
        />

        {/* 对比区域 */}
        {pair && (
          <DuelGrid
            left={pair[0]}
            right={pair[1]}
            leftLogoUrl={logoFor(pair[0].series)}
            rightLogoUrl={logoFor(pair[1].series)}
            containerAspect={CARD_ASPECT}
            onVoteLeft={() => {
              update(pair[0].id, pair[1].id);
              reshuffle();
            }}
            onVoteRight={() => {
              update(pair[1].id, pair[0].id);
              reshuffle();
            }}
            onSkip={reshuffle} // 中间栏“跳过这一组”作为唯一换组入口
          />
        )}

        {/* 排行榜 */}
        <section className="rank">
          <div className="rank-head">
            <div className="rank-title">排行榜</div>
            <button className="btn btn-ghost" onClick={reshuffle}>再来一组</button>
          </div>
          <RankTable items={items} sorted={sorted} />
        </section>
      </main>
    </div>
  );
}
