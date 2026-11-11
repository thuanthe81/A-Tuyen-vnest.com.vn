/**
 * VERBATIM SNAPSHOT of the client workbook, for the client-content previews (03.3-C1, 05.2).
 *
 * Source: VNest_Informationv2.xlsx, sheet "Tổng quan 6 cơ sở", rows 4–25 (one row per room).
 * Workbook sha256 126e77dca61f065a65027669ff2e2cf329dfeed1c01545ad7a94c8c4028241d9, received
 * 20/10/2026. It replaces VNest_Information.xlsx (sha256 b5081c75…a0af6f1, 15/10/2026); what
 * changed is in docs/content/WORKBOOK-V2-SOURCE-DIFF-2026-10-20.md. Generated from the workbook's
 * XML by a script, not typed by hand: every string is exactly the cell's value, including stray
 * spaces, Windows line breaks (\r\n) and quotation marks. Nothing is corrected here; the records
 * (records.ts) normalise, and record each rule they apply.
 *
 * Columns kept: B official property name (merged over the property's rows, so only on its first
 * row), C room name, D photo folder (cell text and hyperlink), E description, I address,
 * J Google Maps (cell text and hyperlink, which can differ). Rates (column L) are in rates.ts.
 *
 * Hyperlinks. v2 stores several hyperlink records over some cells (a record for the cell and
 * another for the merged range it belongs to). `DLink`/`JLink` is the record applied last, which
 * is what a spreadsheet opens; when more than one record covers the cell, all of them are kept in
 * document order in `DLinkRecords`/`JLinkRecords`, so a disagreement between them stays visible.
 */

export const WORKBOOK = {
  file: "VNest_Informationv2.xlsx",
  sha256: "126e77dca61f065a65027669ff2e2cf329dfeed1c01545ad7a94c8c4028241d9",
  received: "2026-10-20",
  sheet: "Tổng quan 6 cơ sở",
} as const;

/** The workbook this snapshot replaced, for the source-diff report and legacy references. */
export const PREVIOUS_WORKBOOK = {
  file: "VNest_Information.xlsx",
  sha256: "b5081c75847b1e0141c7453e0d1fbee41513e0232e00c5167ef28a0b1a0af6f1",
  received: "2026-10-15",
} as const;

/** One hyperlink record of the sheet: the range it was written for and its target. */
export type LinkRecord = { ref: string; target: string };

export type WorkbookRow = {
  row: number;
  /** Official property name, only on the first row of each property (B is merged over its rows). */
  B?: string;
  /** Room name. */
  C: string;
  /** Photo folder cell text and its hyperlink (the record applied last). */
  D: string;
  DLink: string;
  /** Every hyperlink record covering D, in document order, when there is more than one. */
  DLinkRecords?: readonly LinkRecord[];
  E?: string;
  I?: string;
  /** Google Maps cell text and its hyperlink (the record applied last). */
  J?: string;
  JLink?: string;
  /** Every hyperlink record covering J, in document order, when there is more than one. */
  JLinkRecords?: readonly LinkRecord[];
};

/** Merged ranges of B, E, I and J: a property's values cover all of its rows. */
export const PROPERTY_MERGES: readonly string[] = ["B12:B15","B16:B19","B20:B23","B24:B25","B4:B7","B8:B11","E12:E15","E16:E19","E20:E23","E24:E25","E4:E7","E8:E11","I12:I15","I16:I19","I20:I23","I24:I25","I4:I7","I8:I11","J12:J15","J16:J19","J20:J23","J24:J25","J4:J7","J8:J11"];

export const ROWS: readonly WorkbookRow[] = [
  { row: 4, B: "Bare Chic - Bare Boutique Stays", C: "Bare Chic One", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1eUkBZ-ntQTz79IcssBpiswLlkU4sGre4?usp=sharing", E: "Bare Chic – một ngôi nhà trong chuỗi các căn hộ Bare Boutique Stays. Không quá lộng lẫy như những khách sạn 3 – 4 sao bạn từng lưu trú mà ở Bare Chic đơn giản chỉ là nơi kết nối những trải nghiệm thú vị của bạn. Đó là một ngôi nhà gồm bốn tầng mà mỗi tầng là một căn studio riêng biệt, hiện đại và tiện nghi. Khi khép cửa căn phòng lại, hiện ra trước mắt bạn là một không gian nội thất gợi cảm với khoảng trời trong ô cửa cho riêng mình. Qua khung cửa sổ ấy, bạn và người đồng hành của mình ngồi tựa trên chiếc sofa, thưởng thức tách cà phê và cùng nhau đón một chút bình yên của buổi sớm mai.", I: "12/18 Nguyễn Thị Minh Khai, Phường Sài Gòn, Hồ Chí Minh", J: "https://share.google/fskgZreXVjowaoQCO", JLink: "https://share.google/fskgZreXVjowaoQCO" },
  { row: 5, C: "Bare Chic Two", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1-LJx_HPTYOn3GqOEXa8CDX5Rtg512e3L?usp=sharing", DLinkRecords: [{"ref":"D5:D7","target":"https://drive.google.com/drive/folders/1eUkBZ-ntQTz79IcssBpiswLlkU4sGre4?usp=sharing"},{"ref":"D5","target":"https://drive.google.com/drive/folders/1-LJx_HPTYOn3GqOEXa8CDX5Rtg512e3L?usp=sharing"}] },
  { row: 6, C: "Bare Chic Three", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1w_pMRvlJe_y1Fl0bQ9NGVLiFuU9M16fi?usp=sharing", DLinkRecords: [{"ref":"D5:D7","target":"https://drive.google.com/drive/folders/1eUkBZ-ntQTz79IcssBpiswLlkU4sGre4?usp=sharing"},{"ref":"D6","target":"https://drive.google.com/drive/folders/1w_pMRvlJe_y1Fl0bQ9NGVLiFuU9M16fi?usp=sharing"}] },
  { row: 7, C: "Bare Indochine", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1zzTq0l1QIhwPkUayZDvQKrUw2f4jETHk?usp=sharing", DLinkRecords: [{"ref":"D5:D7","target":"https://drive.google.com/drive/folders/1eUkBZ-ntQTz79IcssBpiswLlkU4sGre4?usp=sharing"},{"ref":"D7","target":"https://drive.google.com/drive/folders/1zzTq0l1QIhwPkUayZDvQKrUw2f4jETHk?usp=sharing"}] },
  { row: 8, B: "Bare Hyphen - Bare Boutique Stays", C: "Bare Hyphen One", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1WbvKxpl5G8VAsuTsS9Qrf0YHehU1nIsc?usp=sharing", E: "Bắt nguồn là câu chuyện của riêng mình, Bare Hyphen được viết tiếp một chương mới với phong cách thiết kế đan xen giữa quá khứ – hiện đại. Quá khứ với những hoài niệm đậm màu của thời gian và sự duyên dáng tươi trẻ của hiện tại. Quá khứ và hiện tại đan xen, kết nối cùng nhau tạo nên Bare Hyphen ấm cúng và tiện nghi. Bare Hyphen có bốn căn hộ, và vẫn được đặt theo tên đơn giản của những căn hộ trong chuỗi Bare Boutique Stay: One, Two, Three và Four. Ba căn hộ với hai tone màu đại diện khác nhau, riêng tư và thân quen như là nhà. Điểm nhấn của Bare Hyphen là các vật dụng nội thất được kết nối với nhau uyển chuyển, mềm mại, đường nét tinh gọn. Các vật liệu gỗ, đá mài, Inox màu Champagne được chọn làm vật liệu chủ đạo để thể hiện tính thẩm mỹ và chất cảm cho không gian nội thất.", I: "29A/18 Nguyễn Đình Chiểu, Phường Sài Gòn, Hồ Chí Minh\r\n\r\n", J: "https://share.google/YV37L6mKA2VrWBO2S", JLink: "https://share.google/YV37L6mKA2VrWBO2S", JLinkRecords: [{"ref":"J8","target":"https://share.google/fskgZreXVjowaoQCO"},{"ref":"J8:J11","target":"https://share.google/YV37L6mKA2VrWBO2S"}] },
  { row: 9, C: "Bare Hyphen Two", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1Jk6WG-M5Ld6tsUiMYXx2cHdKig-0OLA5?usp=sharing", JLink: "https://share.google/YV37L6mKA2VrWBO2S" },
  { row: 10, C: "Bare Hyphen Three", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/15aTksIiJG0E6F8ZzfxCokC5I7ZF7HrFG?usp=sharing", JLink: "https://share.google/YV37L6mKA2VrWBO2S" },
  { row: 11, C: "Bare Hyphen Four", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1LL8O9WuzdHR_gjTzIsIILl9sINLLxyiW?usp=sharing", JLink: "https://share.google/YV37L6mKA2VrWBO2S" },
  { row: 12, B: "Bare Đa Kao - Bare Boutique Stays", C: "Bare Đa Kao One", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1TZJ8RysVLkRy3SxikbyiGlK1fq1Xl2Ii?usp=sharing", E: "Bare Đa Kao được lấy cảm hứng từ vẻ đẹp duyên dáng của kiến trúc hiện đại Saigon thời vàng son những năm 1950-1970. Từ đó, Bare giữ gìn hơi thở Saigon qua tên gọi và cảm xúc. Khoác lên mình chiếc áo mang màu sắc của thời gian, sự từng trải và cả những nét thăng trầm, trong từng chi tiết thiết kế, chính là vẻ đẹp của ký ức và tình yêu dành cho Saigon.\r\n\r\nTrong Bare Đa Kao có 4 căn hộ, mỗi căn hộ đều gợi lên những hoài niệm và kết nối với Saigon thông qua những chi tiết thiết kế. Với màu sắc, không gian khác nhau nhưng vẫn giữ được tinh thần chung của Bare, không gian trong Bare Đa Kao mang ngôn ngữ thẩm mỹ thiết kế đương đại và gợi lên chút hoài niệm với văn hoá Saigon xưa. Trong từng căn hộ, Bare tinh tế chiều chuộng cảm xúc thông qua mùi hương, thông qua bức tranh Saigon và cả khung cửa rộng. Và gợi ra một không gian vừa đủ để đối thoại với chính mình, để “breathe in breathe out”.", I: "14/3 Nguyễn Đình Chiểu, phường Tân Định, TP HCM", J: "https://share.google/2GZVfHKLcCJLT8jU0", JLink: "https://share.google/YV37L6mKA2VrWBO2S", JLinkRecords: [{"ref":"J12","target":"https://share.google/2GZVfHKLcCJLT8jU0"},{"ref":"J12:J15","target":"https://share.google/YV37L6mKA2VrWBO2S"}] },
  { row: 13, C: "Bare Đa Kao Two", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/19LXf2U9cCMr9vs2Z9Mci2e3RzW5yHKXp?usp=sharing", JLink: "https://share.google/YV37L6mKA2VrWBO2S" },
  { row: 14, C: "Bare Đa Kao Three", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1pCY0MtwnEA31HP8DHxWimliqDh6XU4GP?usp=sharing", JLink: "https://share.google/YV37L6mKA2VrWBO2S" },
  { row: 15, C: "Bare Đa Kao Four", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1G5U-P00SFqMk6n7QNz66SD3HXNhfkxrh?usp=sharing", JLink: "https://share.google/YV37L6mKA2VrWBO2S" },
  { row: 16, B: "Bare Hàn - Bare Boutique Stays", C: "Bare Hàn Ground", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1qX1rKDTZSbS0c_KdGh3tbSk_gf8lugnb?usp=sharing", E: "Mỗi tầng tại Bare Han chỉ chứa một căn hộ. Khi bước vào, bạn sẽ trải nghiệm những cảm xúc dễ chịu của một nơi bạn dễ dàng gọi là nhà. Tòa nhà gồm bốn căn hộ được sơn bốn màu khác nhau, thể hiện cảm xúc lạc quan của sự trẻ trung mà vẫn giữ được sự kết nối ấm áp với thiên nhiên thông qua khung kính tự do. Bare Han mang đến trải nghiệm trở về thân thuộc như ở nhà thông qua thiết kế đơn giản kết hợp cùng nhiều màu sắc tươi trẻ. Giao thoa giữa hiện tại và ký ức, giữa lịch sử và văn hoá, các chi tiết đường cong là điểm nhấn trong mỗi căn phòng. Khi bước vào, bạn sẽ trần trụi với chính mình và tiếp xúc với không gian bên ngoài thông qua các khung cửa kính phóng khoáng. Trên sân thượng Bare Han, bạn có thể ngắm mặt trời thức dậy, chia sẻ khoảnh khắc hoàng hôn hoặc đơn giản là thở cùng nhịp với thành phố. Bare Han chính là ngôi nhà của bạn trong thời gian lưu trú.", I: "K169/14 Trần Phú, Hải Châu, Đà Nẵng", J: "https://share.google/Zmxp6tjY7ZyBmBBud", JLink: "https://share.google/Zmxp6tjY7ZyBmBBud" },
  { row: 17, C: "Bare Hàn One", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1pOgr9Mm7hHXzirStOWOR7wEM2e8pAqA5?usp=sharing" },
  { row: 18, C: "Bare Hàn Two", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/15L3PUs29GMzUx_c9mVOExpV5JVJ_wa_1?usp=sharing" },
  { row: 19, C: "Bare Hàn Three", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1FFdEc9be4gOb073Kii5CNHGRsmR3mC4V?usp=sharing" },
  { row: 20, B: "The Nắng Suites", C: "Yellow Submarine", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1ExyqVrGs1azUqoX_gHyh15lxSYQw4kVC?usp=sharing", E: "So với việc ở khách sạn, The Nắng Suites có trải nghiệm rất riêng. Đây không chỉ là nơi để lưu trú, mà bạn có thể thong thả nghỉ ngơi và có những cuộc gặp gỡ thú vị. Nơi này được tạo ra để những câu chuyện được kể và chia sẻ. \r\n\r\nDạo quanh các căn phòng bạn dễ dàng nhận ra mọi thứ ở đây đều gọn gàng, tiện nghi và không gian được đề cao tính thẩm mỹ. Những căn phòng khách sạn có hiết kế như rập khuôn có làm bạn chán? Hãy tạm quên chúng đi. Cho dù đang tìm một nơi cho kỳ nghỉ của mình hay chỉ để nán lại vài hôm, bạn cần một chỗ nghỉ ngơi thoải mái, đủ khác biệt và riêng tư. Đây chính là nơi để bạn ngủ trong yên bình và thức dậy trong nắng ấm.", I: "K174/31 Võ Văn Kiệt, Sơn Trà, Đà Nẵng", J: "https://share.google/OZaB9ncAnVW8ijALJ", JLink: "https://share.google/OZaB9ncAnVW8ijALJ" },
  { row: 21, C: "Pale Blue Eyes", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1U5oDedfTCielLny0PnMpzQfshimsYhAz?usp=sharing" },
  { row: 22, C: "Green River", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/136jviLxLQlOcGXv1Y00dXETGBaXe2Lf2?usp=sharing" },
  { row: 23, C: "Blue Moon", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1lh0lRA5dLEqNnIlJsADanj0GthLQPMQf?usp=sharing" },
  { row: 24, B: "Pepper House", C: "Pepper House 3rd-floor", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/1lk7TQU8WNX5y1YfUroMX37TCmv957tI7?usp=sharing", E: "Căn hộ tầng năm Pepper House mang đến một hướng thiết kế thú vị với phong cách Industrial Retro. Không gian sống này sở hữu một cá tính mạnh mẽ bằng cách sử dụng màu sắc mát mẻ và vật liệu hoàn thiện bao gồm kết thúc bê tông mộc mạc và thép. Các tính năng nổi bật nhất có lẽ là tủ kính bọc khung sắt và ghế sofa theo phong cách đệm ngược – tiêu cự của căn phòng. Các nhà thiết kế cũng đặc biệt chú ý đến việc sử dụng hiệu quả cả ánh sáng tự nhiên và ánh sáng nhân tạo, tôn vinh tính thẩm mỹ của cả chức năng và vẻ đẹp.", I: "19 Hoàng Sa, Phường Sài Gòn, TP HCM", J: "https://share.google/EtwVNoPbiCmG7Tvbj", JLink: "https://share.google/EtwVNoPbiCmG7Tvbj" },
  { row: 25, C: "Pepper House 4th-floor", D: "Link hình ảnh", DLink: "https://drive.google.com/drive/folders/11BjCUAeropTZG4PkXjIMD3WAsEFeyqsH?usp=sharing" },
];
