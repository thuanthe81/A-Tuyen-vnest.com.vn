import Image from "next/image";
import { resultsCopy } from "@/features/availability/copy";
import { findImage, type Property, type ResolvedImage } from "@/domain/property";
import { BookingPill } from "./BookingPill";
import { Photographs, type Photograph } from "./Photographs";
import styles from "./PropertyDetail.module.css";
import type { PropertyDetailView, RoomView } from "./view";

/**
 * FROZEN COPY for comparison (route /dev/stays/bare-chic-20-10). Do not develop further.
 *
 * PROPERTY DETAIL, "living-frames" layout id: the Bare Chic prototype (section 05.2, 20/10/2026).
 * An exploration for review, not approved, not frozen. It does not claim the Living Frames
 * direction: the layout id is the one registered at checkpoint 1.
 *
 * Order: hero (identity, the opening photograph, "Xem phòng trống"), the story, the photographs,
 * amenities, rooms (#rooms), location. Every photograph names its room. No policies and no nearby
 * places: neither has content VNest has confirmed for this property. Rooms carry the workbook's
 * reference figures only where a room's own cell states them, and only in the private preview.
 * Booking is not connected for this property, and the page says so; nothing simulates it.
 */

const CTA = "Xem phòng trống";
const ROOMS_ID = "rooms";
const HERO_ACTION_ID = "hero-action";

function roomOf(property: Property, image: ResolvedImage | undefined): string {
  return property.rooms.find((room) => room.id === image?.roomTypeId)?.name ?? property.identity.name;
}

function photograph(property: Property, image: ResolvedImage): Photograph {
  return { id: image.id, ...(image.src ? { src: image.src } : {}), width: image.width, height: image.height, alt: image.alt, room: roomOf(property, image) };
}

function Down() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M10 3.5v12M4.5 10.5 10 16l5.5-5.5" />
    </svg>
  );
}

/** A plain link to a place on this page: it keeps the stay in the address and works before any script. */
function RoomsLink({ id }: { id?: string }) {
  return (
    <a href={`#${ROOMS_ID}`} id={id} className={styles.cta}>
      {CTA}
      <Down />
    </a>
  );
}

function Picture({ image, room, sizes, className, priority = false }: { image: ResolvedImage | undefined; room: string; sizes: string; className: string | undefined; priority?: boolean }) {
  if (!image) return null;
  return image.src ? (
    <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes={sizes} priority={priority} {...(priority ? {} : { loading: "lazy" as const })} className={className} />
  ) : (
    <div className={`${className} ${styles.thumbPlaceholder}`} role="img" aria-label={image.alt}>
      Ảnh giữ chỗ (bản phát triển) · {room}
    </div>
  );
}

function RoomPrice({ room }: { room: RoomView }) {
  if (room.price.kind === "pending") {
    return (
      <p className={styles.price}>
        <em className={styles.pending}>Giá đang cập nhật</em>
      </p>
    );
  }
  // The workbook's own labels and figures, exactly: no currency, unit or tax is added (Q8).
  return (
    <div className={styles.price}>
      <p>Giá tham khảo</p>
      <dl className={styles.priceRows}>
        <dt>Ngày thường</dt>
        <dd>{room.price.weekday}</dd>
        <dt>Ngày cuối tuần</dt>
        <dd>{room.price.weekend}</dd>
      </dl>
    </div>
  );
}

export function PropertyDetail({ property, view }: { property: Property; view: PropertyDetailView }) {
  const sections = property.presentation.sections;
  const opening = sections.find((s) => s.kind === "media" && s.id === "opening-frames");
  const hero = opening?.kind === "media" ? findImage(property, opening.mediaIds[0]!) : undefined;
  const story = sections.find((s) => s.kind === "narrative" && s.id === "story");
  const storyImage = story?.kind === "narrative" && story.mediaIds?.[0] ? findImage(property, story.mediaIds[0]) : undefined;
  const photoSection = sections.find((s) => s.kind === "media" && s.id === "photographs");
  const photos = (photoSection?.kind === "media" ? photoSection.mediaIds : []).flatMap((id) => {
    const image = findImage(property, id);
    return image ? [photograph(property, image)] : [];
  });
  // Pinned on 20/10 when the record gained more photographs per room: this copy keeps the
  // thumbnails it was delivered with, so the comparison stays faithful.
  const PINNED: Readonly<Record<string, string>> = { "bare-chic-one": "bare-chic-one-1-55", "bare-chic-two": "bare-chic-two-2-3", "bare-chic-three": "bare-chic-three-1-29", "bare-indochine": "bare-indochine-53" };
  const roomImage = (roomId: string) => {
    const mediaId = PINNED[roomId] ?? property.rooms.find((room) => room.id === roomId)?.mediaIds[0];
    return mediaId ? findImage(property, mediaId) : undefined;
  };
  const [lead, ...body] = view.story;

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        {/* 1. Hero: the photograph first, then who this is and where, then the way to the rooms. */}
        <section aria-labelledby="property-title" className={styles.hero}>
          <figure className={styles.heroFrame}>
            <Picture image={hero} room={roomOf(property, hero)} sizes="(min-width: 80rem) 820px, (min-width: 64rem) 66vw, (min-width: 48rem) 58vw, 100vw" priority className={styles.heroImage} />
            <figcaption className={styles.caption}>{roomOf(property, hero)}</figcaption>
          </figure>
          <div className={styles.identity}>
            <nav aria-label="Các phòng của Bare Chic" className={styles.index}>
              <p className={styles.label}>{view.rooms.length} phòng</p>
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
            <div>
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
              <div className={styles.heroActions}>
                <RoomsLink id={HERO_ACTION_ID} />
              </div>
            </div>
          </div>
        </section>

        {/* 2. The story: VNest's description, every word as supplied, set in two paragraphs. */}
        {story?.kind === "narrative" && lead ? (
          <section aria-labelledby="story-title" className={`${styles.section} ${styles.story}`}>
            <div className={styles.sectionHead}>
              <h2 id="story-title" className={styles.h2}>
                {story.heading ?? "Về Bare Chic"}
              </h2>
            </div>
            <p className={styles.lead}>{lead}</p>
            {storyImage ? (
              <figure className={styles.storyFigure}>
                <Picture image={storyImage} room={roomOf(property, storyImage)} sizes="(min-width: 80rem) 420px, (min-width: 48rem) 40vw, 100vw" className={styles.storyImage} />
                <figcaption className={styles.caption}>{roomOf(property, storyImage)}</figcaption>
              </figure>
            ) : null}
            <div className={styles.storyBody}>
              {body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}

        {/* 3. Photographs: every one a room, and captioned with it. */}
        {photos.length ? (
          <section aria-labelledby="photos-title" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="photos-title" className={styles.h2}>
                Hình ảnh
              </h2>
              <p className={styles.headNote}>{photos.length} ảnh</p>
            </div>
            <Photographs photos={photos} />
          </section>
        ) : null}

        {/* 4. Amenities: the list as supplied, no icons (an icon is VNest's choice). */}
        {view.amenities.items.length ? (
          <section aria-labelledby="amenities-title" className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 id="amenities-title" className={styles.h2}>
                Tiện nghi
              </h2>
            </div>
            <ul className={styles.amenityList}>
              {view.amenities.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {view.amenities.incomplete ? <p className={styles.amenityNote}>VNest đang hoàn thiện danh sách tiện nghi.</p> : null}
          </section>
        ) : null}

        {/* 5. Rooms: where every "Xem phòng trống" leads. */}
        <section id={ROOMS_ID} aria-labelledby="rooms-title" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 id="rooms-title" className={styles.h2}>
              Các phòng
            </h2>
            <p className={styles.headNote}>{view.rooms.length} phòng</p>
          </div>
          {!view.bookingConnected ? (
            <p className={styles.status}>
              <span>
                <strong>{resultsCopy.notConnectedHeading}.</strong> Chưa có hệ thống đặt phòng nào được kết nối.
              </span>
            </p>
          ) : null}
          <ul className={styles.roomList}>
            {view.rooms.map((room) => (
              <li key={room.id} id={room.anchor} className={styles.room}>
                <Picture image={roomImage(room.id)} room={room.name} sizes="(min-width: 80rem) 600px, (min-width: 48rem) 50vw, 7rem" className={styles.roomImage} />
                <div className={styles.roomText}>
                  <h3 className={styles.roomName}>{room.name}</h3>
                  <RoomPrice room={room} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Location: the address as supplied, and the map link only because it is verified. */}
        <section aria-labelledby="location-title" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 id="location-title" className={styles.h2}>
              Vị trí
            </h2>
          </div>
          <div className={styles.place}>
            <address className={styles.placeAddress}>
              {view.location.street ? <p className={styles.street}>{view.location.street}</p> : null}
              {view.location.rest ? <p className={styles.ward}>{view.location.rest}</p> : null}
              {view.location.note ? <p className={styles.amenityNote}>{view.location.note}</p> : null}
              {view.location.mapUrl ? (
                <a href={view.location.mapUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                  Xem bản đồ<span className="sr-only"> {property.identity.name} trên Google Maps (mở thẻ mới)</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </address>
            {view.transport ? (
              <dl className={styles.facts}>
                <dt>Di chuyển</dt>
                <dd>{view.transport}</dd>
              </dl>
            ) : null}
          </div>
        </section>
      </div>

      <BookingPill heroActionId={HERO_ACTION_ID} roomsId={ROOMS_ID}>
        <RoomsLink />
      </BookingPill>
    </main>
  );
}
