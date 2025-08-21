// src/components/duelcard/index.ts
export { default as DuelCard } from "./DuelCard";
export { default as DuelCardHeader } from "./DuelCardHeader";
export { default as BadgeRow } from "./BadgeRow";
export { default as SpecsBlock } from "./SpecsBlock";
export { default as QuoteBlock } from "./QuoteBlock";
export { default as DuelActions } from "./DuelActions";

// 如果你把类型单独放了 types.ts，也顺手导出去（可选）
export type { MobileWeaponLike, Specs } from "./types";
