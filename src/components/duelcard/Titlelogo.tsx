// src/components/duelcard/TitleLogo.tsx
import { useLayoutEffect, useMemo, useRef, useState } from "react";

export default function TitleLogo({ src }: { src: string }) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);

  // 预加载拿到图片宽高比（997/802这种）
  useLayoutEffect(() => {
    const img = new Image();
    img.onload = () => setRatio(img.naturalWidth / img.naturalHeight || 1);
    img.src = src;
  }, [src]);

  // 把需要的宽度写进父容器的 CSS 变量 --logo-w（= zone 高度 × ratio）
  useLayoutEffect(() => {
    if (!ratio) return;
    const el = zoneRef.current?.closest<HTMLDivElement>(".title-zone");
    if (!el) return;

    const update = () => {
      const h = el.clientHeight;                  // 高度由左侧两行自然决定
      const w = Math.round(h * ratio);            // 按比例算出需要的宽
      el.style.setProperty("--logo-w", `${w}px`); // 让 CSS 用这个宽度
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [ratio]);

  // 绝对定位容器：高度=父容器高度，宽度使用 --logo-w
  return (
    <div ref={zoneRef} className="title-float">
      <img className="title-float-img" src={src} alt="logo" loading="eager" />
    </div>
  );
}
