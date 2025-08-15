// src/components/DuelGrid.tsx
import DuelCard from "./DuelCard";

type MobileWeaponLike = {
  id: number;
  name: string;
  classification?: string;
  series?: string;
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number;
};

type Props = {
  left: MobileWeaponLike;
  right: MobileWeaponLike;
  leftLogoUrl?: string;
  rightLogoUrl?: string;
  containerAspect: number;
  onVoteLeft: () => void;
  onVoteRight: () => void;
  onSkip: () => void;
};

export default function DuelGrid({
  left,
  right,
  leftLogoUrl,
  rightLogoUrl,
  containerAspect,
  onVoteLeft,
  onVoteRight,
  onSkip,
}: Props) {
  return (
    <section className="duel-grid">
      {/* 左卡片 */}
      <DuelCard
        item={left}
        logoUrl={leftLogoUrl}
        containerAspect={containerAspect}
        side="left"
        onVote={onVoteLeft}
      />

      {/* 中间列（仅桌面端显示）：VS + 跳过 */}
      <div className="center-col">
        <div className="vs-wrapper">
          <div className="vs-circle">VS</div>
        </div>
        <div className="skip-wrapper">
          <button className="vote skip center-skip" onClick={onSkip}>
            跳过这一组
          </button>
        </div>
      </div>

      {/* 右卡片 */}
      <DuelCard
        item={right}
        logoUrl={rightLogoUrl}
        containerAspect={containerAspect}
        side="right"
        onVote={onVoteRight}
      />

      {/* 移动端专用的跳过按钮（放在两个卡片之后） */}
      <div className="mobile-skip">
        <button className="vote skip" onClick={onSkip}>
          跳过这一组
        </button>
      </div>
    </section>
  );
}
