// src/components/CroppedImage.tsx
import React, { useState } from "react";

/** 和 App 里保持一致的卡片宽高比；即便 App 传了 containerAspect，这里也能兜底 */
const CARD_ASPECT = 16 / 10;

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

type Props = {
  src: string;
  alt?: string;
  focus?: number;           // 0..100
  containerAspect?: number; // 容器宽高比
  className?: string;
};

export default function CroppedImage({
  src,
  alt,
  focus = 50,
  containerAspect = CARD_ASPECT,
  className,
}: Props) {
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);

  // 不使用 React.SyntheticEvent，避免类型导致的运行时残留
  const onLoad = (e: any) => {
    const img = e?.currentTarget as HTMLImageElement | undefined;
    if (img && img.naturalWidth && img.naturalHeight) {
      setNaturalAspect(img.naturalWidth / img.naturalHeight);
    }
  };

  const t = clamp01((focus ?? 50) / 100);
  let objectPosition = "50% 50%";

  if (naturalAspect != null) {
    if (naturalAspect > containerAspect) {
      const x = Math.round(t * 100);
      objectPosition = `${x}% 50%`;
    } else if (naturalAspect < containerAspect) {
      const y = Math.round(t * 100);
      objectPosition = `50% ${y}%`;
    }
  }

  return (
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition,
        display: "block",
      }}
    />
  );
}
