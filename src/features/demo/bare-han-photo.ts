import type { ClientCollection } from '@/app/dev/brand-collection/client/adapter';
import { toPhoto } from '@/app/dev/brand-collection/client/photos';
import type { PhotoManifest } from '@/content/vnest-workbook/photo-manifest';
import { approvedDemoPhoto } from './approved-photos';
/** Corrected workbook v2 D16 → Bare Han Ground → 26.jpg. Demo scope only. */
export function withBareHanDemoPhoto(content: ClientCollection, manifest: PhotoManifest | null): ClientCollection {
  const entry=approvedDemoPhoto(manifest,'bare-han-ground-26');
  if(!entry) return content;
  return {...content,properties:content.properties.map(property=>{
    if(property.id!=='bare-han')return property;
    const {placeholder:_placeholder,...rest}=property;
    return {...rest,photo:toPhoto(entry,'45% 50%')};
  })};
}
