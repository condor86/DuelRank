// src/components/duel/BadgeRow.tsx
import { orgKey, seriesKey } from "./duel-utils";

type BadgeKind = "type" | "org" | "series" | "tag";
type BadgeItem = { text: string; kind: BadgeKind };

export default function BadgeRow({ badges }: { badges: BadgeItem[] }) {
  if (!badges.length) return null;
  return (
    <div className="badges">
      {badges.map((b) => {
        const extraOrgClass    = b.kind === "org"    ? ` badge-org--${orgKey(b.text)}` : "";
        const extraSeriesClass = b.kind === "series" ? ` badge-series--${seriesKey(b.text)}` : "";
        return (
          <span key={`${b.kind}:${b.text}`} className={`badge badge--${b.kind}${extraOrgClass}${extraSeriesClass}`}>
            {b.text}
          </span>
        );
      })}
    </div>
  );
}
