/**
 * PROPERTY-LEVEL GALLERY GROUPS (Owner Decision Q4 — Option 2, 29/10/2026).
 *
 * Exterior, Common Space, and approved person-free Office photographs from `/Users/noe/Documents/VNest Media`
 * are presented as separate property-level gallery groups in the full-screen Lightbox gallery modal,
 * never as individual room photographs or room-card carousel slides.
 *
 * Rules:
 * - Each group is explicitly and accurately labeled (`Mặt tiền & Lối vào (Exterior)`,
 *   `Không gian chung (Common Space)`, `Khu vực lễ tân & Văn phòng vận hành (Office — Không gian làm việc nội bộ)`).
 * - Staff/operational spaces (`Office`) are clearly labeled as internal operational workspaces so they are
 *   never implied to be private room spaces or guest amenities.
 * - Photographs with visible people (`ex 6.png`, `cs 1.png`–`cs 4.png`, `exterior 1.png`–`exterior 4.png`)
 *   are held out under Q15.
 */
import type { Photo, PhotoGroup } from "@/features/property-detail/Lightbox";
import type { PhotoLookup } from "./bare-chic/record";

type SpacePhotoSpec = {
  id: string;
  manifestKey: string;
  alt: string;
};

type SpaceGroupSpec = {
  groupLabel: string;
  photos: readonly SpacePhotoSpec[];
};

const PROPERTY_SPACE_SPECS: Readonly<Record<string, readonly SpaceGroupSpec[]>> = {
  "bare-chic": [
    {
      groupLabel: "Mặt tiền & Lối vào (Exterior)",
      photos: [
        { id: "bare-chic-ext-1", manifestKey: "bare-chic-ext-1", alt: "Bare Chic — Mặt tiền & Lối vào: sảnh tầng trệt với quầy gỗ cong, chậu cây và cửa kính mặt tiền" },
        { id: "bare-chic-ext-2", manifestKey: "bare-chic-ext-2", alt: "Bare Chic — Mặt tiền & Lối vào: góc nhìn sảnh tầng trệt từ cửa vào với quầy lễ tân gỗ và cầu thang" },
        { id: "bare-chic-ext-3", manifestKey: "bare-chic-ext-3", alt: "Bare Chic — Mặt tiền & Lối vào: cửa kính mặt tiền nhìn từ bên trong sảnh ra con hẻm yên tĩnh" },
        { id: "bare-chic-ext-4", manifestKey: "bare-chic-ext-4", alt: "Bare Chic — Mặt tiền & Lối vào: cầu thang bộ lát đá mài và tay vịn gỗ dẫn lên các tầng phòng" },
        { id: "bare-chic-ext-5", manifestKey: "bare-chic-ext-5", alt: "Bare Chic — Mặt tiền & Lối vào: góc cầu thang và mảng tường trang trí tại sảnh vào" },
        { id: "bare-chic-ext-7", manifestKey: "bare-chic-ext-7", alt: "Bare Chic — Mặt tiền & Lối vào: hành lang cầu thang với ánh sáng ấm và biển chỉ dẫn tầng" },
        { id: "bare-chic-ext-8", manifestKey: "bare-chic-ext-8", alt: "Bare Chic — Mặt tiền & Lối vào: chi tiết tay vịn cầu thang và cửa gỗ vào căn studio" },
        { id: "bare-chic-ext-9", manifestKey: "bare-chic-ext-9", alt: "Bare Chic — Mặt tiền & Lối vào: chiếu nghỉ cầu thang và cửa vào phòng với bảng tên đồng" },
        { id: "bare-chic-ext-10", manifestKey: "bare-chic-ext-10", alt: "Bare Chic — Mặt tiền & Lối vào: góc nhìn từ trên cao xuống nhịp cầu thang uốn cong" },
        { id: "bare-chic-ext-11", manifestKey: "bare-chic-ext-11", alt: "Bare Chic — Mặt tiền & Lối vào: mặt tiền toà nhà Bare Chic với ban công cây xanh và cửa kính lớn" },
        { id: "bare-chic-ext-12", manifestKey: "bare-chic-ext-12", alt: "Bare Chic — Mặt tiền & Lối vào: lối vào tầng trệt với biển hiệu Bare và mảng xanh trước cửa" },
        { id: "bare-chic-ext-13", manifestKey: "bare-chic-ext-13", alt: "Bare Chic — Mặt tiền & Lối vào: chi tiết biển hiệu Bare và cửa kính khung thép đen tại lối vào" },
        { id: "bare-chic-ext-14", manifestKey: "bare-chic-ext-14", alt: "Bare Chic — Mặt tiền & Lối vào: góc nhìn mặt tiền tầng trệt từ lối đi phía trước" },
        { id: "bare-chic-ext-15", manifestKey: "bare-chic-ext-15", alt: "Bare Chic — Mặt tiền & Lối vào: toàn cảnh mặt tiền Bare Chic nhìn từ con hẻm Nguyễn Thị Minh Khai" },
      ],
    },
    {
      groupLabel: "Khu vực lễ tân & Văn phòng vận hành (Office — Không gian làm việc nội bộ)",
      photos: [
        { id: "bare-chic-office-5", manifestKey: "bare-chic-office-5", alt: "Bare Chic — Khu vực lễ tân & Văn phòng vận hành (không gian nội bộ): quầy gỗ cong và kệ trang trí tại tầng trệt" },
        { id: "bare-chic-office-6", manifestKey: "bare-chic-office-6", alt: "Bare Chic — Khu vực lễ tân & Văn phòng vận hành (không gian nội bộ): góc bàn làm việc, ghế đôn và kệ hồ sơ" },
        { id: "bare-chic-office-7", manifestKey: "bare-chic-office-7", alt: "Bare Chic — Khu vực lễ tân & Văn phòng vận hành (không gian nội bộ): chi tiết kệ gỗ, bình gốm và ánh sáng ấm" },
        { id: "bare-chic-office-8", manifestKey: "bare-chic-office-8", alt: "Bare Chic — Khu vực lễ tân & Văn phòng vận hành (không gian nội bộ): bàn làm việc dài và ghế xoay bên cửa kính" },
        { id: "bare-chic-office-9", manifestKey: "bare-chic-office-9", alt: "Bare Chic — Khu vực lễ tân & Văn phòng vận hành (không gian nội bộ): góc nhìn tổng thể khu vực làm việc tầng trệt" },
        { id: "bare-chic-office-10", manifestKey: "bare-chic-office-10", alt: "Bare Chic — Khu vực lễ tân & Văn phòng vận hành (không gian nội bộ): chi tiết bàn gỗ và đèn bàn tại khu lễ tân" },
      ],
    },
  ],
  "bare-hyphen": [
    {
      groupLabel: "Mặt tiền & Lối vào (Exterior)",
      photos: [
        { id: "bare-hyphen-ext-a-48", manifestKey: "bare-hyphen-ext-a-48", alt: "Bare Hyphen — Mặt tiền & Lối vào: cổng vòm và lối vào tầng trệt tại 29A/18 Nguyễn Đình Chiểu" },
        { id: "bare-hyphen-ext-a-49", manifestKey: "bare-hyphen-ext-a-49", alt: "Bare Hyphen — Mặt tiền & Lối vào: chi tiết biển hiệu Bare Hyphen bên mảng tường gạch kính và cây xanh" },
        { id: "bare-hyphen-ext-a-50", manifestKey: "bare-hyphen-ext-a-50", alt: "Bare Hyphen — Mặt tiền & Lối vào: mặt tiền tầng trệt với cửa gỗ, gạch kính và hàng cây nhiệt đới" },
        { id: "bare-hyphen-ext-a-51", manifestKey: "bare-hyphen-ext-a-51", alt: "Bare Hyphen — Mặt tiền & Lối vào: góc nhìn mặt tiền toà nhà với ban công và khung cửa sổ lớn" },
        { id: "bare-hyphen-ext-a-52", manifestKey: "bare-hyphen-ext-a-52", alt: "Bare Hyphen — Mặt tiền & Lối vào: lối đi lát đá và cửa vòm dẫn vào khu vực sảnh chung" },
        { id: "bare-hyphen-ext-a-53", manifestKey: "bare-hyphen-ext-a-53", alt: "Bare Hyphen — Mặt tiền & Lối vào: chi tiết kiến trúc mặt tiền đan xen gạch kính và mảng xanh" },
        { id: "bare-hyphen-ext-a-54", manifestKey: "bare-hyphen-ext-a-54", alt: "Bare Hyphen — Mặt tiền & Lối vào: toàn cảnh mặt tiền Bare Hyphen trong hẻm yên tĩnh" },
      ],
    },
    {
      groupLabel: "Không gian chung (Common Space)",
      photos: [
        { id: "bare-hyphen-cs-a-37", manifestKey: "bare-hyphen-cs-a-37", alt: "Bare Hyphen — Không gian chung: sảnh tầng trệt với ghế chờ, mảng tường gạch kính và cây xanh" },
        { id: "bare-hyphen-cs-a-38", manifestKey: "bare-hyphen-cs-a-38", alt: "Bare Hyphen — Không gian chung: góc ngồi thư giãn tại sảnh chung với bàn trà và ánh sáng tự nhiên" },
        { id: "bare-hyphen-cs-a-39", manifestKey: "bare-hyphen-cs-a-39", alt: "Bare Hyphen — Không gian chung: hành lang và cầu thang đá mài kết nối các tầng căn hộ" },
        { id: "bare-hyphen-cs-a-40", manifestKey: "bare-hyphen-cs-a-40", alt: "Bare Hyphen — Không gian chung: chi tiết vòm cong và tay vịn cầu thang tại khu vực chung" },
        { id: "bare-hyphen-cs-a-41", manifestKey: "bare-hyphen-cs-a-41", alt: "Bare Hyphen — Không gian chung: góc nhìn cầu thang bộ với gạch kính lấy sáng tự nhiên" },
        { id: "bare-hyphen-cs-a-42", manifestKey: "bare-hyphen-cs-a-42", alt: "Bare Hyphen — Không gian chung: chiếu nghỉ cầu thang và lối dẫn vào các căn studio" },
        { id: "bare-hyphen-cs-a-43", manifestKey: "bare-hyphen-cs-a-43", alt: "Bare Hyphen — Không gian chung: mảng tường trang trí và cây xanh tại hành lang các tầng" },
        { id: "bare-hyphen-cs-a-44", manifestKey: "bare-hyphen-cs-a-44", alt: "Bare Hyphen — Không gian chung: góc nhìn từ trên cao xuống giếng trời và cầu thang đá mài" },
        { id: "bare-hyphen-cs-a-45", manifestKey: "bare-hyphen-cs-a-45", alt: "Bare Hyphen — Không gian chung: cửa gỗ tròn dẫn vào phòng từ hành lang chung" },
        { id: "bare-hyphen-cs-a-46", manifestKey: "bare-hyphen-cs-a-46", alt: "Bare Hyphen — Không gian chung: khu vực sảnh đón khách với nội thất gỗ và đá mài" },
        { id: "bare-hyphen-cs-a-47", manifestKey: "bare-hyphen-cs-a-47", alt: "Bare Hyphen — Không gian chung: chi tiết vật liệu đá mài, gỗ và ánh sáng ấm tại hành lang" },
        { id: "bare-hyphen-cs-a-76", manifestKey: "bare-hyphen-cs-a-76", alt: "Bare Hyphen — Không gian chung: góc tiện ích chung và kệ trang trí tại tầng trệt" },
        { id: "bare-hyphen-cs-a-77", manifestKey: "bare-hyphen-cs-a-77", alt: "Bare Hyphen — Không gian chung: lối đi nội bộ ngập ánh sáng qua ô gạch kính" },
        { id: "bare-hyphen-cs-a-78", manifestKey: "bare-hyphen-cs-a-78", alt: "Bare Hyphen — Không gian chung: chi tiết bảng chỉ dẫn và góc xanh tại sảnh chung" },
        { id: "bare-hyphen-cs-a-79", manifestKey: "bare-hyphen-cs-a-79", alt: "Bare Hyphen — Không gian chung: toàn cảnh khu vực sảnh và lối lên cầu thang Bare Hyphen" },
      ],
    },
  ],
  "bare-da-kao": [
    {
      groupLabel: "Mặt tiền & Lối vào (Exterior)",
      photos: [
        { id: "bare-da-kao-ext-5", manifestKey: "bare-da-kao-ext-5", alt: "Bare Đa Kao — Mặt tiền & Lối vào: toàn cảnh kiến trúc mặt tiền mang cảm hứng Sài Gòn thập niên 1950–1970" },
        { id: "bare-da-kao-ext-6", manifestKey: "bare-da-kao-ext-6", alt: "Bare Đa Kao — Mặt tiền & Lối vào: góc nhìn mặt tiền toà nhà với các khung cửa sổ và ban công cây xanh" },
        { id: "bare-da-kao-ext-8", manifestKey: "bare-da-kao-ext-8", alt: "Bare Đa Kao — Mặt tiền & Lối vào: cổng vào và biển hiệu Bare Đa Kao tại 14/3 Nguyễn Đình Chiểu" },
        { id: "bare-da-kao-ext-9", manifestKey: "bare-da-kao-ext-9", alt: "Bare Đa Kao — Mặt tiền & Lối vào: chi tiết biển hiệu Bare Đa Kao bên mảng tường sáng và cây xanh" },
        { id: "bare-da-kao-ext-10", manifestKey: "bare-da-kao-ext-10", alt: "Bare Đa Kao — Mặt tiền & Lối vào: lối đi dẫn vào sảnh tầng trệt với hàng trúc xanh mát" },
        { id: "bare-da-kao-ext-11", manifestKey: "bare-da-kao-ext-11", alt: "Bare Đa Kao — Mặt tiền & Lối vào: cửa chính và khoảng sân nhỏ phía trước toà nhà" },
        { id: "bare-da-kao-ext-12", manifestKey: "bare-da-kao-ext-12", alt: "Bare Đa Kao — Mặt tiền & Lối vào: góc nhìn từ lối vào hướng ra cổng và hàng cây xanh" },
        { id: "bare-da-kao-ext-13", manifestKey: "bare-da-kao-ext-13", alt: "Bare Đa Kao — Mặt tiền & Lối vào: chi tiết kiến trúc lam gió và mảng xanh mặt tiền Bare Đa Kao" },
      ],
    },
    {
      groupLabel: "Không gian chung (Common Space)",
      photos: [
        { id: "bare-da-kao-cs-1", manifestKey: "bare-da-kao-cs-1", alt: "Bare Đa Kao — Không gian chung: sảnh tầng trệt và lối đi chung với ánh sáng tự nhiên" },
        { id: "bare-da-kao-cs-2", manifestKey: "bare-da-kao-cs-2", alt: "Bare Đa Kao — Không gian chung: cầu thang bộ với tay vịn gỗ và gạch bông cổ điển Sài Gòn" },
        { id: "bare-da-kao-cs-3", manifestKey: "bare-da-kao-cs-3", alt: "Bare Đa Kao — Không gian chung: hành lang kết nối các căn studio và ô gạch kính lấy sáng" },
        { id: "bare-da-kao-cs-4", manifestKey: "bare-da-kao-cs-4", alt: "Bare Đa Kao — Không gian chung: chiếu nghỉ cầu thang với tranh treo tường và đèn ấm" },
        { id: "bare-da-kao-cs-5", manifestKey: "bare-da-kao-cs-5", alt: "Bare Đa Kao — Không gian chung: góc nhìn cầu thang và cửa gỗ vào căn hộ tại các tầng" },
        { id: "bare-da-kao-cs-6", manifestKey: "bare-da-kao-cs-6", alt: "Bare Đa Kao — Không gian chung: chi tiết hành lang, biển số phòng và ánh sáng dịu tại khu vực chung" },
      ],
    },
  ],
};

/**
 * Resolves property-level gallery groups (`Exterior`, `Common Space`, `Office`) for a property's
 * full Lightbox gallery modal, including only photographs currently present on disk.
 */
export function resolvePropertySpaceGroups(propertyId: string, photo: PhotoLookup): PhotoGroup[] {
  const specs = PROPERTY_SPACE_SPECS[propertyId] ?? [];
  return specs
    .map((group): PhotoGroup => {
      const resolved: Photo[] = group.photos.flatMap((spec) => {
        const file = photo(spec.manifestKey);
        if (!file) return [];
        return [
          {
            id: spec.id,
            src: file.src,
            width: file.width,
            height: file.height,
            alt: spec.alt,
            room: group.groupLabel,
          },
        ];
      });
      return { room: group.groupLabel, photos: resolved };
    })
    .filter((g) => g.photos.length > 0);
}
