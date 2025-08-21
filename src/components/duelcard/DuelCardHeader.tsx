// src/components/duelcard/DuelCardHeader.tsx
import { useRef } from "react";
import TitleLogo from "./TitleLogo";
import useCompressToWidth from "../../hooks/useCompressToWidth"; // 或 "@/hooks/..."

export default function DuelCardHeader({
  code, modelName, kana, official, titleLogoUrl, titleWidthFraction = 0.75,
}: {
  code: string;
  modelName: string;
  kana?: string;
  official?: string;
  titleLogoUrl?: string;
  titleWidthFraction?: number;
}) {
  const codeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  // 两行独立压缩 + 打开 debug
  useCompressToWidth(codeRef, { fraction: titleWidthFraction, debug: true });
  useCompressToWidth(nameRef, { fraction: titleWidthFraction, debug: true });

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
