// src/components/RankTable.tsx

type MobileWeaponLike = {
    id: number;
    name: string;
    classification?: string;
    series?: string;
    wikiUrl?: string;
  };
  
  type RatingLike = { id: number; rating: number; games?: number };
  
  type Props = {
    items: MobileWeaponLike[];
    sorted: RatingLike[]; // 按 rating 降序排列
  };
  
  export default function RankTable({ items, sorted }: Props) {
    return (
      <table className="rank-table">
        <thead>
          <tr>
            <th className="rank-pos">#</th>
            <th>机体</th>
            <th>分类</th>
            <th>作品</th>
            <th className="rank-score">Elo</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const m = items.find((d) => d.id === r.id);
            if (!m) return null;
            return (
              <tr key={r.id}>
                <td className="rank-pos">{i + 1}</td>
                <td style={{ fontWeight: 700 }}>
                  {m.wikiUrl ? (
                    <a
                      href={m.wikiUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {m.name}
                    </a>
                  ) : (
                    m.name
                  )}
                </td>
                <td style={{ color: "var(--muted)" }}>{m.classification}</td>
                <td style={{ color: "var(--muted)" }}>{m.series || "-"}</td>
                <td className="rank-score">{r.rating.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
  