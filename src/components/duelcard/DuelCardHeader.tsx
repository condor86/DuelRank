// src/components/duelcard/DuelCardHeader.tsx
import { useLayoutEffect, useRef, useState } from "react";

type Props = {
  code: string;
  modelName: string;
  kana?: string;
  official?: string;
  titleLogoUrl?: string;        // 允许为空：流程一致
  side: "left" | "right";
  cardId?: number | string;
};

export default function DuelCardHeader({
  code,
  modelName,
  kana,
  official,
  titleLogoUrl,
}: Props) {
  const zoneRef = useRef<HTMLDivElement>(null);      // .title-zone
  const titleBoxRef = useRef<HTMLDivElement>(null);  // .card-title
  const codeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  // 仅用于得到 logo 宽高比；为空则保持 null
  const [logoRatio, setLogoRatio] = useState<number | null>(null);

  // 预取 logo 宽高比；无 URL 时保持 null（逻辑仍执行，宽=0）
  useLayoutEffect(() => {
    let cancelled = false;
    setLogoRatio(null);
    if (!titleLogoUrl) return;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        const r = (img.naturalWidth || 1) / (img.naturalHeight || 1);
        setLogoRatio(r);
      }
    };
    img.src = titleLogoUrl;
    return () => { cancelled = true; };
  }, [titleLogoUrl]);

  // 工具：清除某一行的缩放
  const resetLine = (el: HTMLSpanElement | null) => {
    if (!el) return;
    el.style.transform = "";
    el.style.transformOrigin = "left center";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";
  };

  // 工具：对某一行执行横向缩放
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

  // 统一流程：行高 -> 写入 logo 变量 -> 文字缩放
  useLayoutEffect(() => {
    const zone = zoneRef.current;
    const titleBox = titleBoxRef.current;
    if (!zone || !titleBox) return;

    // 1) 清除旧的文字缩放
    resetLine(codeRef.current);
    resetLine(nameRef.current);

    // 读取两行的字号/行高（取最大值）
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
    const targetH = Math.round(lineHeight * 2 + lineSpacing);

    // 2) 写入变量（无 logo 时宽=0；高仍写入，保持统一）
    const w = Math.round(targetH * (logoRatio ?? 0));
    zone.style.setProperty("--logo-w", `${w}px`);
    zone.style.setProperty("--logo-h", `${targetH}px`);

    // 3) 同帧测可用宽并做横向缩放（保证变量已生效）
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

    // 等字体就绪再执行，避免首屏行高抖动
    if ((document as any).fonts?.ready) {
      (document as any).fonts.ready.then(run);
    } else {
      run();
    }

    // 卸载：清零变量，杜绝残留
    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      zone.style.setProperty("--logo-w", "0px");
      zone.style.setProperty("--logo-h", "0px");
    };
  }, [code, modelName, logoRatio]);

  return (
    <>
      <div ref={zoneRef} className="title-zone">
        <div ref={titleBoxRef} className="card-title">
          <span ref={codeRef} className="title-code">{code}</span>
          <span ref={nameRef} className="title-name">{modelName}</span>
        </div>

        {/* 只是展示；变量已在上方写入 */}
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
