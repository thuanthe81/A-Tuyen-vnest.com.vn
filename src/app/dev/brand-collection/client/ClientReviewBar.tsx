import { WORKBOOK } from "@/content/vnest-workbook/workbook";
import type { PriceAudience } from "@/content/vnest-workbook/pricing";
import styles from "../shared.module.css";

/**
 * The review line of the client-content preview: what is real, what is still a placeholder, and
 * what the prices are. `audience` "public" shows what a public build would show (no workbook figure).
 */
export function ClientReviewBar({ audience, simulated }: { audience: PriceAudience; /** Public view requested by ?price=public. */ simulated: boolean }) {
  return (
    <div className={styles.review}>
      <p>
        <strong>Khảo sát B · dữ liệu VNest · chưa duyệt.</strong> Tên, thương hiệu và thành phố lấy từ {WORKBOOK.file} (nhận {WORKBOOK.received.slice(8, 10)}/{WORKBOOK.received.slice(5, 7)}). Logo ba thương hiệu là ô chờ; mọi ảnh là ảnh giữ chỗ cho đến khi quyền sử dụng được xác nhận. Bộ lọc khu vực được ẩn.{" "}
        {audience === "private-preview"
          ? "Giá trên thẻ là số liệu thử nghiệm từ bảng VNest (mức ngày thường thấp nhất): chưa xác minh, chưa rõ tiền tệ, thuế, đơn vị tính và thời hạn; không phải giá đặt phòng và chưa được phép công bố."
          : "Giá chưa được duyệt để công bố, nên thẻ không hiện con số."}
      </p>
      <p className={styles.reviewLinks}>
        {simulated ? <a href="/dev/brand-collection/b-client">Trở lại bản xem trước riêng</a> : audience === "private-preview" && <a href="/dev/brand-collection/b-client?price=public">Xem như bản công khai</a>}
        <a href="/dev/brand-collection/b">Xem bản dữ liệu mẫu</a>
      </p>
    </div>
  );
}
