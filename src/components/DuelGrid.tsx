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
      <DuelCard
        item={left}
        logoUrl={leftLogoUrl}
        containerAspect={containerAspect}
        side="left"
        onVote={onVoteLeft}
        onSkip={onSkip}
      />

      <div className="center-col">
        <div className="vs-circle">VS</div>
      </div>

      <DuelCard
        item={right}
        logoUrl={rightLogoUrl}
        containerAspect={containerAspect}
        side="right"
        onVote={onVoteRight}
        onSkip={onSkip}
      />
    </section>
  );
}
