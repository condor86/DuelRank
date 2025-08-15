// src/components/DuelCard.tsx
import CroppedImage from "./CroppedImage";

type MobileWeaponLike = {
  id: number;
  name: string;
  classification?: string;
  series?: string;
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number; // 0-100：0=最左/最上；50=居中；100=最右/最下
};

type Props = {
  item: MobileWeaponLike;
  logoUrl?: string;
  containerAspect: number;
  side: "left" | "right";
  onVote: () => void;
  onSkip: () => void;
};

export default function DuelCard({
  item,
  logoUrl,
  containerAspect,
  side,
  onVote,
  onSkip,
}: Props) {
  return (
    <article className="card">
      <div className="card-media">
        <CroppedImage
          src={item.imgUrl}
          alt={item.name}
          focus={item.crop ?? 50}
          containerAspect={containerAspect}
        />
      </div>
      <div className="card-body body-relaxed">
        <div className="badges">
          {item.classification && <span className="badge">{item.classification}</span>}
          {(item.tags ?? []).map((t) => (
            <span key={t} className="badge">{t}</span>
          ))}
        </div>

        {/* 标题/系列（左） + LOGO（右） */}
        <div className="info-row">
          <div className="info-col">
            <div className="card-title">{item.name}</div>
            <div className="card-sub">{item.series}</div>
          </div>
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${item.series ?? ""} logo`}
              className="series-logo"
            />
          )}
        </div>

        {item.notes && <p className="card-desc">{item.notes}</p>}
        {item.wikiUrl && (
          <a
            className="btn btn-ghost"
            href={item.wikiUrl}
            target="_blank"
            rel="noreferrer"
          >
            查看百科
          </a>
        )}

        <div className="card-actions">
          <button className={`vote ${side}`} onClick={onVote}>
            {side === "left" ? "更喜欢左边" : "更喜欢右边"}
          </button>
          <button className="vote skip" onClick={onSkip}>
            跳过这一组
          </button>
        </div>
      </div>
    </article>
  );
}
