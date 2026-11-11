/**
 * CITY NOTES VIEW: what the module may say, from a traced CityNote (spec
 * docs/sections/city-notes-spec.md). Display strings only; the gate (isShowable) has already
 * decided what may appear. Review flags reach the page only in the private preview.
 */
import { CITY_LABELS, isShowable, type CityNote, type CityNoteCategory } from "@/content/vnest-workbook/city-notes";
import type { PriceAudience } from "@/content/vnest-workbook/pricing";

export type CityNotesAudience = PriceAudience;

export type CityNotePlaceView = {
  id: string;
  name: string;
  /** Null when the sheet has no usable address: the name stands alone. */
  location: string | null;
  /** The cells it came from, e.g. "C5 · D5", for the private preview's trace. */
  source: string;
  /** Private preview only: what VNest has to confirm about this place. */
  review: string | null;
};

export type CityNotesCategoryView = {
  id: CityNoteCategory;
  label: string;
  /** For "Xem tất cả 7 …". */
  noun: string;
  places: readonly CityNotePlaceView[];
  /** How many places the first view shows: the first ones, in the sheet's order. */
  featured: number;
};

export type CityNotesView = {
  city: string;
  label: string;
  heading: string;
  dek: string;
  sourceLine: string;
  categories: readonly [CityNotesCategoryView, CityNotesCategoryView];
  audience: CityNotesAudience;
  /** Private preview only: what the module still waits for from VNest. */
  pending: readonly { what: string; questions: readonly string[] }[];
};

const CATEGORY: Record<CityNoteCategory, { label: string; noun: string }> = {
  eat: { label: "Ăn & uống", noun: "địa điểm ăn uống" },
  explore: { label: "Khám phá", noun: "địa điểm tham quan" },
};

export function buildCityNotesView(note: CityNote, { audience }: { audience: CityNotesAudience }): CityNotesView | null {
  if (note.city.display === null) return null;
  const city = CITY_LABELS[note.city.display];
  const privatePreview = audience === "private-preview";

  const category = (id: CityNoteCategory): CityNotesCategoryView => {
    const places = note.places
      .filter((p) => p.category === id && isShowable(p))
      .map((p) => ({
        id: p.id,
        name: p.name.display!,
        location: p.location.display,
        source: [...p.name.source, ...p.location.source].map((s) => s.cell).join(" · "),
        review: privatePreview && p.flags.length ? p.flags.map((f) => `${f.cell}: ${f.issue} (${f.question})`).join("; ") : null,
      }));
    return { id, ...CATEGORY[id], places, featured: Math.min(note.featured[id].length, places.length) };
  };

  const flagged = note.places.filter((p) => p.flags.length);
  return {
    city,
    label: "VNest City Notes",
    heading: `Ăn gì, đi đâu ở ${city}`,
    dek: "Những địa điểm VNest gợi ý trong thành phố. Mỗi nơi kèm địa chỉ, để bạn tự sắp xếp lịch trình.",
    sourceLine: "Danh sách do VNest gợi ý. Giờ mở cửa có thể thay đổi, bạn nên kiểm tra trước khi đến.",
    categories: [category("eat"), category("explore")],
    audience,
    pending: privatePreview
      ? [
          ...(flagged.length ? [{ what: `Xác nhận dữ liệu nguồn: ${flagged.flatMap((p) => p.flags.map((f) => f.cell)).join(", ")}`, questions: ["Q32"] }] : []),
          { what: "Thứ tự bốn địa điểm hiện trước (đang theo thứ tự trong bảng)", questions: ["Q36"] },
          { what: "Một dòng giới thiệu và ảnh cho từng địa điểm (chưa có)", questions: ["Q34"] },
          { what: "Danh sách riêng cho từng cơ sở, kèm khoảng cách (chưa có)", questions: ["Q33"] },
        ]
      : [],
  };
}
