// src/components/DuelGrid.tsx
import { useEffect, useLayoutEffect, useRef } from "react";
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
  // 用于测量位置的引用
  const leftVoteBtnRef = useRef<HTMLButtonElement | null>(null);
  const centerColRef = useRef<HTMLDivElement | null>(null);
  const skipWrapperRef = useRef<HTMLDivElement | null>(null);

  // 把中间“跳过”放在 desktop 的 center-col，mobile 用下面的 mobile-skip
  useLayoutEffect(() => {
    const sync = () => {
      const centerColEl = centerColRef.current;
      const leftVoteEl = leftVoteBtnRef.current;
      const skipWrapEl = skipWrapperRef.current;

      if (!centerColEl || !leftVoteEl || !skipWrapEl) return;

      // 如果中间列在移动端隐藏（display:none），就不做同步
      const centerStyle = window.getComputedStyle(centerColEl);
      if (centerStyle.display === "none") return;

      const leftRect = leftVoteEl.getBoundingClientRect();
      const centerRect = centerColEl.getBoundingClientRect();
      const skipRect = skipWrapEl.getBoundingClientRect();

      // 让“跳过”按钮的中心与左侧 vote 按钮的中心对齐
      const leftCenterY = leftRect.top + leftRect.height / 2;
      const offsetFromCenterTop = leftCenterY - centerRect.top;
      const desiredTopMargin = offsetFromCenterTop - skipRect.height / 2;

      // 写入 CSS 变量（App.css 中桌面端样式：.skip-wrapper { margin-top: var(--skip-margin-top) }）
      centerColEl.style.setProperty("--skip-margin-top", `${Math.max(0, desiredTopMargin)}px`);
    };

    // 初次同步
    sync();

    // 窗口变化时同步
    const onResize = () => sync();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // 内容尺寸变化时同步（更鲁棒）
    const roTargets: Element[] = [];
    const ro = new ResizeObserver(() => sync());
    if (leftVoteBtnRef.current) { ro.observe(leftVoteBtnRef.current); roTargets.push(leftVoteBtnRef.current); }
    if (centerColRef.current)   { ro.observe(centerColRef.current);   roTargets.push(centerColRef.current); }
    if (skipWrapperRef.current) { ro.observe(skipWrapperRef.current); roTargets.push(skipWrapperRef.current); }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      roTargets.forEach(t => ro.unobserve(t));
      ro.disconnect();
    };
  }, []);

  return (
    <section className="duel-grid">
      {/* 左卡片（把“更喜欢左边”按钮的 ref 传进来供测量） */}
      <DuelCard
        item={left}
        logoUrl={leftLogoUrl}
        containerAspect={containerAspect}
        side="left"
        onVote={onVoteLeft}
        voteButtonRef={leftVoteBtnRef}
      />

      {/* 中间列（桌面端显示）：VS + 跳过（跳过要对齐左侧按钮） */}
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

      {/* 移动端专用的跳过按钮（不参与对齐计算） */}
      <div className="mobile-skip">
        <button className="vote skip" onClick={onSkip}>
          跳过这一组
        </button>
      </div>
    </section>
  );
}
