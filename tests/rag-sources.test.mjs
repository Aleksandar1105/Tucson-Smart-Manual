import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {buildSourceIndex} from '../rag-sources.mjs';
const src=['EU-MY25','MK-MY26'].map(id=>JSON.parse(readFileSync(new URL('../.tucson-local/'+id+'.json',import.meta.url),'utf8')));const idx=buildSourceIndex(src);
test('two local sources, 651 pages, generation disabled',()=>{assert.equal(idx.stats.pages,651);assert.equal(idx.generationAllowed,false)});
for(const [q,topic,fitment,id,needle] of [
 ['Како функционира 7DCT?','dct','provisional','EU-MY25:PDF-307',/7\s+forward speeds/i],
 ['dual clutch','dct','provisional','MK-MY26:PDF-1',/7DCT/],
 ['Кое масло за менувачот 7DCT?','dct_fluid','verify_service','EU-MY25:PDF-37',/Dual clutch/i],
 ['Како функционира темпоматот?','cruise','listed_standard','EU-MY25:PDF-448',/Smart Cruise Control/i],
 ['HDA','hda','listed_standard','MK-MY26:PDF-2',/HDA/],
 ['Притисок во гумите 235/55 R18','tyre','verify_label','EU-MY25:PDF-33',/235\/55 R18/],
 ['Моторно масло','oil','verify_service','EU-MY25:PDF-36',/0W-20/],
 ['Палење со кабли','jump','provisional','EU-MY25:PDF-517',/Jump starting/],
 ['Што ако моторот прегрее?','overheat','provisional','EU-MY25:PDF-519',/engine overheats/i],
 ['BCA мртов агол','blind_spot','higher_trim','MK-MY26:PDF-2',/BCA/],
 ['Камера 360','surround','higher_trim','MK-MY26:PDF-2',/SVM/],
 ['Панорамски покрив','tailgate','optional','MK-MY26:PDF-1',/Plus Pack/],
 ['Безжично полнење','wireless','listed_standard','MK-MY26:PDF-2',/15W/],
 ['Обртен момент','profile','listed_specification','MK-MY26:PDF-2',/265/],
])test(q,()=>{const r=idx.search(q);assert.equal(r.topic,topic);assert.equal(r.fitment,fitment);assert.match(r.evidence.find(e=>e.id===id).text,needle);assert.ok(r.evidence.every(e=>e.page>0&&e.sourceId&&e.text.length>0));});
for(const q of ['Scheduled Ventilation','After-Blow','автоматско проветрување по паркирање','Кој е главниот град на Марс?',''])test('unsupported: '+q,()=>{assert.equal(idx.search(q).status,'unsupported');assert.equal(idx.search(q).evidence.length,0)});
test('reject invalid corpus',()=>assert.throws(()=>buildSourceIndex([src[0]])));
test('mixed topics fail closed',()=>assert.equal(idx.search('7DCT и притисок во гумите').reason,'multiple_topics_require_clarification'));
test('unconfirmed feature takes priority',()=>assert.equal(idx.search('After-Blow и HDA').status,'unsupported'));
