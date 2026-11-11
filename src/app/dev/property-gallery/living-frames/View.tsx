import { Suspense } from "react";
import { env } from "@/config/env";
import { PropertySearchBar } from "@/features/property-page/PropertySearchBar";
import { Pictogram } from "../b/icons";
import { loadPropertyOptions } from "../../booking-search/properties";
import { AMENITY_PREVIEW, COPY, FRAMES_LF, NEARBY_PREVIEW, pad, PROPERTY, SHOTS_LF, SHOWCASE_CLIP, SHOWCASE_LF, SHOWCASE_PREVIEW, type Frame } from "../content";
import { DeferredPicture } from "../DeferredPicture";
import { CtaPill } from "./CtaPill";
import { displayLF } from "./font";
import { FrameButton, GalleryProvider } from "./Gallery";
import styles from "./lf.module.css";
import { FRAMES_STOCK, SHOTS_STOCK, SHOWCASE_STOCK, STOCK_CLIP, STOCK_COPY, STOCK_PREVIEW, type Geometry } from "./media";
import { Sheet } from "./Sheet";
import { stockMediaAvailable } from "./stock-available";
import { RoomsLink, StayLine } from "./Stay";
import { VariantSwitch } from "./VariantSwitch";

/**
 * LIVING FRAMES, "Motion Contact Sheet", second pass (12/10/2026). A design exploration, not
 * the property page; the art direction it follows is in docs/design/living-frames. Nothing
 * here is approved.
 *
 * Five frames tell the property: the one that moves, two beside it, and one at the head of
 * each section that follows. The page ends by handing the guest to the existing room
 * selection with their stay intact.
 *
 * EVERY PICTURE IS A DRAWING and the clip is made from three of them: it shows where motion
 * goes and how it behaves, not what VNest footage will look like. The page says so once, in a
 * slim line at the top, and each picture carries a small mark; development navigation lives
 * on /dev/property-gallery, not here.
 *
 * That is the page at /dev/property-gallery/living-frames, and `media` "drawn". With `media`
 * "stock" (the media reality check, 13/10/2026, at .../media-a and .../media-b) the first
 * screen's three pictures are third-party reference material instead: see ./media.ts. The
 * layout, the type, the booking action and everything below the first screen are the same
 * components either way.
 */

/**
 * The criteria bar's place until it has read the address in the browser: the same row with
 * the site's mark and an empty field, so the top of the page is never a blank band.
 */
function BarPlaceholder() {
  return (
    <>
      <div aria-hidden="true" className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-site items-center gap-4 px-(--vn-gutter)">
          <span className="flex h-11 shrink-0 items-center text-lg font-semibold tracking-tight text-ink">VNest</span>
          <div className="flex min-w-0 flex-1 justify-center">
            <span className="h-[3.125rem] w-full max-w-[40rem] rounded-(--bk-r-shell) border border-line bg-capsule" />
          </div>
          <span className="invisible hidden shrink-0 text-lg font-semibold tracking-tight lg:block">VNest</span>
        </div>
      </div>
      <div aria-hidden="true" className="h-[3.25rem]" />
    </>
  );
}

/** A section that opens with its own frame: the picture says what the section is about before the words do. */
function Chapter({ id, frame, index, title, purpose, flip = false, children }: { id: string; frame: Frame; index: number; title: string; purpose: string; flip?: boolean; children: React.ReactNode }) {
  return (
    <section className={`${styles.chapter} ${flip ? styles.flip : ""}`} aria-labelledby={id}>
      <figure className={styles.chapterFrame}>
        <FrameButton index={index} title={frame.title} className={styles.frame}>
          <DeferredPicture concept="c" shot={frame} orientation={frame.orientation} sizes="(min-width: 48rem) 56vw, 100vw" className={styles.deferred} />
        </FrameButton>
        <figcaption className={styles.cap}>
          <b>{pad(index + 1)}</b>
          <span>{frame.side}</span>
        </figcaption>
      </figure>
      <div className={styles.chapterBody}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        <p className={styles.purpose}>{purpose}</p>
        {children}
        <p className={styles.sample}>Nội dung mẫu</p>
      </div>
    </section>
  );
}

export async function LivingFramesView({ media = "drawn", geometry = "a" }: { media?: "drawn" | "stock"; geometry?: Geometry }) {
  const options = await loadPropertyOptions();
  const slug = options[0]?.slug;
  // Stock media is never in Git: on a machine without it, fall back to the drawings (same geometry) and say so.
  const missing = media === "stock" && !stockMediaAvailable();
  const stock = media === "stock" && !missing;
  const showcase = stock ? SHOWCASE_STOCK : SHOWCASE_LF;
  const frames = stock ? FRAMES_STOCK : FRAMES_LF;
  const shots = stock ? SHOTS_STOCK : SHOTS_LF;

  return (
    <>
      {missing ? (
        <p className={`${styles.notice} ${styles.noticeTest}`}>
          <b>Bản thử nghiệm</b>
          <span>
            Ảnh tham khảo không có trên máy này, đang hiện tranh vẽ mẫu
            <span className={styles.noticeMore}> · xem public/dev-fixtures/stock-test/SOURCES.md</span>
          </span>
          <VariantSwitch current={geometry} />
        </p>
      ) : stock ? (
        <p className={`${styles.notice} ${styles.noticeTest}`}>
          <b>Bản thử nghiệm</b>
          <span>
            {STOCK_COPY.notice}
            <span className={styles.noticeMore}>{STOCK_COPY.noticeMore}</span>
          </span>
          <VariantSwitch current={geometry} />
        </p>
      ) : (
        <p className={styles.notice}>
          <b>Bản thử nghiệm</b>
          <span>
            Dữ liệu và hình ảnh mô phỏng<span className={styles.noticeMore}>, không phải thông tin thật của VNest</span>
          </span>
        </p>
      )}

      <div className={`${styles.root} ${displayLF.variable}`}>
        {slug ? (
          <Suspense fallback={<BarPlaceholder />}>
            <PropertySearchBar slug={slug} timeZone={undefined} options={options} mockEnabled={env.bookingProvider === "mock"} />
          </Suspense>
        ) : (
          <BarPlaceholder />
        )}

        <GalleryProvider shots={shots}>
          <main>
            <Sheet
              slug={slug}
              property={PROPERTY}
              showcase={showcase}
              clip={stock ? STOCK_CLIP : SHOWCASE_CLIP}
              preview={stock ? STOCK_PREVIEW : SHOWCASE_PREVIEW}
              frames={frames.slice(0, 2)}
              count={shots.length}
              geometry={geometry}
              once={stock}
              chip={stock ? STOCK_COPY.chip : undefined}
            />

            <Chapter id="lf-amenities" frame={frames[2]!} index={3} title={COPY.amenities} purpose="Những gì có sẵn cho bạn trong lúc ở.">
              <ul className={styles.marks}>
                {AMENITY_PREVIEW.map((item) => (
                  <li key={item.label}>
                    <Pictogram name={item.icon} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </Chapter>

            <Chapter id="lf-nearby" frame={frames[3]!} index={4} title={COPY.nearby} purpose="Những gì ở ngay ngoài cửa." flip>
              <ul className={`${styles.marks} ${styles.four}`}>
                {NEARBY_PREVIEW.map((item) => (
                  <li key={item.label}>
                    <Pictogram name={item.icon} />
                    {item.label}
                  </li>
                ))}
              </ul>
            </Chapter>

            {/* The bridge to booking. Room selection is section 02.2's and is not rebuilt here: this hands the guest to it, with their stay. */}
            <section id="rooms" className={styles.bridge} aria-labelledby="lf-rooms">
              <div className={styles.bridgeInner}>
                <div>
                  <h2 id="lf-rooms" className={styles.bridgeTitle}>
                    {COPY.chooseRoom}
                  </h2>
                  <p className={styles.bridgeStay}>
                    {slug ? (
                      <Suspense fallback={<>&nbsp;</>}>
                        <StayLine slug={slug} />
                      </Suspense>
                    ) : (
                      COPY.noDates
                    )}
                  </p>
                </div>
                <div className={styles.bridgeAction}>
                  {slug ? (
                    <Suspense fallback={<span className={styles.cta} aria-hidden="true" />}>
                      <RoomsLink slug={slug} />
                    </Suspense>
                  ) : null}
                  <p className={styles.proto}>Bản thử nghiệm: bước chọn phòng mở ở trang cơ sở hiện tại, giữ nguyên ngày và số khách.</p>
                </div>
              </div>
            </section>
          </main>
        </GalleryProvider>
        <CtaPill />
      </div>
    </>
  );
}
