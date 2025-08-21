// src/hooks/useCompressToWidth.ts
import { useLayoutEffect } from "react";

/**
 * 将元素在水平方向按 scaleX 压缩以适配容器可用宽。
 * - 可用宽 = 最近的 .card-title 的 clientWidth × fraction
 * - 仅压缩（scaleX<=1），不拉伸
 * - 响应：容器尺寸 / 文案变化 / 字体加载 / 窗口 resize
 * - debug: 仅打印到 console，不做任何 DOM 可视化
 */

type Opts = {
  fraction?: number;
  epsilonPx?: number;
  debug?: boolean;
};

// 记忆上一次已输出到 console 的关键数值，避免频繁刷屏
const lastLog = new WeakMap<
  HTMLElement,
  { nat: number; base: number; tgt: number; scale: number }
>();

export default function useCompressToWidth(
  ref: React.RefObject<HTMLElement>,
  opts?: Opts
) {
  const fraction = Math.min(Math.max(opts?.fraction ?? 0.75, 0.05), 1); // 0.05~1
  const epsilon = opts?.epsilonPx ?? 1; // 1px 容差
  const debug = !!opts?.debug;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const titleBox = el.closest<HTMLElement>(".card-title");
    if (!titleBox) return;

    let raf = 0;

    const labelOf = (node: HTMLElement) => {
      // 尽量给出有辨识度的标签名
      const cls = (node.className || "").toString().trim();
      if (cls) return `.${cls.split(/\s+/).join(".")}`;
      return `<${node.tagName.toLowerCase()}>`;
    };

    const logIfChanged = (nat: number, base: number, tgt: number, scale: number) => {
      if (!debug) return;

      const prev = lastLog.get(el);
      const changed =
        !prev ||
        Math.abs(prev.nat - nat) > 0.5 ||
        Math.abs(prev.base - base) > 0.5 ||
        Math.abs(prev.tgt - tgt) > 0.5 ||
        Math.abs(prev.scale - scale) > 1e-4;

      if (changed) {
        // 打印一次
        // 示例：
        // [fit].title-name nat=642 tgt=480 base=640 frac=0.75 scale=0.748 (compressed)
        const note = scale < 0.999 ? "compressed" : "no-compress";
        // 使用整数打印像素，scale 保留 3 位
        // 这样能更直观看尺寸变化
        // eslint-disable-next-line no-console
        console.log(
          `[fit]${labelOf(el)} nat=${Math.round(nat)} tgt=${Math.round(
            tgt
          )} base=${Math.round(base)} frac=${fraction} scale=${scale.toFixed(3)} (${note})`
        );
        lastLog.set(el, { nat, base, tgt, scale });
      }
    };

    const apply = () => {
      const baseW = titleBox.clientWidth; // 容器真实可用宽
      const targetW = baseW * fraction;

      const st = el.style;

      // 测自然宽前移除缩放
      const prevTransform = st.transform;
      st.transform = "none";

      const naturalW = el.scrollWidth; // 文本自然单行宽
      let scaleX = 1;

      if (naturalW > targetW + epsilon) {
        scaleX = targetW / naturalW;
        if (scaleX > 0.999) scaleX = 1; // 极小压缩忽略
      }

      st.transformOrigin = "left center";
      st.transform = `scaleX(${scaleX})`;

      // 仅打印到控制台
      logIfChanged(naturalW, baseW, targetW, scaleX);

      // 还原 transform 不是必须；此处保留当前值即可
      // st.transform = prevTransform; // 不要恢复，否则视觉效果会丢失
      // 但保留 prevTransform 这行变量以避免未使用告警
      void prevTransform;
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    // 初次
    apply();

    // 监听：自身与容器尺寸
    const ro1 = new ResizeObserver(schedule);
    ro1.observe(el);
    const ro2 = new ResizeObserver(schedule);
    ro2.observe(titleBox);

    // 文案变化
    const mo = new MutationObserver(schedule);
    mo.observe(el, { childList: true, characterData: true, subtree: true });

    // 窗口 resize
    window.addEventListener("resize", schedule);

    // 字体加载
    const fonts: any = (document as any).fonts;
    const onFontsReady = () => schedule();
    if (fonts?.addEventListener) {
      fonts.addEventListener("loadingdone", onFontsReady);
      fonts.ready?.then?.(onFontsReady);
    }

    return () => {
      ro1.disconnect();
      ro2.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
      if (fonts?.removeEventListener) fonts.removeEventListener("loadingdone", onFontsReady);
      cancelAnimationFrame(raf);
    };
  }, [ref, fraction, epsilon, debug]);
}
