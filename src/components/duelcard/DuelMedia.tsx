// src/components/duel/DuelMedia.tsx
import CroppedImage from "../CroppedImage";

export default function DuelMedia({
  src, alt, focus, containerAspect,
}: { src: string; alt: string; focus?: number; containerAspect: number; }) {
  return (
    <div className="card-media">
      <CroppedImage src={src} alt={alt} focus={focus ?? 50} containerAspect={containerAspect} />
    </div>
  );
}
