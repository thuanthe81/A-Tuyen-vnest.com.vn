/** What the results page needs from a property record, reduced to plain values the browser can hold. */

import type { CardImage } from "@/components/property-card/model";
import { toCardImage } from "@/components/property-card/model";
import type { Property } from "@/domain/property";
import { findImage } from "@/domain/property";
import type { RoomContent } from "./derive";

export interface RoomView extends RoomContent {
  image?: CardImage;
}

/** A property's room types as the record has them. A field the record lacks stays absent. */
export function toRoomViews(property: Property): RoomView[] {
  return property.rooms.map((room) => {
    const image = toCardImage(room.mediaIds.map((id) => findImage(property, id)).find((candidate) => candidate !== undefined));
    return {
      id: room.id,
      name: room.name,
      ...(room.maxOccupancy !== undefined ? { maxOccupancy: room.maxOccupancy } : {}),
      ...(room.bedding ? { bedding: room.bedding } : {}),
      ...(room.areaSqm !== undefined ? { areaSqm: room.areaSqm } : {}),
      ...(image ? { image } : {}),
    };
  });
}
