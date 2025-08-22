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

  const resetLine = (el: HTMLSpanElement | null) => {
    if (!el) return;
    el.style.transform = "";
    el.style.transformOrigin = "left center";
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";
  };

  const fitLine = (el: HTMLSpanElement | null, line: "code" | "name") => {
    if (!el) return;

    const titleBox = el.closest<HTMLElement>(".card-title") ?? el.parentElement;
    if (!titleBox) return;
    const A = titleBox.clientWidth; // 红框可用宽

    const prevT = el.style.transform;
    el.style.transform = "none";
    const naturalW = el.scrollWidth;
    el.style.transform = prevT;

    if (naturalW > A) {
      const scaleX = A / naturalW;
      el.style.transformOrigin = "left center";
      el.style.transform = `scaleX(${scaleX})`;
      el.style.display = "inline-block";
      el.style.whiteSpace = "nowrap";
      console.log(
        `[${side} | ${line} | ${cardId}] 缩放: ${scaleX.toFixed(3)}`,
        { naturalWidth: naturalW, availableWidth: A }
      );
    } else {
      el.style.transform = "";
      el.style.transformOrigin = "left center";
      el.style.display = "inline-block";
      el.style.whiteSpace = "nowrap";
      console.log(
        `[${side} | ${line} | ${cardId}] 无需缩放`,
        { naturalWidth: naturalW, availableWidth: A }
      );
    }
  };

  const recalcBoth = () => {
    resetLine(codeRef.current);
    resetLine(nameRef.current);
    fitLine(codeRef.current, "code");
    fitLine(nameRef.current, "name");
  };

  /** 关键：布局快照（观察而不修改行为） */
  const logLayoutSnapshot = (reason: string) => {
    const titleBox = codeRef.current?.closest<HTMLElement>(".card-title") ?? null;
    const titleZone = titleBox?.closest<HTMLElement>(".title-zone") ?? null;

    if (!titleBox || !titleZone) return;

    const zcs = window.getComputedStyle(titleZone);
    const bcs = window.getComputedStyle(titleBox);

    const cssLogoW = parseFloat(
      zcs.getPropertyValue("--logo-w") || "0"
    ) || 0;
    const cssLogoH = parseFloat(
      zcs.getPropertyValue("--logo-h") || "0"
    ) || 0;

    const data = {
      reason,
      side,
      cardId,
      hasLogoProp: !!titleLogoUrl,
      zone_clientW: titleZone.clientWidth,
      box_clientW: titleBox.clientWidth,
      zone_paddingRight: zcs.paddingRight,
      zone_gap: zcs.gap,
      zone_display: zcs.display,
      box_display: bcs.display,
      box_flex: `${bcs.flexGrow} ${bcs.flexShrink} ${bcs.flexBasis}`,
      cssLogoW,
      cssLogoH,
      zone_classes: titleZone.className,
    };

    // 重点告警：没有 logo 但变量/右侧预留仍存在
    const warnGhost =
      !titleLogoUrl && (cssLogoW > 0.5 || parseFloat(zcs.paddingRight) > 0);

    if (warnGhost) {
      console.warn("[GHOST-WIDTH?] 发现疑似幽灵占位", data);
    } else {
      console.log("[布局快照]", data);
    }
  };

  useLayoutEffect(() => {
    // 初次：清 & 算
    recalcBoth();
    logLayoutSnapshot("initial");

    // 监听尺寸变化：只观测，不改变任何 CSS
    const codeEl = codeRef.current;
    const titleBox =
      codeEl?.closest<HTMLElement>(".card-title") ?? codeEl?.parentElement;
    if (!titleBox) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        recalcBoth();
        logLayoutSnapshot("resize-observer");
      });
      ro.observe(titleBox);
      const titleZone = titleBox.closest<HTMLElement>(".title-zone");
      if (titleZone) ro.observe(titleZone);
    } else {
      const handler = () => {
        recalcBoth();
        logLayoutSnapshot("window-resize");
      };
      window.addEventListener("resize", handler);
      return () => window.removeEventListener("resize", handler);
    }

    return () => ro && ro.disconnect();
  }, [code, modelName, side, titleLogoUrl, cardId]);

  return (
    <>
      <div className="title-zone">
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
