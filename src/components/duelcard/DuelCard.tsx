// src/components/duel/DuelCard.tsx  （壳组件，职责只剩“编排”）
import { Ref, useMemo } from "react";
import DuelMedia from "./DuelMedia";
import DuelCardHeader from "./DuelCardHeader";
import BadgeRow from "./BadgeRow";
import SpecsBlock from "./SpecsBlock";
import QuoteBlock from "./QuoteBlock";
import DuelActions from "./DuelActions";
import { splitNameFallback } from "./duel-utils";
import type { MobileWeaponLike } from "./types";

type Props = {
  item: MobileWeaponLike;
  seriesLogoUrl?: string;
  orgLogoUrl?: string;
  containerAspect: number;
  side: "left" | "right";
  onVote: () => void;
  voteButtonRef?: Ref<HTMLButtonElement>;
};

export default function DuelCard({
  item, seriesLogoUrl, orgLogoUrl, containerAspect, side, onVote, voteButtonRef,
}: Props) {
  const code = item.code ?? splitNameFallback(item.name).code;
  const modelName = item.modelName ?? splitNameFallback(item.name).modelName;
  const fullTitle = code && modelName ? `${code} ${modelName}` : item.name ?? code ?? modelName;

  const logos = [seriesLogoUrl, orgLogoUrl].filter(Boolean) as string[];

  const badges = useMemo(() => {
    const raw = [];
    if (item.classification) raw.push({ text: item.classification, kind: "type" as const });
    if (item.organization)   raw.push({ text: item.organization,   kind: "org"  as const });
    if (item.series)         raw.push({ text: item.series,         kind: "series" as const });
    for (const t of item.tags ?? []) raw.push({ text: t, kind: "tag" as const });
    const seen = new Set<string>();
    return raw.filter(b => {
      const key = b.text.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [item.classification, item.organization, item.series, item.tags]);

  const quoteText = item.quoteText ?? item.notes ?? "";
  const titleLogoUrl = seriesLogoUrl ?? orgLogoUrl; // 或反过来：series 优先

  return (
    <article className="card">
      <DuelMedia src={item.imgUrl} alt={fullTitle} focus={item.crop ?? 50} containerAspect={containerAspect} />

      <div className="card-body body-relaxed">
        <div className="info-stack">
          <DuelCardHeader code={code} modelName={modelName} kana={item.kana} official={item.official} titleLogoUrl={titleLogoUrl} debugLabelPrefix={side.toUpperCase()}/>

          <BadgeRow badges={badges} />

          <QuoteBlock text={quoteText} by={item.quoteBy} />

          {/* specs 放在 tag 之后、quote 之前（折叠块） */}
          {item.specs && (
            <details className="specs-details">
              <summary className="specs-summary">
                <span className="specs-caret" aria-hidden>▶</span>
                <span>Profile</span>
              </summary>
              <div className="specs-wrapper">
                <SpecsBlock specs={item.specs} />
              </div>
            </details>
          )}

          {item.wikiUrl && (
            <a className="btn btn-ghost" href={item.wikiUrl} target="_blank" rel="noreferrer">
              Wiki
            </a>
          )}
        </div>

        <DuelActions side={side} onVote={onVote} btnRef={voteButtonRef} />
      </div>
    </article>
  );
}
