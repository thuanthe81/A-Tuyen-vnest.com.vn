import Link from "next/link";
import { notFound } from "next/navigation";
import { env } from "@/config/env";
import { site } from "@/config/site";
import { readClientProperties } from "@/content/vnest-workbook/records";
import { nightsBetween } from "@/domain/dates";
import { hasDates, validateCriteria } from "@/domain/search";
import { issueMessage, searchCopy } from "@/features/booking-search/copy";
import { formatDayLong } from "@/features/booking-search/format";
import { demoBookingOptions } from "@/features/demo/booking-options";
import {
  DEMO_BOOKING_RESULTS,
  demoPropertyUrl,
  demoPropertyUrlFromMultiRoom,
  stayFromQuery,
} from "@/features/demo/booking-flow";
import { buildBookingResultsCatalog } from "@/features/demo/booking-results-data";
import {
  buildRoomMetaMap,
  parseMultiRoomQuery,
  serializeMultiRoomQuery,
} from "@/features/demo/booking-results-state";
import { DemoPropertyShell } from "@/features/demo/DemoPropertyShell";
import styles from "@/features/demo/Demo.module.css";
import { DEMO_LINKS } from "@/features/demo/links";
import { ContactPlaceholders } from "@/features/demo/SiteHeader";
import { reviewAccess } from "@/features/property-detail/review-access";
import { todayInTimeZone } from "@/lib/today";
import { HANDOFF_CTA_LABEL, usesExternalHandoff } from "@/domain/hybrid-booking/booking-mode";
import { resolveHandoffAction } from "@/domain/hybrid-booking/ezcloud-handoff";
import { CHILD_POLICY_NOTE, parseChildren } from "@/domain/hybrid-booking/guest-party";
import { buildMetadata } from "@/seo/metadata";
import { clientCollection } from "../../brand-collection/client/adapter";

/**
 * THE DEMO BOOKING STEP (VNest V3 Stage 1, 24/10/2026; CEO R02, R03, R14), where BOOK NOW leads.
 *
 * No booking provider is connected. This page repeats the stay the guest chose (property, room when
 * BOOK NOW came from one, dates, nights, guests) and says plainly that nothing has been sent, held,
 * priced or confirmed. The next steps are only ones that exist: the property's rooms when the demo
 * has its page, the collection, and the booking bar above to change the stay. Direct-booking
 * contacts are not supplied (Q7), so they appear as labelled placeholders without links.
 * Private, local, never indexed; same access rule as the other demo pages.
 */
export const dynamic = "force-dynamic";

export const metadata = buildMetadata({ title: "BOOK NOW · bản trình diễn", path: () => "/dev/demo/dat-phong", noindex: true });

const ACCESS = reviewAccess(env);

export default async function DemoBookingStep({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!ACCESS.route) notFound();
  const query = await searchParams;
  const options = demoBookingOptions(clientCollection(readClientProperties()));
  const stay = stayFromQuery(query);
  const property = options.find((option) => option.slug === stay.filters.property);
  // A short, plain room name (set by BOOK NOW in a room's viewer or drawer) is repeated; anything else is ignored.
  const room = property && typeof query.room === "string" && query.room.length <= 60 && /^[\p{L}\p{N} .'-]+$/u.test(query.room) ? query.room : undefined;
  const { criteria } = stay;
  // Children travel apart from the adults (guest-party.ts); no child policy is confirmed, so they are listed and flagged.
  const children = parseChildren(query.children);
  // A property that books on the provider's page has no selection to review here: this step is its hand-off state.
  const handoff = property ? usesExternalHandoff(property.slug) : false;
  const handoffAction =
    property && handoff && hasDates(criteria)
      ? resolveHandoffAction(property.slug, { checkIn: criteria.checkIn, checkOut: criteria.checkOut, roomAdults: [criteria.adults], ...(children ? { children } : {}) })
      : null;
  const today = todayInTimeZone(site.timeZone);
  const issues = hasDates(criteria) ? validateCriteria(criteria, today ? { today } : {}) : [];
  const complete = hasDates(criteria) && issues.length === 0;

  const catalog = buildBookingResultsCatalog();
  const validSlugs = catalog.map((p) => p.id);
  const validRoomIds = new Set(catalog.flatMap((p) => p.rooms.map((r) => r.id)));
  const roomMetaById = buildRoomMetaMap(catalog);
  const roomNamesById = new Map(catalog.flatMap((p) => p.rooms.map((r) => [r.id, `${r.name} (${p.name})`] as const)));

  const hasMultiRoomParams = ["rooms", "prefs", "checkIn", "checkOut", "property", "adults"].some((k) => query[k] !== undefined);
  const multiRoomState = hasMultiRoomParams
    ? parseMultiRoomQuery(query, validSlugs, validRoomIds, roomMetaById)
    : undefined;

  const resultsUrl = multiRoomState
    ? `${DEMO_BOOKING_RESULTS}?${serializeMultiRoomQuery(multiRoomState)}`
    : DEMO_BOOKING_RESULTS;

  const roomsUrl =
    property?.slug && multiRoomState
      ? demoPropertyUrlFromMultiRoom(property.slug, multiRoomState, "rooms")
      : demoPropertyUrl(property?.slug, criteria, "rooms");

  return (
    <DemoPropertyShell initial={stay} options={options}>
      <main className={styles.step} aria-labelledby="step-title">
        <p className={styles.kicker}>
          <span lang="en">BOOK NOW</span> · Bản trình diễn
        </p>
        <h1 id="step-title" className={styles.stepTitle}>
          {handoff ? HANDOFF_CTA_LABEL : complete ? "Kỳ lưu trú bạn đã chọn" : "Chọn ngày lưu trú"}
        </h1>

        {complete && hasDates(criteria) ? (
          <dl className={styles.stepSummary}>
            <div>
              <dt>Nơi lưu trú</dt>
              <dd>{property ? `${property.name} · ${property.area}` : searchCopy.allProperties}</dd>
            </div>
            {room ? (
              <div>
                <dt>Phòng bạn đang xem</dt>
                <dd>{room}</dd>
              </div>
            ) : null}
            <div>
              <dt>{searchCopy.checkIn}</dt>
              <dd>{formatDayLong(criteria.checkIn)}</dd>
            </div>
            <div>
              <dt>{searchCopy.checkOut}</dt>
              <dd>{formatDayLong(criteria.checkOut)}</dd>
            </div>
            <div>
              <dt>Thời gian</dt>
              <dd>{searchCopy.nights(nightsBetween(criteria.checkIn, criteria.checkOut))}</dd>
            </div>
            <div>
              <dt>{searchCopy.guests}</dt>
              <dd>
                {multiRoomState && multiRoomState.roomGroups.length > 1
                  ? `${multiRoomState.roomGroups.length} phòng · ${searchCopy.guestCount(criteria.adults)}`
                  : searchCopy.guestCount(criteria.adults)}
              </dd>
            </div>
            {children ? (
              <div data-testid="step-children">
                <dt>Trẻ em</dt>
                <dd>
                  {children} trẻ em (chưa phân vào phòng). {CHILD_POLICY_NOTE}
                </dd>
              </div>
            ) : null}
            {!handoff && multiRoomState && (multiRoomState.roomGroups.length > 1 || multiRoomState.roomGroups.some((g) => g.preferredRoomId !== null)) ? (
              <div>
                <dt>Phân bổ &amp; phòng dự kiến</dt>
                <dd>
                  {multiRoomState.roomGroups
                    .map((g) => {
                      const roomLabel = g.preferredRoomId ? roomNamesById.get(g.preferredRoomId) ?? g.preferredRoomId : "Chưa chọn phòng dự kiến";
                      return `Phòng ${g.slotIndex} (${g.adults} người lớn): ${roomLabel}`;
                    })
                    .join(" · ")}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className={styles.stepLead}>
            {issues.length ? issues.map((issue) => issueMessage(issue)).join(" ") : "Hãy chọn ngày nhận phòng và trả phòng ở thanh đặt phòng phía trên."}
          </p>
        )}

        {handoff ? (
          <p className={styles.stepNotice} role="note" data-testid="handoff-unconfigured">
            <strong>{HANDOFF_CTA_LABEL}</strong> {handoffAction?.kind === "external"
              ? "diễn ra trên trang đặt phòng của cơ sở, nơi hiển thị giá và tình trạng phòng."
              : "chưa được kết nối trong bản xem trước. VNest chưa gửi yêu cầu nào, chưa giữ phòng nào và chưa hiển thị giá hay tình trạng phòng."}
          </p>
        ) : (
          <p className={styles.stepNotice} role="note">
            <strong>Đặt phòng trực tuyến chưa được kết nối.</strong> Đây là bước trình diễn: VNest chưa nhận yêu cầu nào, chưa có phòng nào được giữ và chưa có
            khoản thanh toán nào. Phòng trống và giá theo ngày sẽ chỉ hiện khi hệ thống đặt phòng của VNest được kết nối.
          </p>
        )}

        <div className={styles.stepActions}>
          {handoffAction?.kind === "external" ? (
            <a href={handoffAction.href} className={styles.cta} rel="noopener noreferrer">
              {HANDOFF_CTA_LABEL}
            </a>
          ) : null}
          <Link href={resultsUrl} className={handoffAction?.kind === "external" ? styles.stepSecondary : styles.cta}>
            {handoff ? "← Quay lại kết quả" : "← Quay lại trang kết quả & chọn phòng dự kiến"}
          </Link>
          {roomsUrl ? (
            <Link href={roomsUrl} className={styles.stepSecondary}>
              Xem các loại phòng tại {property!.name}
            </Link>
          ) : null}
          <Link href={DEMO_LINKS.discover} className={styles.stepSecondary}>
            {property && !roomsUrl ? `Khám phá nơi lưu trú (trang ${property.name} chưa có trong bản trình diễn)` : "Khám phá nơi lưu trú khác"}
          </Link>
        </div>
        <p className={styles.stepHint}>Muốn đổi ngày, số khách hoặc nơi lưu trú? Dùng thanh đặt phòng ở đầu trang hoặc quay lại trang kết quả tìm phòng.</p>

        <section className={styles.stepContact} aria-labelledby="step-contact">
          <h2 id="step-contact" className={styles.stepH2}>
            Đặt phòng trực tiếp với VNest
          </h2>
          <p>Kênh đặt phòng trực tiếp (điện thoại, email) đang được VNest cập nhật.</p>
          <ContactPlaceholders />
        </section>
      </main>
    </DemoPropertyShell>
  );
}
