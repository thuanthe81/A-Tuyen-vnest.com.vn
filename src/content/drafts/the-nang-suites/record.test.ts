import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildNang} from './record';
import {resolveProperty} from '@/domain/property';
import {buildDetailView} from '@/features/property-detail/view';
test('Nắng demo groups only available room photos, never invents booking, rates or room facts',()=>{
 const {record,trace}=buildNang(key=>({src:`/dev-client-media/${key}/800.jpg`,width:800,height:534}));
 const p=resolveProperty(record,'vi',['vi']);assert.ok(p);
 // 19 photographs in NANG_IMAGES + 2 selected covers (18.png replaces nang-blue-moon-18) = 20 showable photographs (5 per room).
 assert.equal(p.media.images.length,20);
 assert.deepEqual(
  p.rooms.map(r=>[r.id, r.name]),
  [
   ['yellow-submarine', 'Yellow Submarine'],
   ['pale-blue-eyes', 'Pale Blue Eyes'],
   ['green-river', 'Green River'],
   ['blue-moon', 'Blue Moon'],
  ],
 );
 assert.deepEqual(p.rooms.find(r=>r.name==='Yellow Submarine')?.mediaIds,['nang-yellow-4','nang-yellow-7','nang-yellow-6','nang-yellow-9','nang-yellow-11']);
 assert.deepEqual(p.rooms.find(r=>r.name==='Pale Blue Eyes')?.mediaIds,['sel-13-the-nang-pale-blue-eyes','nang-pale-4','nang-pale-3','nang-pale-6','nang-pale-7']);
 assert.deepEqual(p.rooms.find(r=>r.name==='Green River')?.mediaIds,['the-nang-suites','nang-green-4','nang-green-5','nang-green-7','nang-green-9']);
 assert.deepEqual(p.rooms.find(r=>r.name==='Blue Moon')?.mediaIds,['sel-14-the-nang-blue-moon','nang-blue-moon-17','nang-blue-moon-14','nang-blue-moon-10','nang-blue-moon-15']);
 assert.equal(p.rooms.length,4);
 assert.equal(p.rooms[0]?.name,'Yellow Submarine');
 for(const room of p.rooms)for(const id of room.mediaIds)assert.equal(p.media.images.find(i=>i.id===id)?.roomTypeId,room.id);
 assert.deepEqual(record.booking.providers,{});assert.deepEqual(record.rateReferences,[]);
 const view=buildDetailView(trace,{audience:'public',bookingConnected:false});
 assert.ok(view.rooms.every(r=>r.price.kind==='pending'));
 assert.equal(trace.property.city.display,'da-nang');
 assert.ok(trace.property.description.display?.includes(trace.intro.display!));
 for(const paragraph of trace.story.display??[])assert.ok(trace.property.description.display?.includes(paragraph));
});
test('Nắng missing media leaves real room names and no invented or borrowed photos',()=>{
 const {record}=buildNang(()=>null);
 assert.equal(record.media.images.length,0);assert.equal(record.rooms.length,4);
 assert.ok(record.rooms.every(r=>r.mediaIds.length===0));
});
