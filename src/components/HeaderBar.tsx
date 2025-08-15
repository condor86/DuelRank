// src/components/HeaderBar.tsx
import { ChangeEvent, useRef } from "react";

type Props = {
  onReshuffle: () => void;           // 目前不再使用，仅为兼容现有 App.tsx
  onExport: () => void;
  onImport: (file: File | null) => void;
  onReset: () => void;
};

export default function HeaderBar({
  onReshuffle, // eslint-disable-line @typescript-eslint/no-unused-vars
  onExport,
  onImport,
  onReset,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onImport(f);
    // 清空以便可重复选择同一文件
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="header">
      <div>
        <div className="h-title">选择你更喜欢的一台机体</div>
        <div className="h-sub">点击左右进行投票，我们会据此更新你的偏好排行。</div>
      </div>
      <div className="h-actions">
        {/* 已按你的要求移除：换一组 / 我全都喜欢 */}
        <button className="btn btn-ghost" onClick={onExport}>导出</button>
        <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
          导入
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
        <button className="btn btn-ghost" onClick={onReset}>重置</button>
      </div>
    </div>
  );
}
