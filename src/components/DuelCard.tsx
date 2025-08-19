// src/components/DuelCard.tsx
import { Ref } from "react";
import CroppedImage from "./CroppedImage";

type MobileWeaponLike = {
  id: number;

  // 两行标题
  code?: string;          // 例：RX-78-2
  modelName?: string;     // 例：GUNDAM / Hi-ν GUNDAM
  name?: string;          // 兼容旧数据

  kana?: string;          // 片假名（可选）
  classification?: string;
  series?: string;        // 仍用于拿 logo，但不再显示文字行
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number;          // 0-100：0=最左/最上；50=居中；100=最右/最下
};

type Props = {
  item: MobileWeaponLike;
  logoUrl?: string;                // 系列 LOGO（从父组件传）
  containerAspect: number;
  side: "left" | "right";
  onVote: () => void;
  voteButtonRef?: Ref<HTMLButtonElement>;
};

// 兼容旧数据：若没有 code/modelName，就从 name 拆
function splitNameFallback(name?: string) {
  const s = (name ?? "").trim();
  if (!s) return { code: "", modelName: "" };
  const parts = s.split(/\s+/);
  const code = parts.shift() ?? "";
  const modelName = parts.join(" ");
  return { code, modelName };
}

export default function DuelCard({
  item,
  logoUrl,
  containerAspect,
  side,
  onVote,
  voteButtonRef,
}: Props) {
  const code = item.code ?? splitNameFallback(item.name).code;
  const modelName = item.modelName ?? splitNameFallback(item.name).modelName;
  const fullTitle =
    code && modelName ? `${code} ${modelName}` : item.name ?? code ?? modelName;

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
        {/* 纵向信息栈：标题 / 片假名 / LOGO / TAG / 简介 */}
        <div className="info-stack">
        {/* 两行标题：第一行 code，第二行 modelName */}
        <div className="card-title">
          <span className="title-code">{code}</span>
          <span className="title-name">{modelName}</span>
        </div>

        {/* 片假名（可选） */}
        {item.kana && <div className="card-kana">{item.kana}</div>}

        {/* 先放 LOGO 行（高度由 --logo-row-h 控制） */}
        {logoUrl && (
          <div className="series-logo-row">
            <img
              src={logoUrl}
              alt={`${item.series ?? ""} logo`}
              className="series-logo-inline"
              loading="lazy"
            />
          </div>
        )}

        {/* 再放 TAG 行（classification + tags） */}
        {(item.tags?.length ?? 0) > 0 && (
          <div className="badges">
            {item.classification && <span className="badge">{item.classification}</span>}
            {item.tags!.map((t) => (
              <span key={t} className="badge">{t}</span>
            ))}
          </div>
        )}

        {/* 简介 */}
        {item.notes && <p className="card-desc">{item.notes}</p>}
      </div>

        {/* 外链（可选） */}
        {item.wikiUrl && (
          <a className="btn btn-ghost" href={item.wikiUrl} target="_blank" rel="noreferrer">
            查看百科
          </a>
        )}

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
