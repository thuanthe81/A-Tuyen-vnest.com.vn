import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { cityNote } from "@/content/vnest-workbook/city-notes";
import type { CityId } from "@/content/vnest-workbook/ids";
import { WORKBOOK } from "@/content/vnest-workbook/workbook";
import { CityNotes, type MobileFeatured } from "@/features/city-notes/CityNotes";
import { buildCityNotesView, type CityNotesAudience } from "@/features/city-notes/view";
import { reviewAccess } from "@/features/property-detail/review-access";
import { buildMetadata } from "@/seo/metadata";
import styles from "./page.module.css";

/**
 * VNEST CITY NOTES, STANDALONE PROTOTYPE (CS-7, 20/10/2026). Private and local; never indexed;
 * not linked from any property page. The module is drawn where the spec places it, after Vị trí,
 * with the unchanged sections around it shown as ghosts. Nothing here touches /dev/stays/*.
 *
 * Query: ?city=da-nang · ?audience=public (what a public build shows: no review flags) ·
 * ?mobile=3 (refinement 1: three places on phones, for comparison).
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "VNest City Notes · bản xem trước", path: () => "/dev/city-notes", noindex: true });

// The same rule as the Bare Chic review pages: 404 unless DEPLOY_ENV=development is declared.
const ACCESS = reviewAccess(env);
const PATH = "/dev/city-notes";
const CITIES: { id: CityId; label: string; serves: string }[] = [
  { id: "ho-chi-minh", label: "TP. Hồ Chí Minh", serves: "Bare Chic" },
  { id: "da-nang", label: "Đà Nẵng", serves: "Bare Hàn" },
];

type Query = { city?: string; audience?: string; mobile?: string };

function href(query: Query) {
  const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined) as [string, string][]);
  const s = params.toString();
  return s ? `${PATH}?${s}` : PATH;
}

export default async function CityNotesPreview({ searchParams }: { searchParams: Promise<Query> }) {
  if (!ACCESS.route) notFound();
  const query = await searchParams;
  const city = CITIES.find((c) => c.id === query.city) ?? CITIES[0]!;
  const simulated = query.audience === "public";
  const audience: CityNotesAudience = ACCESS.privatePreview && !simulated ? "private-preview" : "public";
  const mobileFeatured: MobileFeatured = query.mobile === "3" ? 3 : 4;
  const note = cityNote(city.id);
  const view = note ? buildCityNotesView(note, { audience }) : null;
  const received = `${WORKBOOK.received.slice(8, 10)}/${WORKBOOK.received.slice(5, 7)}`;
  const keep = { city: query.city, audience: query.audience, mobile: query.mobile };

  return (
    <main className={styles.page}>
      <div className={styles.review}>
        <p>
          <strong>Bản xem trước riêng</strong> · VNest City Notes · Dữ liệu VNest {received}, chưa duyệt · {audience === "private-preview" ? "Có ghi chú cho VNest." : "Bản công khai: không có ghi chú."}
        </p>
        <nav aria-label="Tuỳ chọn xem trước" className={styles.switches}>
          {CITIES.map((c) => (
            <a key={c.id} href={href({ ...keep, city: c.id === "ho-chi-minh" ? undefined : c.id })} aria-current={c.id === city.id ? "true" : undefined}>
              {c.label}
            </a>
          ))}
          <a href={href({ ...keep, audience: simulated ? undefined : "public" })}>{simulated ? "Bản xem trước riêng" : "Xem như bản công khai"}</a>
          <a href={href({ ...keep, mobile: mobileFeatured === 3 ? undefined : "3" })}>{mobileFeatured === 3 ? "Điện thoại: 4 địa điểm" : "Điện thoại: thử 3 địa điểm"}</a>
        </nav>
      </div>

      <div className={styles.wrap}>
        <div className={styles.ghost} aria-hidden="true">
          <p className={styles.ghostHead}>
            Các loại phòng <small>04 · {city.serves} · không đổi</small>
          </p>
          <div className={styles.bars}>
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className={styles.ghost} aria-hidden="true">
          <p className={styles.ghostHead}>
            Vị trí <small>05 · không đổi</small>
          </p>
          <div className={styles.bars}>
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className={styles.slot}>{view ? <CityNotes view={view} mobileFeatured={mobileFeatured} /> : null}</div>

        <p className={styles.ghostFoot} aria-hidden="true">
          Chân trang · không đổi
        </p>
      </div>
    </main>
  );
}
