// src/components/duel/DuelCardHeader.tsx
export default function DuelCardHeader({
    code, modelName, kana, official,
  }: { code: string; modelName: string; kana?: string; official?: string; }) {
    return (
      <>
        <div className="card-title">
          <span className="title-code">{code}</span>
          <span className="title-name">{modelName}</span>
        </div>
        {kana && <div className="card-kana">{kana}</div>}
        {official && <div className="card-official">{official}</div>}
      </>
    );
  }
  