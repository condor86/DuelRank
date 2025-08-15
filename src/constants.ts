// src/constants.ts

/** —— App 基本信息 —— */
export const APP_NAME = "DuelRank";

/** —— 静态资源基路径 —— 
 * 本地 dev 为 "/"；例如部署到 GitHub Pages 的仓库子路径时会是 "/<repo>/"。
 */
export const BASE_URL = import.meta.env.BASE_URL || "/";

/** —— 公共数据文件（放在 public/ 下） —— */
export const DATA_URL = `${BASE_URL}MobileWeapons.json`;
export const SERIES_URL = `${BASE_URL}Series.json`;

/** —— 视觉/布局 —— 
 * 与 App.css 中 .card-media { aspect-ratio: 16 / 10 } 保持一致
 */
export const CARD_ASPECT = 16 / 10;

/** —— Elo 相关默认值 —— */
export const ELO_INITIAL_RATING = 1000;
export const ELO_K_FACTOR = 24;

/** —— 持久化与加载超时 —— */
export const PERSIST_DEBOUNCE_MS = 120;   // 保存到 localStorage 的防抖时间
export const LOAD_TIMEOUT_MS = 8000;      // 首次加载容错超时（显示错误而不是卡住）

/** —— 导出文件名 —— */
export const EXPORT_FILENAME = "duelrank-export.json";

/** —— 桌面断点（与 App.css 的 @media 保持一致）—— */
export const DESKTOP_MIN_WIDTH = 960;

/** —— 中间列的建议宽度（与 App.css: minmax(120px, 200px) 对齐）—— */
export const CENTER_COL_MIN = 120;
export const CENTER_COL_MAX = 200;
