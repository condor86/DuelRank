import { useLayoutEffect, useRef } from "react";
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
      if (cs.display === "none") return; // 中列在某些断点隐藏时不更新

      const leftRect   = leftBtn.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();
      const skipRect   = skip.getBoundingClientRect();

      // 左侧按钮中心Y → 换算到 center-col 的本地坐标
      const centerYInCenter = (leftRect.top + leftRect.height / 2) - centerRect.top;

      // 目标 top：让 skip 的中心对齐左按钮中心
      let top = centerYInCenter - skipRect.height / 2;

      // 夹紧避免越界
      const maxTop = Math.max(0, centerRect.height - skipRect.height);
      if (top < 0) top = 0;
      else if (top > maxTop) top = maxTop;

      // 有明显变化再写，避免无谓抖动
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
      {/* 左卡片（传入按钮 ref 供测量） */}
      <DuelCard
        item={left}
        logoUrl={leftLogoUrl}
        containerAspect={containerAspect}
        side="left"
        onVote={onVoteLeft}
        voteButtonRef={leftVoteBtnRef}
      />

      {/* 中间列：VS + 跳过（桌面端可见） */}
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
        logoUrl={rightLogoUrl}
        containerAspect={containerAspect}
        side="right"
        onVote={onVoteRight}
      />

      {/* 移动端跳过（不参与对齐） */}
      <div className="mobile-skip">
        <button className="vote skip" onClick={onSkip}>
          跳过这一组
        </button>
      </div>
    </section>
  );
}
