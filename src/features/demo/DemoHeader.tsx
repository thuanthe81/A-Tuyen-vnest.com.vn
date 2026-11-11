import Link from "next/link";
import styles from "./Demo.module.css";

/**
 * CEO DEMO (23/10/2026): the one navigation of the private, local presentation flow
 * (/dev/demo → Bare Chic). The VNest mark always returns to the demo's start, in the same tab.
 * Not the site header (section 03.1 is unbuilt); a minimal bar so the flow reads as one website.
 */
import { DEMO_HOME } from "./links";

export { DEMO_BARE_CHIC, DEMO_HOME } from "./links";

export function DemoHeader({ back }: { back?: { href: string; label: string } }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link href={DEMO_HOME} className={styles.brand} aria-label="VNest, về trang chủ">
          {/* eslint-disable-next-line @next/next/no-img-element -- 7 KB vector, VNest's own artwork */}
          <img src="/dev-fixtures/brand-collection/vnest-symbol.svg" alt="" width={28} height={28} />
          {/* eslint-disable-next-line @next/next/no-img-element -- 4 KB vector, VNest's own artwork */}
          <img src="/dev-fixtures/brand-collection/vnest-wordmark.svg" alt="" width={80} height={19} />
        </Link>
        {back ? (
          <Link href={back.href} className={styles.back}>
            <span aria-hidden="true">←</span> {back.label}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
