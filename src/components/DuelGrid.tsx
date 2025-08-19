// src/components/DuelGrid.tsx
import { useLayoutEffect, useRef } from "react";
import DuelCard from "./DuelCard";

type MobileWeaponLike = {
  id: number;
  code?: string;
  modelName?: string;
  name?: string;
  kana?: string;
  classification?: string;
  series?: string;
  organization?: string;      // ← 新增：所属组织
  imgUrl: string;
  wikiUrl?: string;
  tags?: string[];
  notes?: string;
  crop?: number;
};

type Props = {
  left: MobileWeaponLike;
  right: MobileWeaponLike;

  /* 系列 LOGO（沿用原字段） */
  leftLogoUrl?: string;
  rightLogoUrl?: string;

  /* 新增：组织 LOGO */
  leftOrgLogoUrl?: string;
  rightOrgLogoUrl?: string;

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
  leftOrgLogoUrl,
  rightOrgLogoUrl,
  containerAspect,
  onVoteLeft,
  onVoteRight,
  onSkip,
}: Props) {
  const leftVoteBtnRef = useRef<HTMLButtonElement | null>(null);
  const centerColRef   = useRef<HTMLDivElement | null>(null);
  const skipWrapperRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const leftBtn = leftVoteBtnRef.current;
    const center  = centerColRef.current;
    const skip    = skipWrapperRef.current;
    if (!leftBtn || !center || !skip) return;

    let raf = 0;
    let lastTop = -1;

    const loop = () => {
      raf = requestAnimationFrame(loop);

      const cs = getComputedStyle(center);
      if (cs.display === "none") return;

      const leftRect   = leftBtn.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();
      const skipRect   = skip.getBoundingClientRect();

      const centerYInCenter = (leftRect.top + leftRect.height / 2) - centerRect.top;
      let top = centerYInCenter - skipRect.height / 2;

      const maxTop = Math.max(0, centerRect.height - skipRect.height);
      if (top < 0) top = 0;
      else if (top > maxTop) top = maxTop;

      if (Math.abs(top - lastTop) >= 0.5) {
        center.style.setProperty("--skip-top", `${Math.round(top)}px`);
        lastTop = top;
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="duel-grid">
      {/* 左卡片 */}
      <DuelCard
        item={left}
        seriesLogoUrl={leftLogoUrl}
        orgLogoUrl={leftOrgLogoUrl}
        containerAspect={containerAspect}
        side="left"
        onVote={onVoteLeft}
        voteButtonRef={leftVoteBtnRef}
      />

      {/* 中间列 */}
      <div className="center-col" ref={centerColRef}>
        <div className="vs-wrapper">
          <div className="vs-circle">VS</div>
        </div>
        <div className="skip-wrapper" ref={skipWrapperRef}>
          <button className="vote skip center-skip" onClick={onSkip}>
            跳过这一组
          </button>
        </div>
      </div>

      {/* 右卡片 */}
      <DuelCard
        item={right}
        seriesLogoUrl={rightLogoUrl}
        orgLogoUrl={rightOrgLogoUrl}
        containerAspect={containerAspect}
        side="right"
        onVote={onVoteRight}
      />

      {/* 移动端跳过 */}
      <div className="mobile-skip">
        <button className="vote skip" onClick={onSkip}>
          跳过这一组
        </button>
      </div>
    </section>
  );
}
