import type { Photo } from "@/app/dev/brand-collection/data";

/** An approved local photograph as responsive sources (AVIF, WebP, then JPEG), cropped by its own focal point. */
export function DemoPhoto({ photo, sizes, alt, loading }: { photo: Photo; sizes: string; alt: string; loading?: "lazy" }) {
  return (
    <picture>
      {photo.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={sizes} />
      ))}
      <img src={photo.fallback.src} srcSet={photo.fallback.srcSet} sizes={sizes} alt={alt} width={photo.width} height={photo.height} loading={loading} decoding="async" style={photo.objectPosition ? { objectPosition: photo.objectPosition } : undefined} />
    </picture>
  );
}
