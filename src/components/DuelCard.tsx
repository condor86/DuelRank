// src/components/DuelCard.tsx
import { Ref } from "react";
import CroppedImage from "./CroppedImage";

type MobileWeaponLike = {
  id: number;

  // 两行标题
  code?: string;
  modelName?: string;
  name?: string;              // 兼容旧数据回退

  // 追加字段
  kana?: string;              // 片假名
  official?: string;          // 新：官方简介行（短句，如 ZETA 示例）
  quoteText?: string;         // 新：引用内容（台词）
  quoteBy?: string;           // 新：说话的人（署名）

  // 其它
  classification?: string;
  organization?: string;
  series?: string;
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;             // 兼容旧：若 quoteText 缺省则用 notes 兜底
  crop?: number;
};

type Props = {
  item: MobileWeaponLike;
  seriesLogoUrl?: string;     // 系列 LOGO（父层映射）
  orgLogoUrl?: string;        // 组织 LOGO（父层映射）
  containerAspect: number;
  side: "left" | "right";
  onVote: () => void;
  voteButtonRef?: Ref<HTMLButtonElement>;
};

// 兼容：若没有 code/modelName，就从 name 拆
function splitNameFallback(name?: string) {
  const s = (name ?? "").trim();
  if (!s) return { code: "", modelName: "" };
  const parts = s.split(/\s+/);
  const code = parts.shift() ?? "";
  const modelName = parts.join(" ");
  return { code, modelName };
}

/** 组织配色 key（已在 CSS 里映射颜色） */
function orgKey(text?: string) {
  const t = (text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!t) return "other";
  const checks: Array<[key: string, aliases: string[]]> = [
    ["zeon",   ["zeon", "zion", "neozeon", "principalityofzeon"]],
    ["efsf",   ["efsf", "eff", "earthfederation", "earthfederationspaceforce", "earthfederationforces"]],
    ["aeug",   ["aeug", "antiearthuniongroup"]],
    ["titans", ["titans"]],
    ["zaft",   ["zaft"]],
  ];
  for (const [key, names] of checks) {
    if (names.some(a => t.includes(a))) return key;
  }
  return "other";
}

/** 系列配色 key（默认黄；含 SEED、CCA 特例） */
function seriesKey(text?: string) {
  const raw = (text ?? "").toLowerCase();
  const t = raw.replace(/[^a-z0-9]+/g, "");
  if (!raw) return "default";
  if (raw.includes("逆襲のシャア")) return "cca";
  const checks: Array<[key: string, aliases: string[]]> = [
    ["seed", ["gundamseed", "seeddestiny", "seed", "destiny"]],
    ["cca",  ["charscounterattack", "cca"]],
  ];
  for (const [key, aliases] of checks) {
    if (aliases.some(a => t.includes(a))) return key;
  }
  return "default";
}

type BadgeKind = "type" | "org" | "series" | "tag";
type BadgeItem = { text: string; kind: BadgeKind };

export default function DuelCard({
  item,
  seriesLogoUrl,
  orgLogoUrl,
  containerAspect,
  side,
  onVote,
  voteButtonRef,
}: Props) {
  const code = item.code ?? splitNameFallback(item.name).code;
  const modelName = item.modelName ?? splitNameFallback(item.name).modelName;
  const fullTitle =
    code && modelName ? `${code} ${modelName}` : item.name ?? code ?? modelName;

  const logos = [seriesLogoUrl, orgLogoUrl].filter(Boolean) as string[];

  // 徽章：类型 → 组织 → 系列 → 自定义 tags（去重）
  const badgeRaw: BadgeItem[] = [];
  if (item.classification) badgeRaw.push({ text: item.classification, kind: "type" });
  if (item.organization)   badgeRaw.push({ text: item.organization,   kind: "org" });
  if (item.series)         badgeRaw.push({ text: item.series,         kind: "series" });
  for (const t of item.tags ?? []) badgeRaw.push({ text: t, kind: "tag" });

  const seen = new Set<string>();
  const badges = badgeRaw.filter(b => {
    const key = b.text.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 引用：优先用新字段，缺省时用旧 notes 兜底
  const quoteText = item.quoteText ?? item.notes ?? "";

  return (
    <article className="card">
      <div className="card-media">
        <CroppedImage
          src={item.imgUrl}
          alt={fullTitle}
          focus={item.crop ?? 50}
          containerAspect={containerAspect}
        />
      </div>

      <div className="card-body body-relaxed">
        <div className="info-stack">
          {/* 两行标题 */}
          <div className="card-title">
            <span className="title-code">{code}</span>
            <span className="title-name">{modelName}</span>
          </div>

          {/* 片假名 */}
          {item.kana && <div className="card-kana">{item.kana}</div>}

          {/* 官方简介行（新）—— 位于片假名之后、LOGO 之前 */}
          {item.official && <div className="card-official">{item.official}</div>}

          {/* LOGO 行（系列 / 组织） */}
          {logos.length > 0 && (
            <div className="logos-row">
              {seriesLogoUrl && (
                <img src={seriesLogoUrl} alt={`${item.series ?? "Series"} logo`} className="logo-inline" loading="lazy" />
              )}
              {orgLogoUrl && (
                <img src={orgLogoUrl} alt={`${item.organization ?? "Organization"} logo`} className="logo-inline" loading="lazy" />
              )}
            </div>
          )}

          {/* TAG 徽章（带类型区分 + 组织/系列专用配色） */}
          {badges.length > 0 && (
            <div className="badges">
              {badges.map((b) => {
                const extraOrgClass    = b.kind === "org"    ? ` badge-org--${orgKey(b.text)}` : "";
                const extraSeriesClass = b.kind === "series" ? ` badge-series--${seriesKey(b.text)}` : "";
                return (
                  <span
                    key={`${b.kind}:${b.text}`}
                    className={`badge badge--${b.kind}${extraOrgClass}${extraSeriesClass}`}
                  >
                    {b.text}
                  </span>
                );
              })}
            </div>
          )}

          {/* 引用块（新）—— 大引号、斜体，署名右对齐 */}
          {quoteText && (
            <figure className="card-quote">
              <blockquote className="quote-text">{quoteText}</blockquote>
              {item.quoteBy && <figcaption className="quote-by">— {item.quoteBy}</figcaption>}
            </figure>
          )}

          {/* 外链（可选） */}
          {item.wikiUrl && (
            <a className="btn btn-ghost" href={item.wikiUrl} target="_blank" rel="noreferrer">
              查看百科
            </a>
          )}
        </div>

        {/* 行为按钮 */}
        <div className="card-actions btns-stacked">
          <button
            ref={voteButtonRef}
            className={`vote ${side}`}
            onClick={onVote}
          >
            {side === "left" ? "更喜欢左边" : "更喜欢右边"}
          </button>
        </div>
      </div>
    </article>
  );
}
