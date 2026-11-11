import Link from "next/link";
import { buildMetadata } from "@/seo/metadata";

/**
 * DESIGN EXPLORATION for the property experience (section 05.1, checkpoint 2 onward).
 * Isolated directions for the gallery and the first screen. None is approved, none
 * replaces /stays/[property], and nothing here is reused by the site. Never indexed.
 */
export const metadata = buildMetadata({ title: "Khảo sát: thư viện ảnh trang cơ sở", path: () => "/dev/property-gallery", noindex: true });

const CONCEPTS = [
  { href: "/dev/property-gallery/living-frames", name: "Living Frames · Motion Contact Sheet", line: "Hướng đang làm: một khung phim chủ đạo, hai ảnh phụ đứng chung một đường chân, tên cơ sở và nút đặt phòng tách riêng. Chưa duyệt." },
  { href: "/dev/property-gallery/living-frames/media-a", name: "Living Frames · ảnh tham khảo A", line: "Thử với ảnh và phim thật (nguồn Pexels, không phải cơ sở VNest), giữ nguyên hình học hiện tại. Chỉ xem nội bộ. Chưa duyệt." },
  { href: "/dev/property-gallery/living-frames/media-b", name: "Living Frames · ảnh tham khảo B", line: "Cùng thiết kế và cùng ảnh tham khảo; hai khung phụ lớn hơn trên màn hình rộng. Chỉ xem nội bộ. Chưa duyệt." },
  { href: "/dev/property-gallery/b", name: "B+ · Cinematic Arrival, Editorial Discovery", line: "Hướng đang tinh chỉnh: một ảnh chủ đạo tràn màn hình, tên cơ sở đặt trên nền giấy, rồi bốn ảnh kể bốn khía cạnh. Chưa duyệt." },
  { href: "/dev/property-gallery/a", name: "Concept A · Architectural Editorial", line: "Giữ để so sánh. Một trang sách kiến trúc: chữ dẫn trước, các tấm ảnh lệch nhau trên lưới." },
  { href: "/dev/property-gallery/b-original", name: "Concept B (bản gốc)", line: "Giữ nguyên để so sánh trước và sau: thước phim tám khung hình cuộn ngang." },
] as const;

export default function PropertyGalleryExploration() {
  return (
    <main className="mx-auto max-w-site px-(--vn-gutter) py-(--vn-space-16)">
      <p className="text-xs font-medium tracking-[0.12em] text-ink-muted uppercase">Khảo sát thiết kế · chưa duyệt</p>
      <h1 className="mt-2 text-(length:--vn-text-3xl) leading-(--vn-leading-tight) font-medium tracking-[-0.02em]">Thư viện ảnh và màn hình đầu của trang cơ sở</h1>
      <p className="mt-3 max-w-2xl text-ink-muted">Các hướng tách biệt. Toàn bộ hình ảnh và nội dung là mẫu; phần chọn phòng và thanh tìm kiếm giữ nguyên.</p>
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
