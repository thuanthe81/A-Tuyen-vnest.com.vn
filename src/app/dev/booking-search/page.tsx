import Link from "next/link";
import { routes } from "@/config/routes";
import type { QueryInput } from "@/domain/search";
import { parseStaySearch } from "@/domain/search";
import { HeroBookingBar } from "@/features/booking-search/HeroBookingBar";
import { StaySearchProvider } from "@/features/booking-search/StaySearchProvider";
import { StickyBookingBar } from "@/features/booking-search/StickyBookingBar";
import { buildMetadata } from "@/seo/metadata";
import { BACKDROPS, readBackdrop } from "./preview-options";
import type { BackdropId } from "./preview-options";
import { loadPropertyOptions } from "./properties";

/**
 * DEVELOPMENT PREVIEW for section 02.1, the floating booking search bar.
 *
 * Not a homepage. The "hero" is a drawn backdrop standing in for imagery so the bar can be
 * judged over light, dark and busy pictures; it shows no VNest property. The blocks below
 * exist only to make the page scroll, so the sticky hand-over can be seen. Never indexed.
 */
export const metadata = buildMetadata({ title: "Xem trước: thanh tìm kiếm đặt phòng", path: () => routes.dev.bookingSearch(), noindex: true });

function Wordmark({ dark }: { dark: boolean }) {
  return <span className={`text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-ink"}`}>VNest</span>;
}

export default async function BookingSearchPreview({ searchParams }: { searchParams: Promise<QueryInput> }) {
  const [query, properties] = await Promise.all([searchParams, loadPropertyOptions()]);
  const { state } = parseStaySearch(query);
  const backdropId = readBackdrop(query.bg);
  const backdrop = BACKDROPS[backdropId];
  // Changing the backdrop keeps the search that is in the URL.
  const backdropLink = (id: BackdropId) => {
    const base = routes.dev.bookingSearch(state);
    return `${base}${base.includes("?") ? "&" : "?"}bg=${id}`;
  };

  return (
    <StaySearchProvider properties={properties} initial={state} target={{ kind: "dev-preview" }}>
      <StickyBookingBar leading={<Wordmark dark={false} />} />

      <section aria-label="Nền minh hoạ cho thanh tìm kiếm" className="relative flex min-h-[88svh] flex-col" style={{ background: backdrop.background }}>
        <div className="mx-auto flex h-16 w-full max-w-site items-center justify-between px-(--vn-gutter)">
          <Wordmark dark={backdrop.dark} />
          <p className={`rounded-full px-3 py-1 text-xs font-medium ${backdrop.dark ? "bg-black/35 text-white" : "bg-white/70 text-ink"}`}>
            Xem trước phát triển · Mục 02.1
          </p>
        </div>
        <h1 className="sr-only">Xem trước thanh tìm kiếm đặt phòng</h1>
        <p className={`absolute top-20 right-(--vn-gutter) text-xs ${backdrop.dark ? "text-white/80" : "text-ink/70"}`}>
          Nền minh hoạ · không phải hình ảnh VNest
        </p>
        <div className="mt-auto px-(--vn-gutter) pb-[clamp(1.5rem,7svh,4.5rem)]">
          <HeroBookingBar />
        </div>
      </section>

      <main className="mx-auto max-w-site px-(--vn-gutter) py-(--vn-space-12)">
        <h2 className="text-(length:--vn-text-xl) font-semibold">Bảng điều khiển xem trước</h2>
        <p className="mt-(--vn-space-2) max-w-2xl text-ink-muted">
          Trang này chỉ dùng để đánh giá thanh tìm kiếm. Các cơ sở trong danh sách là dữ liệu mẫu, không phải cơ sở thật của VNest; không có
          phòng trống hay giá thật. Cuộn xuống để thấy thanh
          thu gọn dính ở đầu trang; cuộn lên để trở lại thanh đầy đủ.
        </p>
        <nav aria-label="Chọn nền minh hoạ" className="mt-(--vn-space-6) flex flex-wrap gap-2">
          {(Object.keys(BACKDROPS) as BackdropId[]).map((id) => (
            <Link
              key={id}
              href={backdropLink(id)}
              aria-current={id === backdropId ? "true" : undefined}
              className="flex h-11 items-center rounded-full border border-line px-5 text-sm font-medium aria-[current]:border-ink aria-[current]:bg-ink aria-[current]:text-surface-raised"
            >
              Nền: {BACKDROPS[id].label}
            </Link>
          ))}
        </nav>
        <p className="mt-(--vn-space-3) text-sm text-ink-muted">Đổi nền sẽ tải lại trang với tiêu chí đang có trên URL.</p>

        <h2 className="mt-(--vn-space-12) text-(length:--vn-text-xl) font-semibold">Nội dung giữ chỗ</h2>
        <p className="mt-(--vn-space-2) text-ink-muted">Các khối bên dưới không phải thiết kế. Chúng chỉ tạo chiều cao để kiểm tra hành vi dính.</p>
        <div className="mt-(--vn-space-6) grid gap-(--vn-space-6) md:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} aria-hidden="true" className="h-72 rounded-(--vn-radius-md) bg-surface-muted" />
          ))}
        </div>
      </main>
    </StaySearchProvider>
  );
}
