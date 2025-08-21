// src/components/duelcard/SpecsBlock.tsx
import React from "react";

export type Specs = Record<string, any>;

/** 将 snake_case 变成人类可读 */
const humanize = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** 标签文本（默认取路径最后一段） */
function labelFor(pathOrKey: string) {
  const last = pathOrKey.split(".").pop()!;
  return humanize(last);
}

/** 识别 armaments/arnaments/arnament 的 key */
function isArmamentsKey(k: string) {
  const n = k.toLowerCase();
  return n === "armaments" || n === "arnaments" || n === "arnament";
}

/** 值与单位的格式化；支持 {value, unit} 与 {count} */
function formatValueAndUnit(v: any): React.ReactNode {
  if (v == null) return "—";

  if (Array.isArray(v)) {
    // 数组在调用处单独渲染
    return JSON.stringify(v);
  }

  if (typeof v === "object") {
    const hasCount = typeof v.count === "number";
    const hasValue = v.value !== undefined && v.value !== null;
    const unit = v.unit ? String(v.unit) : "";

    if (hasCount && !hasValue) {
      // 仅数量：显示 × count（注意左右留空格）
      return (
        <>
          {" × "}{v.count}
        </>
      );
    }
    if (hasValue) {
      return (
        <>
          {String(v.value)}
          {unit ? ` ${unit}` : ""}
        </>
      );
    }
    // 兜底：对象转简短 JSON
    return JSON.stringify(v);
  }

  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

/** 一条规格行：␣-␣ + 粗体标题 + ␣ + 值（含单位） */
function SpecLine({
  title,
  valueNode,
}: {
  title: string;
  valueNode: React.ReactNode;
}) {
  return (
    <div className="specs-line">
      <span>{" - "}</span>
      <strong className="specs-key">{title}</strong>
      <span>{" "}</span>
      <span className="specs-val">{valueNode}</span>
    </div>
  );
}

/** 分组标题：加粗、略大、单独一行（样式交给 CSS） */
function GroupTitle({ text }: { text: string }) {
  return (
    <div className="specs-group-title">
      <strong>{humanize(text)}</strong>
    </div>
  );
}

/** 顶层/组内为数组时的渲染（含 armaments 特例） */
function ArrayBlock({
  groupKey,
  arr,
}: {
  groupKey: string;
  arr: any[];
}) {
  const isArms = isArmamentsKey(groupKey);
  return (
    <div>
      {arr.map((it, i) => {
        if (isArms) {
          // 规则：␣-␣ + name +（可选）␣×␣count
          const name = it?.name ?? String(it ?? "");
          const count =
            typeof it?.count === "number" ? it.count : undefined;
          return (
            <div key={`${groupKey}[${i}]`} className="specs-line">
              <span>{" - "}</span>
              <span>{name}</span>
              {count !== undefined && (
                <>
                  <span>{" × "}</span>
                  <span>{count}</span>
                </>
              )}
            </div>
          );
        }
        // 其它数组：以索引为标题，值字符串化（若你有更具体结构可再定制）
        const value =
          typeof it === "object" ? JSON.stringify(it) : String(it);
        return (
          <SpecLine
            key={`${groupKey}[${i}]`}
            title={labelFor(`${groupKey}[${i}]`)}
            valueNode={value}
          />
        );
      })}
    </div>
  );
}

/** 规格主组件：有啥就显示啥；顺序遵循 _meta.displayOrder（如有） */
export default function SpecsBlock({ specs }: { specs: Specs }) {
  if (!specs || typeof specs !== "object") return null;

  const order: string[] =
    (specs._meta?.displayOrder as string[])?.filter(Boolean) ??
    Object.keys(specs).filter((k) => k !== "_meta");

  return (
    <div
      className="specs-block"
      // 字号交给外层或 CSS 管理；若需要临时对齐片假名，外层容器可设置 font-size
    >
      {order.map((groupKey) => {
        const groupVal = specs[groupKey];
        if (groupVal == null) return null;

        // 顶层：标量
        if (typeof groupVal !== "object" || Array.isArray(groupVal)) {
          if (Array.isArray(groupVal)) {
            // 顶层数组（常见：armaments）
            return (
              <div key={groupKey} className="specs-group">
                <GroupTitle text={groupKey} />
                <ArrayBlock groupKey={groupKey} arr={groupVal} />
              </div>
            );
          }
          // 顶层标量（如 pilot）
          return (
            <div key={groupKey} className="specs-group">
              <GroupTitle text={groupKey} />
              <SpecLine
                title={labelFor(groupKey)}
                valueNode={formatValueAndUnit(groupVal)}
              />
            </div>
          );
        }

        // 顶层：对象分组（如 dimensions / mass / power ...）
        const entries = Object.entries(groupVal).filter(
          ([k]) => k !== "_meta"
        );

        return (
          <div key={groupKey} className="specs-group">
            <GroupTitle text={groupKey} />
            {entries.map(([k, v]) => {
              // 组内数组
              if (Array.isArray(v)) {
                const path = `${groupKey}.${k}`;
                if (isArmamentsKey(k)) {
                  return (
                    <div key={path}>
                      <ArrayBlock groupKey={k} arr={v} />
                    </div>
                  );
                }
                return (
                  <div key={path}>
                    <ArrayBlock groupKey={path} arr={v} />
                  </div>
                );
              }
              // 组内标量/对象
              return (
                <SpecLine
                  key={`${groupKey}.${k}`}
                  title={labelFor(`${groupKey}.${k}`)}
                  valueNode={formatValueAndUnit(v)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
