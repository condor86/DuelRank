// src/components/duelcard/DuelCardHeader.tsx
import { useRef, useLayoutEffect } from "react";
import TitleLogo from "./TitleLogo";

type Props = {
  code: string;
  modelName: string;
  kana?: string;
  official?: string;
  titleLogoUrl?: string;        // 有/无 Logo 均不影响计算
  side: "left" | "right";
  cardId?: number | string;     // 可选：调试标识
};

export default function DuelCardHeader({
  code,
  modelName,
  kana,
  official,
  titleLogoUrl,
  side,
  cardId,
}: Props) {
  const codeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  // 统一清除旧缩放（不看是否超宽）
  const resetLine = (el: HTMLSpanElement | null) => {
    if (!el) return;
    el.style.transform = "";                 // 清掉上次的缩放
    el.style.transformOrigin = "left center";
    el.style.display = "inline-block";       // 保证缩放只作用于这一行
    el.style.whiteSpace = "nowrap";          // 自然宽测量按单行
  };

  // 对某一行：测自然宽 -> 与 A 比较 -> 必要时仅横向缩放
  const fitLine = (el: HTMLSpanElement | null) => {
    if (!el) return;

    // A = 仅两行文字容器 .card-title 的实际宽度（红框宽度）
    const titleBox =
      el.closest<HTMLElement>(".card-title") ?? el.parentElement;
    if (!titleBox) return;
    const A = titleBox.clientWidth;

    // 确保测的是“去缩放的自然宽”
    const naturalW = el.scrollWidth;

    if (naturalW > A) {
      const scaleX = A / naturalW;
      el.style.transformOrigin = "left center";
      el.style.transform = `scaleX(${scaleX})`; // 只压 X，高度不变
    } else {
      // 不超宽，保持清空后的状态（不缩放）
      el.style.transform = "";
    }
  };

  // 每次数据/侧边/Logo 变化：先清，再测，再按需缩放
  useLayoutEffect(() => {
    // 1) 清除旧缩放（确保不会继承上一组）
    resetLine(codeRef.current);
    resetLine(nameRef.current);

    // 2) 分别测量与处理（左/右各两行 => 共四次）
    fitLine(codeRef.current);
    fitLine(nameRef.current);
  }, [code, modelName, side, titleLogoUrl]);

  return (
    <>
      <div className="title-zone">
        {/* 调试红框：只框住两行文字，不含 Logo */}
        <div className="card-title" style={{ border: "1px solid red" }}>
          <span ref={codeRef} className="title-code">{code}</span>
          <span ref={nameRef} className="title-name">{modelName}</span>
        </div>
        {titleLogoUrl && <TitleLogo src={titleLogoUrl} />}
      </div>

      {kana && <div className="card-kana">{kana}</div>}
      {official && <div className="card-official">{official}</div>}
    </>
  );
}
