// src/components/duelcard/DuelCardHeader.tsx
import { useLayoutEffect, useRef } from "react";

type Props = {
  code: string;
  modelName: string;
  kana?: string;
  official?: string;
  titleLogoUrl?: string;        // 允许为空：流程一致
  side: "left" | "right";
  cardId?: number | string;
  /** LOGO 预留盒子宽高比：宽/高，默认 4:3 */
  logoBoxRatio?: number;
};

export default function DuelCardHeader({
  code,
  modelName,
  kana,
  official,
  titleLogoUrl,
  logoBoxRatio = 4 / 3,
}: Props) {
  const zoneRef = useRef<HTMLDivElement>(null);      // .title-zone
  const titleBoxRef = useRef<HTMLDivElement>(null);  // .card-title
  const codeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  const resetLine = (el: HTMLSpanElement | null) => {
    if (!el) return;
    el.style.transform = "";
    el.style.transformOrigin = "left center";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";
  };

  const fitLine = (el: HTMLSpanElement | null, available: number) => {
    if (!el) return;
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

  // 统一流程：行高 -> 写入 LOGO 盒子变量 -> 文字缩放
  useLayoutEffect(() => {
    const zone = zoneRef.current;
    const titleBox = titleBoxRef.current;
    if (!zone || !titleBox) return;

    // 1) 清旧缩放
    resetLine(codeRef.current);
    resetLine(nameRef.current);

    // 2) 读取两行的字号/行高（取最大），计算两行高度 + 一次行距
    const getMetrics = (el: HTMLElement | null) => {
      if (!el) return { fontSize: 0, lineHeight: 0 };
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize) || 16;
      const lh = cs.lineHeight === "normal" ? fs * 1.2 : parseFloat(cs.lineHeight);
      return { fontSize: fs, lineHeight: lh };
    };
    const m1 = getMetrics(codeRef.current);
    const m2 = getMetrics(nameRef.current);
    const fontSize = Math.max(m1.fontSize, m2.fontSize);
    const lineHeight = Math.max(m1.lineHeight, m2.lineHeight);
    const lineSpacing = Math.max(lineHeight - fontSize, 0);
    const boxH = Math.round(lineHeight * 2 + lineSpacing);     // 目标高度（两行 + 一次行距）
    const boxW = Math.round(boxH * logoBoxRatio);               // 目标宽度（固定比例）

    // 3) 写入 LOGO 盒子变量
    // 是否有图不再分支：没有图则给 <img> 不渲染，但盒子变量按规则写入；
    // 如果你不想无图预留空间，可把下面一行改为 const finalW = titleLogoUrl ? boxW : 0;
    const finalW = titleLogoUrl ? boxW : 0;
    zone.style.setProperty("--logo-w", `${finalW}px`);
    zone.style.setProperty("--logo-h", `${boxH}px`);

    // 4) 同帧测可用宽并做横向缩放（保证变量已生效）
    let raf = 0;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(() => {
        const available = titleBox.clientWidth;
        fitLine(codeRef.current, available);
        fitLine(nameRef.current, available);
      });
    };

    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(run);
    } else {
      run();
    }

    // 卸载时清零变量，避免残留
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      zone.style.setProperty("--logo-w", "0px");
      zone.style.setProperty("--logo-h", "0px");
    };
  }, [code, modelName, titleLogoUrl, logoBoxRatio]);

  return (
    <>
      <div ref={zoneRef} className="title-zone">
        <div ref={titleBoxRef} className="card-title">
          <span ref={codeRef} className="title-code">{code}</span>
          <span ref={nameRef} className="title-name">{modelName}</span>
        </div>

        {/* 固定比例的 LOGO 盒子；图片在盒子内用 object-fit: contain 适配 */}
        <div className="title-float">
          {titleLogoUrl && (
            <img className="title-float-img" src={titleLogoUrl} alt="logo" loading="eager" />
          )}
        </div>
      </div>

      {kana && <div className="card-kana">{kana}</div>}
      {official && <div className="card-official">{official}</div>}
    </>
  );
}
