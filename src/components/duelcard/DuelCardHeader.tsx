// src/components/duelcard/DuelCardHeader.tsx
import { useRef, useLayoutEffect } from "react";
import TitleLogo from "./TitleLogo";

type Props = {
  code: string;
  modelName: string;
  kana?: string;
  official?: string;
  titleLogoUrl?: string;
  side: "left" | "right";
  cardId?: number | string;
  shrinkFactor?: number; // 新增：可调节缩小系数，默认 0.9
};

export default function DuelCardHeader({
  code,
  modelName,
  kana,
  official,
  titleLogoUrl,
  side,
  shrinkFactor = 0.98, // 默认值
}: Props) {
  const codeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  const resetLine = (el: HTMLSpanElement | null) => {
    if (!el) return;
    el.style.transform = "";
    el.style.transformOrigin = "left center";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";
  };

  const fitLine = (el: HTMLSpanElement | null) => {
    if (!el) return;
    const titleBox =
      el.closest<HTMLElement>(".card-title") ?? el.parentElement;
    if (!titleBox) return;

    const A = titleBox.clientWidth * shrinkFactor; // ← 加入余量
    const naturalW = el.scrollWidth;

    if (naturalW > A) {
      const scaleX = A / naturalW;
      el.style.transformOrigin = "left center";
      el.style.transform = `scaleX(${scaleX})`;
    } else {
      el.style.transform = "";
    }
  };

  useLayoutEffect(() => {
    resetLine(codeRef.current);
    resetLine(nameRef.current);
    fitLine(codeRef.current);
    fitLine(nameRef.current);
  }, [code, modelName, side, titleLogoUrl, shrinkFactor]);

  return (
    <>
      <div className="title-zone">
        <div className="card-title">
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
