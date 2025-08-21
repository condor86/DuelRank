// src/components/duel/DuelActions.tsx
import { Ref } from "react";
export default function DuelActions({
  side, onVote, btnRef,
}: { side: "left" | "right"; onVote: () => void; btnRef?: Ref<HTMLButtonElement>; }) {
  return (
    <div className="card-actions btns-stacked">
      <button ref={btnRef} className={`vote ${side}`} onClick={onVote}>
        {side === "left" ? "更喜欢左边" : "更喜欢右边"}
      </button>
    </div>
  );
}
