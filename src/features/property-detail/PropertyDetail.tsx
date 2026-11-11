import type { ReactNode } from "react";
import { findImage, type Property, type ResolvedImage } from "@/domain/property";
import type { Photo, PhotoGroup } from "./Lightbox";
import { LocationAndPoliciesPanel } from "./LocationAndPoliciesPanel";
import { Pictogram } from "./Pictogram";
import { PropertyGallery } from "./PropertyGallery";
import styles from "./PropertyDetail.module.css";
import { PropertyRoomCollection } from "./PropertyRoomCollection";
import { RelatedProperties } from "./RelatedProperties";
import type { ContentDependency, PropertyDetailView } from "./view";

/**
 * PROPERTY DETAIL, "living-frames" layout id: the Bare Chic prototype (section 05.2), refined on
 * 20/10/2026. An exploration for review, not approved, not frozen; the 20/10 first build is kept at
 * /dev/stays/bare-chic-20-10 for comparison.
 *
 * Order: the photographs (grouped by room, a viewer for all of them), the identity and the primary
 * action, the introduction, amenities, rooms (#rooms; each with its own photographs), location,
 * and the city's VNest City Notes when the page passes them.
 * The primary action reads "Khám phá các loại phòng" while no booking provider knows the
 * property; "Xem phòng trống" only once availability can be checked. Nothing is stated that the
 * workbook does not support; in the private preview, what is still missing is noted where it
 * would go, in the review style.
 */

const ROOMS_ID = "rooms";
const LOCATION_ID = "vi-tri";

function photo(property: Property, image: ResolvedImage): Photo {
  const room = property.rooms.find((r) => r.id === image.roomTypeId)?.name ?? property.identity.name;
  return { id: image.id, ...(image.src ? { src: image.src } : {}), width: image.width, height: image.height, alt: image.alt, room };
}

/** Photographs grouped by room, in the record's order, each room's representative first. */
function photoGroups(property: Property, ids: readonly string[]): PhotoGroup[] {
  const photos = ids.flatMap((id) => {
    const image = findImage(property, id);
    return image ? [photo(property, image)] : [];
  });
  return property.rooms.map((room) => ({ room: room.name, photos: photos.filter((p) => p.room === room.name) })).filter((group) => group.photos.length > 0);
}

/** Private preview only: what VNest still has to supply for this part of the page. */
function Pending({ items, audience }: { items: readonly ContentDependency[]; audience: PropertyDetailView["audience"] }) {
  if (audience !== "private-preview" || items.length === 0) return null;
  return (
    <aside className={styles.pending} aria-label="Ghi chú xem trước: nội dung chờ VNest">
      <p className={styles.pendingTitle}>Chờ VNest (chỉ hiện trong bản xem trước)</p>
      <ul>
        {items.map((item) => (
          <li key={item.what}>
            {item.what} <span className={styles.pendingRef}>{item.questions.join(", ")}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Where the page's next step is drawn: a photo viewer (dark ground) or a room drawer (its footer). */
export type BookActionContext = { room?: string; place: "viewer" | "drawer" };

/**
 * `bookAction` (VNest V3 Stage 1, 24/10/2026, CEO R03): the page's booking action for the photo
 * viewers and room drawers (BOOK NOW in the demo). Without it the page is unchanged.
 */
export function PropertyDetail({
  property,
  view,
  cityNotes,
  bookAction,
  extraGroups,
}: {
  property: Property;
  view: PropertyDetailView;
  cityNotes?: ReactNode;
  bookAction?: (context: BookActionContext) => ReactNode;
  extraGroups?: readonly PhotoGroup[];
}) {
  const sections = property.presentation.sections;
  const gallery = sections.find((s) => s.kind === "media" && s.id === "gallery");
  const groups = photoGroups(property, gallery?.kind === "media" ? gallery.mediaIds : []);
  const roomPhotosById = Object.fromEntries(
    view.rooms.map((room) => [
      room.id,
      (property.rooms.find((r) => r.id === room.id)?.mediaIds ?? []).flatMap((id) => {
        const image = findImage(property, id);
        return image ? [photo(property, image)] : [];
      }),
    ]),
  );
  const viewerActionsByRoomId = bookAction
    ? Object.fromEntries(view.rooms.map((room) => [room.id, bookAction({ room: room.name, place: "viewer" })]))
    : undefined;
  const drawerActionsByRoomId = bookAction
    ? Object.fromEntries(view.rooms.map((room) => [room.id, bookAction({ room: room.name, place: "drawer" })]))
    : undefined;
  const amenities = property.amenities;

  return (
    <main className={styles.page} data-property={property.id}>
      <div className={styles.wrap}>
        {/* 1. Hero Gallery, Identity, and Location / Arrival / Booking Policies Panel. */}
        <section aria-labelledby="property-title" className={styles.hero}>
          {groups.length || extraGroups?.length ? (
            <PropertyGallery
              title={`Ảnh các phòng của ${property.identity.name}`}
              groups={groups}
              extraGroups={extraGroups}
              action={bookAction?.({ place: "viewer" })}
            />
          ) : null}
          <div className={styles.identity}>
            <div className={styles.identityMain}>
              <p className={styles.label}>{view.brand}</p>
              <h1 id="property-title" className={styles.title}>
                {property.identity.name}
              </h1>
              {view.location.street ? (
                <address className={styles.address}>
                  <strong>{view.location.street}</strong>
                  {view.location.rest}
                </address>
              ) : null}
              <nav aria-label={`Các phòng của ${property.identity.name}`} className={styles.index}>
                <ol>
                  {view.rooms.map((room, i) => (
                    <li key={room.id}>
                      <a href={`#${room.anchor}`}>
                        <span className={styles.indexNumber} aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={styles.indexName}>{room.name}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
            <div className={styles.identityAside}>
              {view.intro ? <p className={styles.intro}>{view.intro}</p> : null}
              {/* The full location module sits below the rooms (25/10/2026); the hero keeps a short way to it. */}
              <a href={`#${LOCATION_ID}`} className={styles.locationLink}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 17.5s-5.5-4.6-5.5-9a5.5 5.5 0 1 1 11 0c0 4.4-5.5 9-5.5 9Z" />
                  <circle cx="10" cy="8.5" r="2" />
                </svg>
                Vị trí và di chuyển
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        {/* 2. Introduction: the rest of VNest's description, word for word. No visible label. */}
        {view.story.length || view.distinctiveFeatures?.length ? (
          <section aria-label="Giới thiệu" className={`${styles.section} ${styles.story}`}>
            {view.story.map((paragraph, i) => (
              <p key={paragraph} className={i === 0 ? styles.lead : styles.storyBody}>
                {paragraph}
              </p>
            ))}
            {view.distinctiveFeatures?.length ? (
              <dl className={styles.infoList}>
                {view.distinctiveFeatures.map((feature) => (
                  <div key={feature.id}>
                    <dt>{feature.title}</dt>
                    {feature.description ? <dd>{feature.description}</dd> : null}
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        ) : null}

        {/* 3. Amenities: every supplied amenity with its pictogram, property-level. */}
        {amenities.length ? (
          <section aria-labelledby="amenities-title" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="amenities-title" className={styles.h2}>
                Tiện nghi
              </h2>
            </div>
            {/* All the supplied amenities at once (owner, 21/10/2026): the list is short enough. */}
            <ul className={styles.highlights}>
              {amenities.map((amenity) => (
                <li key={amenity.id}>
                  <Pictogram icon={amenity.icon} label={amenity.label} size={28} />
                  <span>{amenity.label}</span>
                </li>
              ))}
            </ul>
            <Pending items={view.dependencies.amenities} audience={view.audience} />
          </section>
        ) : null}

        {/* 4. Room Collection Focal Section (#rooms): Inline Photo Carousel, Verified Metadata & Inline Booking. */}
        <PropertyRoomCollection
          id={ROOMS_ID}
          property={property}
          view={view}
          roomPhotosById={roomPhotosById}
          viewerActionsByRoomId={viewerActionsByRoomId}
          drawerActionsByRoomId={drawerActionsByRoomId}
          pendingSection={<Pending items={[...view.dependencies.rooms, ...view.dependencies.photos]} audience={view.audience} />}
        />

        {/* 5. Location module: map preview, airport distance and drive time, transport, Google Maps, policies. */}
        <LocationAndPoliciesPanel
          id={LOCATION_ID}
          propertySlug={property.slug}
          propertyName={property.identity.name}
          location={view.location}
          transport={view.transport}
          policies={view.policies}
          audience={view.audience}
        />

        {/* 5b. Optional Approved Property FAQs & Local Recommendations (rendered only once approved copy is supplied). */}
        {view.localRecommendations?.length ? (
          <section aria-labelledby="local-recommendations-title" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="local-recommendations-title" className={styles.h2}>
                Gợi ý quanh {property.identity.name}
              </h2>
            </div>
            <dl className={styles.infoList}>
              {view.localRecommendations.map((item) => (
                <div key={item.id}>
                  <dt>
                    {item.name} · {item.category}
                  </dt>
                  <dd>{[item.address, item.note].filter(Boolean).join(" — ")}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {view.faqs?.length ? (
          <section aria-labelledby="property-faqs-title" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="property-faqs-title" className={styles.h2}>
                Câu hỏi thường gặp
              </h2>
            </div>
            <dl className={styles.infoList}>
              {view.faqs.map((faq) => (
                <div key={faq.id}>
                  <dt>{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* 6. VNest City Notes (approved CS-1 to CS-7), after Vị trí as specified. */}
        {cityNotes ? <div className={styles.section}>{cityNotes}</div> : null}

        {/* 7. Related Properties Before Footer. */}
        <RelatedProperties currentPropertyId={property.id} />
      </div>
    </main>
  );
}
