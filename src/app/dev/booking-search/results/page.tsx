import Link from "next/link";
import { routes } from "@/config/routes";
import { nightsBetween } from "@/domain/dates";
import type { QueryInput } from "@/domain/search";
import { hasDates, parseStaySearch, validateCriteria } from "@/domain/search";
import { issueMessage } from "@/features/booking-search/copy";
import { formatDayLong } from "@/features/booking-search/format";
import { buildMetadata } from "@/seo/metadata";
import { resolveSearchScope } from "@/server/availability";
import { getServices } from "@/server/services";
import { loadPropertyOptions } from "../properties";

/**
 * DEVELOPMENT SEARCH HANDLER. It stands where the results page (section 02.2) will be and
 * only shows what the search bar sent and which properties that search would cover. It asks
 * no provider anything: no availability or price is looked up, simulated or implied here.
 */
export const metadata = buildMetadata({ title: "Trình xử lý tìm kiếm thử nghiệm", path: () => routes.dev.bookingSearchResults(), noindex: true });

/** A short, visible wait so the Search button's loading state can be reviewed. Development only. */
const SIMULATED_WAIT_MS = 900;

export default async function DevSearchHandler({ searchParams }: { searchParams: Promise<QueryInput> }) {
  const query = await searchParams;
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_WAIT_MS));
  const { state, issues: parseIssues } = parseStaySearch(query);
  const { criteria, filters } = state;
  const issues = [...parseIssues, ...validateCriteria(criteria)];

  const [options, resolved] = await Promise.all([loadPropertyOptions(), resolveSearchScope(getServices(), filters.property)]);
  const covered = options.filter((option) => resolved?.propertyIds.includes(option.id));
  const intent = !resolved
    ? "Cơ sở trong URL không tồn tại"
    : resolved.scope === "single-property"
      ? "Chỉ tìm ở cơ sở đã chọn"
      : "Tìm ở tất cả cơ sở";

  const rows: [string, string][] = [
    ["Phạm vi tìm kiếm", intent],
    ["Cơ sở", filters.property ? (covered[0]?.name ?? filters.property) : "Tất cả cơ sở (không chọn cơ sở nào)"],
    ["Nhận phòng", criteria.checkIn ? formatDayLong(criteria.checkIn) : "Chưa chọn"],
    ["Trả phòng", criteria.checkOut ? formatDayLong(criteria.checkOut) : "Chưa chọn"],
    ["Số đêm", hasDates(criteria) ? String(nightsBetween(criteria.checkIn, criteria.checkOut)) : "—"],
    ["Khách", String(criteria.adults)],
  ];

  return (
    <main className="mx-auto max-w-2xl px-(--vn-gutter) py-(--vn-space-16)">
      <p className="inline-block rounded-full bg-surface-muted px-3 py-1 text-xs font-medium">Trình xử lý thử nghiệm · không phải kết quả thật</p>
      <h1 className="mt-(--vn-space-4) text-(length:--vn-text-2xl) leading-(--vn-leading-tight) font-semibold">Tiêu chí tìm kiếm đã nhận</h1>
      <p className="mt-(--vn-space-3) text-ink-muted">
        Thanh tìm kiếm đã gửi các giá trị dưới đây qua URL. Trang kết quả phòng trống và chọn giá thuộc Mục 02.2 và chưa được xây dựng. Không có
        phòng trống hay giá nào được tra cứu ở đây.
      </p>
      <dl className="mt-(--vn-space-8) divide-y divide-line border-y border-line">
        {rows.map(([term, value]) => (
          <div key={term} className="flex justify-between gap-6 py-(--vn-space-3)">
            <dt className="text-ink-muted">{term}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-(--vn-space-8) font-semibold">Các cơ sở sẽ được gửi tới nhà cung cấp đặt phòng ({covered.length})</h2>
      <p className="mt-(--vn-space-1) text-sm text-ink-muted">
        Dữ liệu mẫu. Danh sách luôn được liệt kê rõ ràng theo mã cơ sở, kể cả khi tìm ở tất cả cơ sở.
      </p>
      <ul className="mt-(--vn-space-3) divide-y divide-line border-y border-line">
        {covered.map((option) => (
          <li key={option.id} className="flex justify-between gap-6 py-(--vn-space-3)">
            <span className="font-medium">{option.name}</span>
            <code className="text-sm text-ink-muted">{option.id}</code>
          </li>
        ))}
      </ul>

      {issues.length > 0 ? (
        <ul className="mt-(--vn-space-6) list-disc pl-5 text-critical">
          {issues.map((issue, index) => (
            <li key={index}>{issueMessage(issue)}</li>
          ))}
        </ul>
      ) : null}
      <p className="mt-(--vn-space-8)">
        <Link href={routes.dev.bookingSearch(state)} className="inline-flex h-11 items-center rounded-full border border-ink px-5 text-sm font-semibold">
          ← Quay lại thanh tìm kiếm với các giá trị này
        </Link>
      </p>
    </main>
  );
}
