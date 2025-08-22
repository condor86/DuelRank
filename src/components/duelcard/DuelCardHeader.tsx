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

    const titleBox = el.closest<HTMLElement>(".card-title") ?? el.parentElement;
    if (!titleBox) return;
    const available = titleBox.clientWidth;

    const prevT = el.style.transform;
    el.style.transform = "none";
    const naturalW = el.scrollWidth;
    el.style.transform = prevT;

    if (naturalW > available) {
      const scaleX = available / naturalW;
      el.style.transformOrigin = "left center";
      el.style.transform = `scaleX(${scaleX})`;
      el.style.display = "inline-block";
      el.style.whiteSpace = "nowrap";
    } else {
      el.style.transform = "";
      el.style.transformOrigin = "left center";
      el.style.display = "inline-block";
      el.style.whiteSpace = "nowrap";
    }
  };

  const recalcBoth = () => {
    resetLine(codeRef.current);
    resetLine(nameRef.current);
    fitLine(codeRef.current);
    fitLine(nameRef.current);
  };

  useLayoutEffect(() => {
    // 初次：清 & 算
    recalcBoth();

    // 监听尺寸变化：重算（包括 Logo 加载后导致的可用宽变化）
    const codeEl = codeRef.current;
    const titleBox =
      codeEl?.closest<HTMLElement>(".card-title") ?? codeEl?.parentElement;
    if (!titleBox) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        recalcBoth();
      });
      ro.observe(titleBox);
      const titleZone = titleBox.closest<HTMLElement>(".title-zone");
      if (titleZone) ro.observe(titleZone);
    } else {
      const handler = () => recalcBoth();
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }

    return () => ro && ro.disconnect();
  }, [code, modelName, titleLogoUrl]);

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
