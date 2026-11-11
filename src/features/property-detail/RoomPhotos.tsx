"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { Lightbox, type LightboxHandle, type Photo } from "./Lightbox";
import styles from "./PropertyDetail.module.css";

/**
 * A room card's picture and its "Xem ảnh phòng (n)" action: that room's photographs only, in the
 * viewer. The picture opens the same viewer for pointer users; for keyboard and screen reader
 * users the one button is the way in, so the action is not announced twice.
 */
export function RoomPhotos({ room, photos, action }: { room: string; photos: readonly Photo[]; action?: ReactNode }) {
  const lightbox = useRef<LightboxHandle>(null);
  const cover = photos[0];
  if (!cover) {
    return (
      <div className={`${styles.roomImage} ${styles.thumbPlaceholder}`} role="img" aria-label={`Chưa có ảnh: ${room}`}>
        Chưa có ảnh
      </div>
    );
  }
  return (
    <>
      <div className={styles.roomPicture} onClick={() => lightbox.current?.open(0)} aria-hidden="true">
        {cover.src ? <Image src={cover.src} alt="" width={cover.width} height={cover.height} sizes="(min-width: 80rem) 300px, (min-width: 64rem) 25vw, (min-width: 48rem) 50vw, 8rem" loading="lazy" className={styles.roomImage} /> : <span className={`${styles.roomImage} ${styles.thumbPlaceholder}`}>Ảnh giữ chỗ</span>}
        <span className={styles.roomCount}>{photos.length} ảnh</span>
      </div>
      <button type="button" className={styles.roomPhotosButton} onClick={() => lightbox.current?.open(0)}>
        Xem ảnh phòng ({photos.length})<span className="sr-only">: {room}</span>
      </button>
      <Lightbox ref={lightbox} title={`Ảnh ${room}`} groups={[{ room, photos }]} action={action} />
    </>
  );
}
