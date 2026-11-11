import Link from "next/link";
import { routes } from "@/config/routes";
import { buildMetadata } from "@/seo/metadata";

/**
 * Phase 01 placeholder. The homepage is designed and built in Phase 03; until then this
 * route only confirms that the foundation runs. It is never indexed.
 */
export const metadata = buildMetadata({ title: "Nền tảng kỹ thuật", path: routes.home, noindex: true });

export default function FoundationPage() {
  return (
    <main className="mx-auto max-w-site px-(--vn-gutter) py-(--vn-space-16)">
      <h1 className="font-display text-(length:--vn-text-2xl) leading-(--vn-leading-tight)">VNest V2</h1>
      <p className="mt-(--vn-space-4) text-ink-muted">Nền tảng kỹ thuật đã sẵn sàng. Trang chủ chưa được xây dựng.</p>
      <p className="mt-(--vn-space-6) flex flex-wrap gap-3">
        <Link href={routes.dev.bookingSearch()} className="inline-flex h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-on-action">
          Xem trước Mục 02.1: thanh tìm kiếm đặt phòng
        </Link>
        <Link href={routes.stays()} className="inline-flex h-11 items-center rounded-full border border-ink px-5 text-sm font-semibold">
          Xem trước Mục 02.2: kết quả phòng trống
        </Link>
      </p>
    </main>
  );
}
