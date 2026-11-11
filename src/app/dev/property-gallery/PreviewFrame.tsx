import Link from "next/link";
import { Suspense } from "react";
import { env } from "@/config/env";
import { SampleBanner } from "@/features/availability/SampleBanner";
import { PropertySearchBar, PropertySearchBarFallback } from "@/features/property-page/PropertySearchBar";
import { loadPropertyOptions } from "../booking-search/properties";

const LINKS = [
  { key: "living-frames", href: "/dev/property-gallery/living-frames", label: "Living Frames · Motion Contact Sheet" },
  { key: "a", href: "/dev/property-gallery/a", label: "Concept A · Architectural Editorial" },
  { key: "b", href: "/dev/property-gallery/b", label: "B+ · Cinematic Arrival, Editorial Discovery" },
  { key: "b-original", href: "/dev/property-gallery/b-original", label: "Concept B (bản gốc)" },
] as const;

/**
 * What surrounds both concepts, so they are judged in the page they would live in: the sample
 * banner and the real criteria bar of the property page (sections 02.1 and 05.1, placed
 * unchanged), then the concept, then the rooms' place and a strip that says what this is.
 */
export async function PreviewFrame({ concept, surface, children }: { concept: (typeof LINKS)[number]["key"]; /** The concept's page colour, when the way back should sit on it too. */ surface?: string; children: React.ReactNode }) {
  const options = await loadPropertyOptions();
  const [first] = options;
  return (
    <>
      <SampleBanner />
      <div style={surface ? { background: surface } : undefined}>
        {first ? (
          <Suspense fallback={<PropertySearchBarFallback />}>
            <PropertySearchBar slug={first.slug} timeZone={undefined} options={options} mockEnabled={env.bookingProvider === "mock"} />
          </Suspense>
        ) : (
          <PropertySearchBarFallback />
        )}

        {children}
      </div>

      {/* The rooms' place. The concepts send "Xem phòng trống" here, as the property page does. */}
      <section id="rooms" aria-labelledby="rooms-title" className="scroll-mt-24 border-t border-line bg-surface">
        <div className="mx-auto min-h-[70svh] max-w-site px-(--vn-gutter) py-(--vn-space-16)">
          <h2 id="rooms-title" className="text-(length:--vn-text-2xl) leading-(--vn-leading-tight) font-medium tracking-[-0.02em]">
            Phòng
          </h2>
          <p className="mt-3 max-w-xl text-ink-muted">
            Phần chọn phòng và gói giá (mục 02.2) không nằm trong bản khảo sát này và không thay đổi. Trên trang thật, nút “Xem phòng trống” đưa khách tới đúng vị trí này, giữ nguyên ngày và số khách.
          </p>
          {first ? (
            <p className="mt-(--vn-space-6)">
              <Link href={`/stays/${first.slug}`} className="font-medium underline underline-offset-4">
                Mở trang cơ sở hiện tại để so sánh
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <footer className="bg-ink px-(--vn-gutter) py-(--vn-space-6) text-sm text-surface-raised">
        <div className="mx-auto flex max-w-site flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-medium tracking-[0.12em] uppercase">Khảo sát thiết kế · chưa duyệt · không phải trang thật</p>
          <nav aria-label="Các phương án" className="flex flex-col gap-1 md:flex-row md:gap-6">
            {LINKS.map((link) => (
              <Link key={link.key} href={link.href} aria-current={link.key === concept ? "page" : undefined} className="inline-flex h-11 items-center underline-offset-4 aria-[current=page]:font-semibold aria-[current=page]:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
