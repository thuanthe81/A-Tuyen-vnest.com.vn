/** Local CEO demo, 23/10/2026. Workbook v2 rows 20–23; exact photo provenance in
 * docs/qa/demo/nang-page-2026-10-23/sources.json. No production registration or booking mapping. */
import type { PropertyRecord } from '@/domain/property';
import { readClientProperties, slug } from '@/content/vnest-workbook/records';
import { amenitiesOf, orderedRoomsForProperty, transportOf } from '@/content/vnest-workbook/property-details';
import type { Sourced } from '@/content/vnest-workbook/sourced';
import type { PhotoLookup } from '../bare-chic/record';
import { AMENITY_ICON_CHOICES } from '../bare-chic/record';
import { isShowable, SELECTION, selectionForProperty, withSelectedFirst } from '@/content/vnest-workbook/image-selection';

export const NANG_IMAGES = [
  { key: 'nang-yellow-4', room: 'Yellow Submarine', alt: 'Yellow Submarine: giường, gương tròn trên vách gỗ, tường xanh và bàn ghế' },
  { key: 'nang-yellow-7', room: 'Yellow Submarine', alt: 'Yellow Submarine: từ giường nhìn ra bàn ghế và cửa ban công, vách gỗ bên phải' },
  { key: 'nang-yellow-6', room: 'Yellow Submarine', alt: 'Yellow Submarine: góc bếp ốp gỗ với kệ mở, bồn rửa và bàn ăn nhỏ' },
  { key: 'nang-yellow-9', room: 'Yellow Submarine', alt: 'Yellow Submarine: bàn ghế bên khung cửa kính lớn mở ra ban công nhiều nắng' },
  { key: 'nang-yellow-11', room: 'Yellow Submarine', alt: 'Yellow Submarine: phòng tắm riêng với lavabo, gương tròn và vách kính tắm đứng' },
  { key: 'nang-pale-4', room: 'Pale Blue Eyes', alt: 'Pale Blue Eyes: giường, tranh màu và góc bếp ốp gỗ' },
  { key: 'nang-pale-3', room: 'Pale Blue Eyes', alt: 'Pale Blue Eyes: giường ngủ êm ái bên vách gỗ ấm và tranh nghệ thuật treo tường' },
  { key: 'nang-pale-6', room: 'Pale Blue Eyes', alt: 'Pale Blue Eyes: khu vực bếp nhỏ ốp gỗ gọn gàng với bồn rửa và kệ ly' },
  { key: 'nang-pale-7', room: 'Pale Blue Eyes', alt: 'Pale Blue Eyes: phòng tắm riêng sáng thoáng với gương lớn và khu tắm vòi sen' },
  { key: 'the-nang-suites', room: 'Green River', alt: 'Green River: giường bên vách gỗ và ba gương sáng, góc ngồi cạnh cửa ban công' },
  { key: 'nang-green-4', room: 'Green River', alt: 'Green River: góc nhìn từ giường ngủ ra bàn trà, ghế tựa và cửa kính ban công' },
  { key: 'nang-green-5', room: 'Green River', alt: 'Green River: hệ vách gỗ ấm, ba gương trang trí và ánh sáng tự nhiên trong phòng' },
  { key: 'nang-green-7', room: 'Green River', alt: 'Green River: góc bếp nhỏ ốp gỗ với kệ mở và thiết bị tiện nghi' },
  { key: 'nang-green-9', room: 'Green River', alt: 'Green River: khu vực lavabo và phòng tắm riêng gọn gàng, sáng thoáng' },
  { key: 'nang-blue-moon-17', room: 'Blue Moon', alt: 'Blue Moon: sofa và bàn gỗ, giường phía sau, rèm xanh và ánh sáng từ ban công' },
  { key: 'nang-blue-moon-14', room: 'Blue Moon', alt: 'Blue Moon: giường dưới tranh màu, vách gỗ và khu bồn rửa' },
  { key: 'nang-blue-moon-18', room: 'Blue Moon', alt: 'Blue Moon: bồn tắm, gương trang trí và cửa ra ban công' },
  { key: 'nang-blue-moon-10', room: 'Blue Moon', alt: 'Blue Moon: bàn ăn gỗ, ghế tựa và góc bếp nhỏ ấm cúng bên mảng tường xanh' },
  { key: 'nang-blue-moon-15', room: 'Blue Moon', alt: 'Blue Moon: góc nhìn từ giường ngủ hướng ra sofa, bàn trà và ban công ngập nắng' },
] as const;
/** Owner image selection, 26/10/2026 (image-selection.ts): Pale Blue Eyes (13) and Blue Moon (14, the same photograph as 18.png) lead their rooms. */
const SELECTED_IMAGES = selectionForProperty('the-nang-suites').filter(isShowable).map(image => ({ key: image.key, room: image.room, alt: image.alt }));
export function buildNang(photo: PhotoLookup) {
  const property = readClientProperties().find(p => p.id === 'the-nang-suites');
  if (!property) throw new Error('The Nắng Suites is missing from workbook v2');
  const amenities = amenitiesOf(20);
  const orderedRooms = orderedRoomsForProperty('the-nang-suites');
  const rooms = orderedRooms.map(r => r.details);
  const text = property.description.display ?? '';
  // Verbatim excerpts; omit the workbook's rhetorical comparison and typo, add no new claims.
  const intro: Sourced<string> = {...property.description, display: text.split(/(?<=\.)\s+/)[1] ?? null, status: 'normalized', rule: 'Verbatim second sentence of E20'};
  const story: Sourced<readonly string[]> = {...property.description, display: [
    'Nơi này được tạo ra để những câu chuyện được kể và chia sẻ.',
    'Dạo quanh các căn phòng bạn dễ dàng nhận ra mọi thứ ở đây đều gọn gàng, tiện nghi và không gian được đề cao tính thẩm mỹ.',
    'Đây chính là nơi để bạn ngủ trong yên bình và thức dậy trong nắng ấm.',
  ].filter(sentence => text.includes(sentence)), status: 'normalized', rule: 'Selected complete sentences verbatim from E20'};
  const available = [...NANG_IMAGES, ...SELECTED_IMAGES].flatMap(spec => { const file=photo(spec.key); return file ? [{...spec,file}] : []; });
  // An older copy of a selected photograph (18.png) is left out, so each photograph appears once.
  const replaced = new Set(SELECTION.filter(i => i.replaces && available.some(a => a.key === i.key)).map(i => i.replaces!));
  const images = available.filter(i => !replaced.has(i.key));
  const have = new Set(images.map(i=>i.key));
  const roomMedia = (room: string) => withSelectedFirst(images.filter(i=>i.room===room).map(i=>i.key), room, key=>have.has(key));
  const record: PropertyRecord = {
    id:'the-nang-suites', slug:'the-nang-suites', source:'client-supplied', status:'draft', approvedLocales:['vi'],
    identity:{name:{vi:property.name.display!}, brandId:property.brand.display!, ...(images[0] ? {signatureMediaId:images[0].key} : {})},
    narrative:{...(intro.display ? {positioning:{vi:intro.display}} : {}), ...(text ? {summary:{vi:text}} : {})},
    place:{area:{id:'da-nang',slug:'da-nang',name:{vi:'Đà Nẵng'}},address:{vi:property.address.display!},timeZone:'Asia/Ho_Chi_Minh'},
    media:{images:images.map(({key,room,alt,file})=>({kind:'image',id:key,...file,alt:{vi:alt},rights:'client-supplied-pending',roomTypeId:slug(room)})),videos:[]},
    rooms:rooms.map(room=>({id:slug(room.name.display!),slug:slug(room.name.display!),name:{vi:room.name.display!},amenities:[],mediaIds:roomMedia(room.name.display!)})),
    amenities:(amenities.display??[]).map(label=>({id:slug(label),label:{vi:label},...(AMENITY_ICON_CHOICES[label]?{icon:AMENITY_ICON_CHOICES[label]}:{})})),
    nearby:[],rateReferences:[],policies:[],faqs:[],seo:{},booking:{providers:{}},
    presentation:{layout:'living-frames',sections:[{kind:'media',id:'gallery',variant:'grouped-by-room',mediaIds:rooms.flatMap(room=>roomMedia(room.name.display!)),caption:{vi:'Ảnh các phòng của The Nắng Suites, theo từng phòng'}}]},
  };
  return {record,trace:{property,intro,story,amenities,rooms,transport:transportOf(20)}};
}
