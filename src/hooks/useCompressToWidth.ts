// src/hooks/useCompressToWidth.ts
import { useLayoutEffect } from "react";

type Trigger =
  | "init"
  | "el-resize"
  | "box-resize"
  | "mutation"
  | "window-resize"
  | "fonts-ready"
  | "img-load";

type Opts = {
  fraction?: number;                 // 目标宽 = .card-title.clientWidth * fraction
  epsilonPx?: number;                // 容差（px），默认 1
  debug?: boolean;                   // 开启控制台日志
  side?: "left" | "right";           // 左/右卡
  line?: "code" | "name";            // 标注：标题行 or 名称行
  tag?: string | number;             // 额外标识（如 item.id 或 pairKey）
  verboseAll?: boolean;              // 每次都打印详情（默认 false：仅变化时）
  postVerifyTolerancePx?: number;    // 事后校核容差（默认 2px）
};

const lastLog = new WeakMap<
  HTMLElement,
  { nat: number; base: number; tgt: number; scale: number; textHash: number }
>();

export default function useCompressToWidth(
  ref: React.RefObject<HTMLElement>,
  opts?: Opts
) {
  const fraction = Math.min(Math.max(opts?.fraction ?? 0.75, 0.05), 1);
  const epsilon = opts?.epsilonPx ?? 1;
  const debug = !!opts?.debug;
  const side = opts?.side ?? "unknown";
  const line = opts?.line ?? "unknown";
  const tag = opts?.tag;
  const verboseAll = !!opts?.verboseAll;
  const postVerifyTol = opts?.postVerifyTolerancePx ?? 2;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const titleBox = el.closest<HTMLElement>(".card-title");
    const titleZone = titleBox?.parentElement as HTMLElement | null; // .title-zone（含 logo）
    const card = el.closest<HTMLElement>(".card");
    if (!titleBox) return;

    let raf = 0;
    let applyId = 0;
    const t0 = performance.now();
    const pendingReasons = new Set<Trigger>();

    const hashText = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return h;
    };

    const csEl = getComputedStyle(el);
    const csBox = getComputedStyle(titleBox);

    // 初始化一次样式快照：看是否有导致误差的样式项
    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[fit:init-style]", {
        side, line, tag,
        el: {
          display: csEl.display,
          whiteSpace: csEl.whiteSpace,
          letterSpacing: csEl.letterSpacing,
          fontSize: csEl.fontSize,
          fontFamily: csEl.fontFamily,
        },
        box: {
          display: csBox.display,
          flexDirection: csBox.flexDirection,
          gap: csBox.gap,
          padding: csBox.padding,
        },
      });
    }

    const printSummary = (reasons: Trigger[], nat: number, tgt: number, scale: number) => {
      if (!debug) return;
      const dt = Math.round(performance.now() - t0);
      // eslint-disable-next-line no-console
      console.log(
        `[fit#${++applyId} +${dt}ms][${side}][${line}]${tag !== undefined ? `[tag=${tag}]` : ""} `
        + `trigger=${reasons.join("|")} nat=${Math.round(nat)} tgt=${Math.round(tgt)} scale=${scale.toFixed(3)}`
      );
    };

    const printDetails = (
      nat: number,
      base: number,
      tgt: number,
      scale: number,
      text: string
    ) => {
      if (!debug) return;

      const csNow = getComputedStyle(el);
      const details = {
        side, line, tag,
        text,
        // 元素自身
        el: {
          scrollWidth: Math.round(el.scrollWidth),
          clientWidth: Math.round(el.clientWidth),
          offsetWidth: Math.round(el.offsetWidth),
          rectWidth: Math.round(el.getBoundingClientRect().width),
          whiteSpace: csNow.whiteSpace,
          letterSpacing: csNow.letterSpacing,
        },
        // 标题容器
        box: {
          clientWidth: Math.round(titleBox.clientWidth),
          offsetWidth: Math.round(titleBox.offsetWidth),
          rectWidth: Math.round(titleBox.getBoundingClientRect().width),
          gap: getComputedStyle(titleBox).gap,
        },
        // 上一级（含 logo）
        zone: titleZone
          ? {
              clientWidth: Math.round(titleZone.clientWidth),
              offsetWidth: Math.round(titleZone.offsetWidth),
              rectWidth: Math.round(titleZone.getBoundingClientRect().width),
            }
          : undefined,
        // 卡片整体
        card: card
          ? {
              clientWidth: Math.round(card.clientWidth),
              rectWidth: Math.round(card.getBoundingClientRect().width),
            }
          : undefined,
        // 计算输入/结果
        naturalWidth: Math.round(nat),
        baseWidth: Math.round(base),
        targetWidth: Math.round(tgt),
        fraction,
        scaleX: +scale.toFixed(6),
        compressed: scale < 0.999,
      };

      // eslint-disable-next-line no-console
      console.log("[fit:measure]", details);
    };

    const printIfChangedOrVerbose = (
      nat: number,
      base: number,
      tgt: number,
      scale: number,
      text: string
    ) => {
      const textHash = hashText(text);
      const prev = lastLog.get(el);
      const changed =
        !prev ||
        Math.abs(prev.nat - nat) > 0.5 ||
        Math.abs(prev.base - base) > 0.5 ||
        Math.abs(prev.tgt - tgt) > 0.5 ||
        Math.abs(prev.scale - scale) > 1e-4 ||
        prev.textHash !== textHash;

      if (verboseAll || changed) {
        printDetails(nat, base, tgt, scale, text);
        lastLog.set(el, { nat, base, tgt, scale, textHash });
      }
    };

    const postVerify = (tgt: number) => {
      // 下一帧再测一次视觉宽度，校核是否达到目标
      requestAnimationFrame(() => {
        const rectW = el.getBoundingClientRect().width;
        const diff = Math.abs(rectW - tgt);
        if (diff > postVerifyTol) {
          // eslint-disable-next-line no-console
          console.warn(
            `[fit:mismatch][${side}][${line}]${tag !== undefined ? `[tag=${tag}]` : ""} `
            + `rect=${Math.round(rectW)} vs tgt=${Math.round(tgt)} (Δ=${diff.toFixed(2)}px)`
          );
        }
      });
    };

    const apply = (reasons: Trigger[]) => {
      const baseW = titleBox.clientWidth;
      const targetW = baseW * fraction;

      const st = el.style;

      // 测自然宽前移除缩放
      const prevTransform = st.transform;
      st.transform = "none";
      const naturalW = el.scrollWidth;

      let scaleX = 1;
      if (naturalW > targetW + epsilon) {
        scaleX = targetW / naturalW;
        if (scaleX > 0.999) scaleX = 1;
      }

      st.transformOrigin = "left center";
      st.transform = `scaleX(${scaleX})`;

      printSummary(reasons, naturalW, targetW, scaleX);
      printIfChangedOrVerbose(naturalW, baseW, targetW, scaleX, el.textContent ?? "");
      postVerify(targetW);

      void prevTransform;
    };

    const flush = () => {
      const reasons = Array.from(pendingReasons);
      pendingReasons.clear();
      apply(reasons);
    };

    const schedule = (reason: Trigger) => {
      pendingReasons.add(reason);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(flush);
    };

    // 初次
    schedule("init");

    // 尺寸监听
    const ro1 = new ResizeObserver(() => schedule("el-resize"));
    ro1.observe(el);
    const ro2 = new ResizeObserver(() => schedule("box-resize"));
    ro2.observe(titleBox);

    // 文案变化
    const mo = new MutationObserver(() => schedule("mutation"));
    mo.observe(el, { childList: true, characterData: true, subtree: true });

    // 窗口 resize
    const onWin = () => schedule("window-resize");
    window.addEventListener("resize", onWin);

    // 字体加载
    const fonts: any = (document as any).fonts;
    const onFontsReady = () => schedule("fonts-ready");
    if (fonts?.addEventListener) {
      fonts.addEventListener("loadingdone", onFontsReady);
      fonts.ready?.then?.(onFontsReady);
    }

    // 标题区内的 logo 图片加载（影响容器宽）
    const logoImg =
      titleZone?.querySelector("img") ??
      titleZone?.querySelector("image") ??
      null;
    const onImgLoad = () => schedule("img-load");
    if (logoImg) {
      if ("complete" in logoImg && (logoImg as any).complete) {
        // 已缓存的图片也会影响布局，仍然触发一次
        schedule("img-load");
      } else {
        logoImg.addEventListener("load", onImgLoad);
      }
    }

    return () => {
      ro1.disconnect();
      ro2.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", onWin);
      if (fonts?.removeEventListener) fonts.removeEventListener("loadingdone", onFontsReady);
      if (logoImg) logoImg.removeEventListener("load", onImgLoad);
      cancelAnimationFrame(raf);
    };
  }, [
    ref,
    fraction,
    epsilon,
    debug,
    side,
    line,
    tag,
    opts?.verboseAll,
    opts?.postVerifyTolerancePx,
  ]);
}
