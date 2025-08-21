// src/components/duel/QuoteBlock.tsx
export default function QuoteBlock({ text, by }: { text: string; by?: string }) {
    if (!text) return null;
    return (
      <figure className="card-quote">
        <blockquote className="quote-text">{text}</blockquote>
        {by && <figcaption className="quote-by">— {by}</figcaption>}
      </figure>
    );
  }
  