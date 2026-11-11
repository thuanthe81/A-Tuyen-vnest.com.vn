import styles from "../shared.module.css";
import { priceText, type PricePresentation } from "@/content/vnest-workbook/pricing";

/**
 * The price block of a property card. Its wording comes from the presentation state alone
 * (pricing.ts), so a card can never show a number with attributes nobody confirmed.
 */
export function PriceArea({ price }: { price: PricePresentation }) {
  const { label, amount, note } = priceText(price);
  return (
    <div className={styles.price} data-kind={price.kind}>
      {label && <p className={styles.priceLabel}>{label}</p>}
      {amount && <p className={styles.priceAmount}>{amount}</p>}
      {note && <p className={styles.priceNote}>{note}</p>}
    </div>
  );
}
