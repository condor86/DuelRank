// src/components/duelcard/TitleLogo.tsx
import { useLayoutEffect, useRef, useState } from "react";

export default function TitleLogo({ src }: { src: string }) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setRatio((img.naturalWidth || 1) / (img.naturalHeight || 1));
    img.src = src;
  }, [src]);

  useLayoutEffect(() => {
    const zone = zoneRef.current?.closest<HTMLElement>(".title-zone");
    if (!zone) return;

    const applyVars = (w: number, h: number) => {
      zone.style.setProperty("--logo-w", `${Math.max(0, Math.round(w))}px`);
      zone.style.setProperty("--logo-h", `${Math.max(0, Math.round(h))}px`);
      zone.classList.add("has-logo");
      zone.classList.remove("no-logo");
    };

    const clearVars = () => {
      zone.style.setProperty("--logo-w", "0px");
      zone.style.setProperty("--logo-h", "0px");
      zone.classList.remove("has-logo");
      zone.classList.add("no-logo");
    };

    const titleBox = zone.querySelector<HTMLElement>(".card-title");
    if (!titleBox) return;

    const getMetrics = (el: HTMLElement | null) => {
      if (!el) return { fontSize: 0, lineHeight: 0 };
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize) || 16;
      const lh = cs.lineHeight === "normal" ? fs * 1.2 : parseFloat(cs.lineHeight);
      return { fontSize: fs, lineHeight: lh };
    };

    const codeEl = titleBox.querySelector<HTMLElement>(".title-code");
    const nameEl = titleBox.querySelector<HTMLElement>(".title-name");
    const m1 = getMetrics(codeEl);
    const m2 = getMetrics(nameEl);
    const fontSize = Math.max(m1.fontSize, m2.fontSize);
    const lineHeight = Math.max(m1.lineHeight, m2.lineHeight);
    const lineSpacing = Math.max(lineHeight - fontSize, 0);
    const targetH = lineHeight * 2 + lineSpacing;
    const r = ratio || 1;
    const targetW = targetH * r;

    applyVars(targetW, targetH);

    return () => {
      clearVars();
    };
  }, [ratio, src]);

  return (
    <div ref={zoneRef} className="title-float">
      <img className="title-float-img" src={src} alt="logo" loading="eager" />
    </div>
  );
}
