// V3.0.4B: reviewed bilingual intent aliases, not unrestricted semantic search.
// Only canonical questions and short reviewed facts reach the provider.
import {createPilotResolver,pilotQuestions} from './rag-gateway-pilot.mjs';
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().trim().replace(/\s+/g,' ').replace(/[?.!]+$/u,'').trim();
const originalAliases=[
 ['Колку литри собира резервоарот','Колку литри е резервоарот','Капацитет на резервоар','Fuel tank capacity','How many litres is the fuel tank','What is the fuel tank capacity'],
 ['Колку брзини има 7DCT','Колку брзини има менувачот','7DCT степени','How many gears does the 7DCT have','7DCT gear count'],
 ['Камера 360','Дали Premium има камера 360°','Does Premium have a 360 camera','Is SVM standard on Premium'],
 ['Колку вати има безжичниот полнач','Безжично полнење','Моќност на безжичниот полнач','Wireless charger power','How many watts is the wireless charger']
];
const records=[
 {aliases:['Кои димензии на гуми се стандардни за Premium','Кои гуми ги има Premium','Димензии на гуми','Tire size','Tyre size','What is the standard tyre size'],page:2,anchor:/7\.5J X 18" со 235\/55R18/,fitment:'listed_specification',question:'Кои димензии на гуми и фелни се наведени како стандардни за Premium MY2026? Не наведувај притисок.',fact:'The MY2026 dealer specification lists 235/55 R18 tyres on 7.5J x 18-inch wheels for Premium. Individual wheels and approved sizes must be checked on the vehicle.'},
 {aliases:['Дали Premium има греење на волан','Греење на волан','Дали има греење на воланот','Heated steering wheel','Does Premium have a heated steering wheel'],page:2,anchor:/PREMIUM повеќе од VISION:[\s\S]*Греење на волан[\s\S]*IMPRESSION повеќе од PREMIUM:/,fitment:'listed_standard',question:'Дали греењето на воланот е наведено како стандардна опрема на Premium MY2026?',fact:'The MY2026 dealer specification lists heated steering wheel in Premium additions.'},
 {aliases:['Дали Premium има греење на предните седишта','Греење на предните седишта','Heated front seats','Does Premium have heated front seats'],page:2,anchor:/PREMIUM повеќе од VISION:[\s\S]*Греење на предните седишта[\s\S]*IMPRESSION повеќе од PREMIUM:/,fitment:'listed_standard',question:'Дали греењето на предните седишта е наведено во Premium MY2026?',fact:'The MY2026 dealer specification lists heated front seats in Premium additions.'},
 {aliases:['Колку бои има амбиенталното осветлување','Амбиентално осветлување','Ambient lighting','How many ambient lighting colors are there','How many ambient lighting colours are there'],page:2,anchor:/Амбиентално осветлување[^\n]*\(64 бои\)/,fitment:'listed_standard',question:'Колку бои на амбиентално осветлување се наведени за Premium MY2026?',fact:'The MY2026 dealer specification lists front cabin ambient lighting with 64 colours under Premium.'},
 {aliases:['Дали Premium има HDA','Дали има HDA','HDA','Does Premium have HDA','Is HDA standard on Premium'],page:2,anchor:/HDA \(Highway Driving Assist\) - само кај DCT/,fitment:'listed_standard',question:'Дали HDA е наведена како стандардна опрема на Premium MY2026 со DCT? Наведи го условот за менувачот.',fact:'The MY2026 dealer specification lists Highway Driving Assist (HDA) under Premium, only for DCT versions. This is an equipment listing, not a description of autonomous driving.'},
 {aliases:['Дали Premium има HUD','HUD','Head-up display','Does Premium have a head-up display','Is HUD standard on Premium'],page:2,anchor:/ULTIMATE повеќе од IMPRESSION:[\s\S]*Head-up екран TFT-LCD/,fitment:'higher_trim',question:'Според спецификацијата MY2026, во кој пакет е наведен HUD како дополнителна опрема? Дали е наведен како стандард на Premium? Не заклучувај за индивидуално возило.',fact:'The MY2026 dealer specification lists the head-up display under Ultimate additions, not as standard Premium equipment.'},
 {aliases:['Дали Premium има панорамски покрив','Панорамски покрив','Дали панорамскиот покрив е стандарден','Panoramic sunroof','Is a panoramic sunroof standard on Premium'],page:1,anchor:/Опција со Premium & Impression опрема[\s\S]*Plus Pack - Eл\. Панорамски покрив/,fitment:'optional',question:'Според MY2026 дилерската спецификација дали панорамскиот покрив е стандарден или опционален на Premium? Не тврди дека конкретното возило го има.',fact:'The MY2026 dealer specification offers a panoramic roof in optional Plus Pack for Premium and Impression; individual fitment is not confirmed.'},
 {aliases:['Колкав е багажникот','Колкав е капацитетот на багажникот','Капацитет на багажник','Boot capacity','Luggage capacity','What is the luggage capacity'],page:2,anchor:/Капацитет на багажник \(VDA\)\s+620L \/ 1\.799L/,fitment:'listed_specification',question:'Кој опсег на VDA капацитет на багажникот е наведен во MY2026 спецификацијата?',fact:'The MY2026 dealer specification lists luggage capacity (VDA) as 620 to 1799 litres.'},
 {aliases:['Колкаво е меѓуоскиното растојание','Меѓуоскино растојание','Wheelbase','What is the wheelbase'],page:2,anchor:/Меѓуоскино растојание\s+2\.680 mm/,fitment:'listed_specification',question:'Колкаво меѓуоскино растојание е наведено во MY2026 дилерската спецификација?',fact:'The MY2026 dealer specification lists a wheelbase of 2680 mm.'}
];
export function createExpandedResolver(sources){
 const base=createPilotResolver(sources); // verifies corpus structure and original anchors
 const mk=sources.find(s=>s.sourceId==='MK-MY26');
 const prepared=new Map();
 const add=(alias,entry)=>{const k=norm(alias);if(prepared.has(k))throw Error('duplicate_intent_alias');prepared.set(k,entry);};
 for(const [i,aliases] of originalAliases.entries())for(const alias of [pilotQuestions[i],...aliases])add(alias,base(pilotQuestions[i]));
 for(const r of records){
  const p=mk.pages[r.page-1];if(p?.page!==r.page||!r.anchor.test(p.text))throw Error('expanded_evidence_mismatch: '+r.aliases[0]);
  const entry={status:'candidate_evidence',question:r.question,fitment:r.fitment,evidence:[{id:`MK-MY26:PDF-${r.page}`,text:r.fact}]};
  for(const alias of r.aliases)add(alias,entry);
 }
 return q=>{
  if(typeof q!=='string'||!q.trim()||q.length>500)return {status:'unsupported',reason:'invalid_query',evidence:[]};
  const hit=prepared.get(norm(q));if(hit)return structuredClone(hit);
  // Existing router supplies specific refusal reasons, never arbitrary prompts.
  return base(q);
 };
}
