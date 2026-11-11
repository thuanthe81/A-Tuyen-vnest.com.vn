import type { Locale } from "@/domain/locale";

/**
 * ENGLISH ALT TEXT for VNest's photographs (bilingual preview, 6/11/2026). Keyed by the exact Vietnamese alt text, which
 * stays the source of truth. Each English line describes only what its Vietnamese line says: build-team DRAFT for VNest
 * approval (docs/i18n/EN-TRANSLATION-SET.md). Phase A: the curated selection (image-selection.ts); room photographs follow
 * with the property content (phase D). A photo without an entry keeps its Vietnamese alt and is reported by the audit.
 */
export const PHOTO_ALT_EN: Readonly<Record<string, string>> = {
  "Bare Chic One: giường với gối vàng dưới tranh màu, góc bếp nhỏ tủ xanh ngọc và tủ quần áo mở":
    "Bare Chic One: a bed with yellow pillows under a colourful painting, a small kitchenette with teal cabinets and an open wardrobe",
  "Bare Chic Two: một người ngồi bên cửa sổ trong ánh sáng dịu, tranh treo tường bên cạnh":
    "Bare Chic Two: a person sitting by the window in soft light, with a painting on the wall beside them",
  "Bare Chic Three: giường gối vàng và bàn làm việc bên khung cửa kính lớn nhìn ra cây xanh và thành phố":
    "Bare Chic Three: a bed with yellow pillows and a desk by a large glass window looking out to greenery and the city",
  "Bare Hyphen One: giường với gối hoạ tiết lá trước tường xanh đậm, tủ gỗ sáng và cây xanh bên cửa":
    "Bare Hyphen One: a bed with leaf-print pillows against a dark green wall, a light wood cabinet and a plant by the door",
  "Bare Hyphen Two: giường rộng trước tường xanh đậm, góc bếp có kệ đèn và TV treo tường":
    "Bare Hyphen Two: a large bed against a dark green wall, a kitchenette with lit shelves and a wall-mounted TV",
  "Bare Đa Kao One: giường bên khung kính có hàng trúc, vách kính phòng tắm và bàn ăn nhỏ phía sau":
    "Bare Đa Kao One: a bed beside a glass window lined with bamboo, a glass bathroom partition and a small dining table behind",
  "Bare Đa Kao Two: giường và ghế ngồi dài bọc nệm xám, bàn tròn bên ô cửa kính khối":
    "Bare Đa Kao Two: a bed and a long grey upholstered bench, with a round table by a glass-block window",
  "Bare Đa Kao Three: góc bếp tủ tối màu, bàn tròn và ghế ngồi dài dưới cửa sổ kính khối":
    "Bare Đa Kao Three: a kitchenette with dark cabinets, a round table and a long bench under a glass-block window",
  "Bare Đa Kao Four: ghế sofa và bàn trước cửa kính mở ra ban công cây xanh, tủ treo đồ khung đồng":
    "Bare Đa Kao Four: a sofa and table in front of a glass door opening onto a leafy balcony, with a brass-framed clothes rack",
  "Bare Hàn Ground: vòm gỗ, ghế ngồi dài bên giếng trời cây xanh và tủ quần áo xanh lá":
    "Bare Hàn Ground: a wooden arch, a long bench by a planted light well and a green wardrobe",
  "Bare Hàn Two: giường gối xanh, kệ bếp gỗ có đèn, ghế bành vàng và bàn tròn bên cửa kính":
    "Bare Hàn Two: a bed with green pillows, a lit wooden kitchen shelf, a yellow armchair and a round table by the glass door",
  "Bare Hàn Three: quầy bếp khung gỗ với kệ đèn, bàn làm việc và cây xanh bên cửa kính":
    "Bare Hàn Three: a wood-framed kitchen counter with lit shelves, a desk and a plant by the glass door",
  "Pale Blue Eyes: ghế bành và bàn tròn trước cửa kính ra ban công, góc bếp ốp gỗ và giường phía trước":
    "Pale Blue Eyes: an armchair and round table in front of the glass door to the balcony, a wood-panelled kitchenette and the bed in front",
  "Blue Moon: bồn tắm, gương trang trí trên vách gỗ và cửa ra ban công":
    "Blue Moon: a bathtub, a decorative mirror on a wooden wall and the door to the balcony",
  "Pepper House 3rd Floor: kệ gỗ có đèn với tranh và sách, hành lang dẫn tới cửa kính cuối phòng":
    "Pepper House 3rd Floor: lit wooden shelves with artwork and books, and a passage leading to the glass door at the end of the room",
  "Pepper House 3rd Floor: sofa xanh, bàn gỗ tròn và bàn làm việc trước cửa kính nhìn ra cây xanh":
    "Pepper House 3rd Floor: a green sofa, a round wooden table and a desk in front of a glass window looking out to greenery",
  "Pepper House 4th Floor: giường trắng, sofa da cam, bàn làm việc và tủ quần áo khung kính":
    "Pepper House 4th Floor: a white bed, an orange leather sofa, a desk and a glass-framed wardrobe",
};

/** A photograph's alt text in a language: the English entry when there is one, otherwise VNest's own Vietnamese. */
export function photoAlt(alt: string, locale: Locale): string {
  return locale === "en" ? (PHOTO_ALT_EN[alt] ?? alt) : alt;
}
