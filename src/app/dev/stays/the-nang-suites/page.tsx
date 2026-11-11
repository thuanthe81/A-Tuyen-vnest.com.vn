import { notFound } from 'next/navigation';
import { env } from '@/config/env';
import { site } from '@/config/site';
import { readPhotoManifest } from '@/content/vnest-workbook/photo-manifest';
import { selectionLookup } from '@/content/vnest-workbook/selection-photos';
import { approvedDemoPhoto } from '@/features/demo/approved-photos';
import { buildNang } from '@/content/drafts/the-nang-suites/record';
import { cityNote } from '@/content/vnest-workbook/city-notes';
import { readClientProperties } from '@/content/vnest-workbook/records';
import { resolveProperty } from '@/domain/property';
import { CityNotes } from '@/features/city-notes/CityNotes';
import { buildCityNotesView } from '@/features/city-notes/view';
import { BookNowButton } from '@/features/demo/BookingCta';
import { stayFromQuery } from '@/features/demo/booking-flow';
import { demoBookingOptions } from '@/features/demo/booking-options';
import { DemoPropertyShell } from '@/features/demo/DemoPropertyShell';
import { PropertyDetail } from '@/features/property-detail/PropertyDetail';
import { buildDetailView } from '@/features/property-detail/view';
import { reviewAccess } from '@/features/property-detail/review-access';
import { buildMetadata } from '@/seo/metadata';
import { clientCollection } from '../../brand-collection/client/adapter';

export const dynamic = 'force-dynamic';
export const metadata = buildMetadata({title:'The Nắng Suites · bản trình diễn',path:()=>'/dev/stays/the-nang-suites',noindex:true});
/** Header with the one 02.1 bar and BOOK NOW in the viewers and drawers: VNest V3 Stage 1, 24/10/2026 (DemoPropertyShell). */
export default async function NangDemo({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  if (!reviewAccess(env).route) notFound();
  const manifest=readPhotoManifest();
  const selected=selectionLookup();
  const {record,trace}=buildNang(key=>{
    if(key.startsWith('sel-')) return selected(key);
    const entry=approvedDemoPhoto(manifest,key) ?? manifest?.photos[key];
    const jpeg=entry?.variants.filter(v=>v.type==='image/jpeg').sort((a,b)=>b.width-a.width)[0];
    return jpeg?{src:jpeg.src,width:jpeg.width,height:jpeg.height}:null;
  });
  const property=resolveProperty(record,site.defaultLocale,site.enabledLocales)!;
  const view=buildDetailView(trace,{audience:'public',bookingConnected:false});
  view.brand='The Nắng Suites · Đà Nẵng';
  const note=cityNote('da-nang');
  const cityView=note?buildCityNotesView(note,{audience:'public'}):null;
  const options=demoBookingOptions(clientCollection(readClientProperties()));
  const query=await searchParams;
  return <DemoPropertyShell initial={stayFromQuery(query,property.slug)} options={options}>
    <PropertyDetail property={property} view={view} cityNotes={cityView?<CityNotes view={cityView}/>:undefined}
      bookAction={({room,place})=><BookNowButton key={`${place}-${room ?? property.id}`} room={room} tone={place==='viewer'?'dark':'light'} block={place==='drawer'}/>}/>
  </DemoPropertyShell>;
}
