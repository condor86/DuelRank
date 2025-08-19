// src/components/DuelCard.tsx
import { Ref } from "react";
import CroppedImage from "./CroppedImage";

type MobileWeaponLike = {
  id: number;

  code?: string;
  modelName?: string;
  name?: string;              // 兼容旧数据
  kana?: string;

  classification?: string;    // 类型（MS/MA…）
  organization?: string;      // 所属组织（E.F.S.F./ZEON…）
  series?: string;            // 所属系列（用于映射系列 LOGO）

  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number;
};

type Props = {
  item: MobileWeaponLike;
  /** 系列 LOGO（父层映射后传入） */
  seriesLogoUrl?: string;
  /** 组织 LOGO（父层映射后传入） */
  orgLogoUrl?: string;

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

function seriesKey(text?: string) {
  const raw = (text ?? "").toLowerCase();
  const t = raw.replace(/[^a-z0-9]+/g, ""); // 归一化：只保留字母数字
  if (!raw) return "default";

  // 原文（日文）别名：先用 raw 检查，避免被正则清空
  if (raw.includes("逆襲のシャア")) return "cca";

  // 英文/罗马字别名：与 orgKey 相同写法
  const checks: Array<[key: string, aliases: string[]]> = [
    ["seed", ["gundamseed", "seeddestiny", "seed", "destiny"]],
    ["cca",  ["charscounterattack", "cca"]],
    // 需要时继续在这里追加：
    // ["unicorn", ["gundamunicorn", "unicorn"]],
    // ["uc",      ["uc", "universalcentury"]],
  ];

  for (const [key, aliases] of checks) {
    if (aliases.some(a => t.includes(a))) return key;
  }
  return "default"; // 其它系列用默认（黄色）
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

  // ===== 收集徽章：类型 → 组织 → 系列 → 自定义 tags（去重） =====
  const badgeRaw: BadgeItem[] = [];
  if (item.classification) badgeRaw.push({ text: item.classification, kind: "type" });
  if (item.organization)   badgeRaw.push({ text: item.organization,   kind: "org" });
  if (item.series)         badgeRaw.push({ text: item.series,         kind: "series" });
  for (const t of item.tags ?? []) badgeRaw.push({ text: t, kind: "tag" });

  const seen = new Set<string>();
  const badges = badgeRaw.filter(b => {
    const key = b.text.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return !!b.text.trim();
  });

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

          {/* 片假名（可选） */}
          {item.kana && <div className="card-kana">{item.kana}</div>}

          {/* LOGO 行（系列 / 组织） */}
          {logos.length > 0 && (
            <div className="logos-row">
              {logos.map((url, i) => (
                <img key={url + i} src={url} alt="logo" className="logo-inline" loading="lazy" />
              ))}
            </div>
          )}

          {/* TAG 徽章（带类型区分的配色） */}
          {badges.length > 0 && (
            <div className="badges">
              {badges.map((b) => {
                const extraOrgClass =
                  b.kind === "org" ? ` badge-org--${orgKey(b.text)}` : "";
                const extraSeriesClass =
                  b.kind === "series" ? ` badge-series--${seriesKey(b.text)}` : "";
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



          {/* 简介 */}
          {item.notes && <p className="card-desc">{item.notes}</p>}

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
