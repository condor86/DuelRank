// src/App.tsx
import { useEffect, useState } from "react";
import "./App.css";

import { exportState, importStateFromText, resetState } from "./storage";
import useElo from "./hooks/useElo";
import pickPair from "./utils/pickPair";
import NavBar from "./components/NavBar";
import HeaderBar from "./components/HeaderBar";
import DuelGrid from "./components/DuelGrid";
import RankTable from "./components/RankTable";

/* ===== 类型定义 ===== */
type Classification = "MS" | "MA" | "MD" | "MW" | string;

type MobileWeapon = {
  id: number;
  name: string;
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
//
/* ===== 常量 ===== */
const DATA_URL = "/MobileWeapons.json";
const SERIES_URL = "/Series.json";
const CARD_ASPECT = 16 / 10; // 与 .card-media 的 aspect-ratio 保持一致

/* ===== 主组件 ===== */
export default function App() {
  // 加载数据（机体 + 作品 LOGO）
  const [data, setData] = useState<MobileWeapon[] | null>(null);
  const [seriesMap, setSeriesMap] = useState<Map<string, string> | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJson(url: string) {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
      return res.json();
    }
    Promise.all([fetchJson(DATA_URL), fetchJson(SERIES_URL)])
      .then(([list, sList]: [MobileWeapon[], SeriesEntry[]]) => {
        const ok = list.filter((m) => Number.isFinite(m.id) && !!m.name && !!m.imgUrl);
        if (ok.length === 0) throw new Error("MobileWeapons.json 为空或格式不正确（至少需要 id/name/imgUrl）");
        setData(ok);

        const m = new Map<string, string>();
        for (const s of sList) {
          const url = (s.logoUrl ?? s.logo_url ?? "") as string;
          if (s.name && url) m.set(s.name, url);
        }
        setSeriesMap(m);
      })
      .catch((e) => setLoadErr(e?.message || "数据加载失败"));
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
    a.download = "duelrank-export.json";
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
            onVoteLeft={() => { update(pair[0].id, pair[1].id); reshuffle(); }}
            onVoteRight={() => { update(pair[1].id, pair[0].id); reshuffle(); }}
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
