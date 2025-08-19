// src/App.tsx
import { useEffect, useMemo, useState } from "react";
//import "./App.css";
import "./styles/index.css";

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
  ORGS_URL,           // ← 新增
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

  // 新结构：两段标题
  code?: string;
  modelName?: string;
  name?: string;            // 兼容旧字段（加载时会补齐）

  kana?: string;
  classification: Classification;

  series?: string;          // 用于取系列 LOGO（不再显示文字）
  organization?: string;    // ← 新增：所属组织，用于取组织 LOGO

  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number; // 0~100
};

type SeriesEntry = { name: string; logoUrl?: string; logo_url?: string };
type OrgEntry    = { name: string; logoUrl?: string; logo_url?: string };

/* 辅助：生成展示名（用于方法A回填 name） */
const makeDisplayName = (x: Partial<MobileWeapon>) =>
  [x.code, x.modelName].filter(Boolean).join(" ").trim() || x.name || "";

/* ===== 主组件 ===== */
export default function App() {
  // 数据
  const [data, setData] = useState<MobileWeapon[] | null>(null);
  const [seriesMap, setSeriesMap] = useState<Map<string, string> | null>(null);
  const [orgMap, setOrgMap] = useState<Map<string, string> | null>(null);   // ← 新增
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

    const tFailSafe = setTimeout(() => {
      if (!cancelled && (!data || !seriesMap || !orgMap)) {
        console.warn("[load timeout] 数据文件可能无法访问");
        setLoadErr("资源加载超时：请检查 MobileWeapons.json / Series.json / Orgs.json 是否可访问。");
      }
    }, LOAD_TIMEOUT_MS);

    Promise.all([
      fetchJson(DATA_URL),
      fetchJson(SERIES_URL),
      fetchJson(ORGS_URL),       // ← 新增
    ])
      .then(([list, sList, oList]: [MobileWeapon[], SeriesEntry[], OrgEntry[]]) => {
        if (cancelled) return;

        // 方法A：补齐 name
        const normalized: MobileWeapon[] = (list ?? []).map((m) => {
          const display = makeDisplayName(m);
          return { ...m, name: m.name ?? display };
        });

        // 过滤有效项
        const ok = normalized.filter(
          (m) => Number.isFinite(m.id) && !!m.imgUrl && !!(m.name && m.name.trim())
        );
        if (ok.length === 0) {
          throw new Error("MobileWeapons.json 为空或格式不正确（至少需要 id/imgUrl，且能生成展示名）");
        }
        setData(ok);

        // 系列名 -> logoUrl
        const sm = new Map<string, string>();
        for (const s of sList ?? []) {
          const url = (s.logoUrl ?? s.logo_url ?? "") as string;
          if (s.name && url) sm.set(s.name, url);
        }
        setSeriesMap(sm);

        // 组织名 -> logoUrl
        const om = new Map<string, string>();
        for (const o of oList ?? []) {
          const url = (o.logoUrl ?? o.logo_url ?? "") as string;
          if (o.name && url) om.set(o.name, url);
        }
        setOrgMap(om);
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
  if (!data || !seriesMap || !orgMap) {
    return <div style={{ padding: 24, color: "#fff" }}>正在加载数据…</div>;
  }
  if (items.length < 2) {
    return (
      <div style={{ padding: 24, color: "#fff", lineHeight: 1.6 }}>
        机体数据不足（当前 {items.length} 条）。<br />
        请在 <code>public/MobileWeapons.json</code> 中至少添加 2 条记录；并确认 <code>public/Series.json</code> 与 <code>public/Orgs.json</code> 中包含对应 logoUrl。
      </div>
    );
  }

  const seriesLogoFor = (series?: string) => (series ? seriesMap.get(series) : undefined);
  const orgLogoFor    = (org?: string)    => (org ? orgMap.get(org) : undefined);

  return (
    <div className="page">
      {/* 顶部导航 */}
      <NavBar activeTab="Mobile Weapons" />

      {/* 主体 */}
      <main className="page-inner container">
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
            /* 系列 LOGO（沿用原先 left/rightLogoUrl） */
            leftLogoUrl={seriesLogoFor(pair[0].series)}
            rightLogoUrl={seriesLogoFor(pair[1].series)}
            /* 新增：组织 LOGO */
            leftOrgLogoUrl={orgLogoFor(pair[0].organization)}
            rightOrgLogoUrl={orgLogoFor(pair[1].organization)}
            containerAspect={CARD_ASPECT}
            onVoteLeft={() => {
              update(pair[0].id, pair[1].id);
              reshuffle();
            }}
            onVoteRight={() => {
              update(pair[1].id, pair[0].id);
              reshuffle();
            }}
            onSkip={reshuffle}
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
