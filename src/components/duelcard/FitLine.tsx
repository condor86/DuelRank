import { useLayoutEffect, useRef } from "react";

/**
 * 让一行文字在给定容器的可用宽度内“正好占满”
 * 规则：先增加字间距到上限，再用 scaleX 拉伸；过长则直接 scaleX 压缩。
 */
export default function FitLine({
  children,
  className,
  fraction = 0.75,            // 例如只用可用宽度的 75%（右侧还有 LOGO）
  maxLetterSpacingEm = 0.08,  // 字距上限，按需调
}: {
  children: React.ReactNode;
  className?: string;
  fraction?: number;
  maxLetterSpacingEm?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 容器：就近找 .title-zone（你标题和 LOGO 的外层）
    const zone = el.closest<HTMLElement>(".title-zone");
    if (!zone) return;

    let raf = 0;
    const apply = () => {
      // 1) 目标可用宽度 = zone 内容宽度 × fraction
      const cs = getComputedStyle(zone);
      const pr = parseFloat(cs.paddingRight || "0"); // 右侧 LOGO 预留
      const pl = parseFloat(cs.paddingLeft  || "0");
      const contentW = zone.clientWidth - pl - pr;
      const W = Math.max(0, contentW * fraction);

      // 2) 还原样式测量自然宽
      const elStyle = el.style;
      const prevTransform = elStyle.transform;
      const prevLetter = elStyle.letterSpacing;
      elStyle.transform = "none";
      elStyle.letterSpacing = "0px";

      const w0 = el.getBoundingClientRect().width;

      // 3) 计算字距与缩放
      // 尝试把“非空白字符”之间加字距（空格不算 gap，避免大洞）
      const text = (el.textContent || "").trim();
      const glyphs = Array.from(text).filter(ch => ch !== " ");
      const gaps = Math.max(glyphs.length - 1, 0);

      let letterPx = 0;
      let scaleX = 1;

      if (W > w0) {
        // 需要变宽：先分配字距
        const fontSize = parseFloat(getComputedStyle(el).fontSize || "16"); // 用于把 em 转 px
        const maxLetterPx = maxLetterSpacingEm * fontSize;
        if (gaps > 0) {
          const need = W - w0;
          letterPx = Math.min(maxLetterPx, need / gaps);
        }
        const w1 = w0 + letterPx * gaps;
        if (w1 < W - 0.5) {
          scaleX = W / w1; // 余下的用拉伸补足
        } else {
          scaleX = 1; // 字距已经够了
        }
      } else if (W < w0) {
        // 需要变窄：直接压缩
        scaleX = W / w0;
        letterPx = 0;
      }

      // 4) 应用
      elStyle.letterSpacing = `${letterPx}px`;
      elStyle.transformOrigin = "left center";
      elStyle.transform = `scaleX(${scaleX})`;

      // 清理（不恢复旧值，因为我们要保持 fit 状态）
      // elStyle.transform = prevTransform; elStyle.letterSpacing = prevLetter; // ← 不需要
    };

    // 初次
    apply();

    // 监听容器尺寸变化（包含 --logo-w 变化带来的 padding-right 改变）
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    });
    ro.observe(zone);

    // 也监听窗口 resize（某些布局下更稳）
    const onWin = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener("resize", onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
      cancelAnimationFrame(raf);
    };
  }, [fraction, maxLetterSpacingEm]);

  return (
    <span ref={ref} className={`fitline${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}
