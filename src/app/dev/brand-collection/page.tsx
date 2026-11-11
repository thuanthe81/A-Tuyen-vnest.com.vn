import Link from "next/link";
import { buildMetadata } from "@/seo/metadata";

/**
 * DESIGN EXPLORATION for the homepage Brand Collection (15/10/2026). Two isolated concepts on
 * the same content; neither is approved, neither is on the homepage. Never indexed.
 * Reasoning and evidence: docs/design/brand-collection and docs/qa/brand-collection.
 */
export const metadata = buildMetadata({ title: "Khảo sát: bộ sưu tập thương hiệu", path: () => "/dev/brand-collection", noindex: true });

const CONCEPTS = [
  { href: "/dev/brand-collection/a", name: "A · Curated Brand Gallery", line: "Ba thương hiệu cùng hiện diện như ba tác phẩm trong một phòng trưng bày; mỗi tấm là một bộ lọc. VNest là bức tường và tấm mở đầu." },
  { href: "/dev/brand-collection/b", name: "B · Connected Brand Index", line: "Một chỉ mục gọn và một sân khấu. Sợi chỉ đồng nối các thương hiệu, buộc vòng ở lựa chọn và dẫn vào sân khấu." },
] as const;

export default function BrandCollectionExploration() {
  return (
    <main className="mx-auto max-w-site px-(--vn-gutter) py-(--vn-space-16)">
      <p className="text-xs font-medium tracking-[0.12em] text-ink-muted uppercase">Khảo sát thiết kế · chưa duyệt</p>
      <h1 className="mt-2 text-(length:--vn-text-3xl) leading-(--vn-leading-tight) font-medium tracking-[-0.02em]">Bộ sưu tập thương hiệu trên trang chủ</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Hai hướng trên cùng nội dung. Logo ba thương hiệu là ô chờ, ảnh là tranh vẽ mẫu, khu vực chưa xác minh. Thêm <code>?areas=sample</code> để thử bộ lọc khu vực với dữ liệu mẫu.
      </p>
      <ul className="mt-(--vn-space-8) grid gap-4 md:grid-cols-2">
        {CONCEPTS.map((concept) => (
          <li key={concept.href}>
            <Link href={concept.href} className="block h-full rounded-(--bk-r-shell) border border-line bg-surface-raised p-(--vn-space-6) transition-colors duration-(--vn-duration-fast) hover:border-ink">
              <span className="text-(length:--vn-text-xl) font-semibold">{concept.name}</span>
              <span className="mt-2 block text-ink-muted">{concept.line}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
