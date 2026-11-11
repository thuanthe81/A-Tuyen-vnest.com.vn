import assert from 'node:assert/strict';
import {test} from 'node:test';
import {clientCollection} from '@/app/dev/brand-collection/client/adapter';
import {emptySearchForm, searchFromForm} from '@/features/booking-search/search-form';
import {demoBookingOptions} from './booking-options';

test('demo selector has the complete workbook inventory and the same location labels as Brand Collection',()=>{
 const content=clientCollection(), options=demoBookingOptions(content);
 assert.deepEqual(options.map(p=>p.name),['Bare Chic','Bare Hyphen','Bare Đa Kao','Bare Hàn','The Nắng Suites','Pepper House']);
 for(const option of options){
  assert.equal(option.area,content.properties.find(p=>p.id===option.id)?.location?.label);
  assert.deepEqual(Object.keys(option).sort(),['area','id','name','slug']);
  const search=searchFromForm({...emptySearchForm,propertyId:option.id},{adults:2},options);
  assert.equal(search.filters.property,option.slug);
 }
 assert.equal(searchFromForm(emptySearchForm,{adults:2},options).filters.property,undefined);
});
