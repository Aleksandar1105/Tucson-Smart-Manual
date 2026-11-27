// Reviewed, deterministic answers for exactly the existing 13 intents.
import {createExpandedResolver} from './rag-expanded.mjs';
const mk='MK-MY26:PDF-2', opt='MK-MY26:PDF-1', eu='EU-MY25:PDF-307';
const claim=(text,...sources)=>({text,sources});
const facts=[
 ['Fuel tank capacity',[claim('Според дилерската спецификација MY2026, капацитетот на резервоарот е 54 литри.',mk)]],
 ['7DCT gear count',[claim('Европското упатство MY25 го опишува менувачот со двојна спојка со 7 степени за движење напред и 1 степен за движење назад.',eu),claim('Локалната спецификација MY2026 наведува 7DCT за Premium 1.6 T-GDI 180 КС 2WD. Точната конструкција на спојката за конкретното возило не е потврдена.',opt)]],
 ['Is SVM standard on Premium',[claim('Камерата 360° (SVM) е наведена во пакетот Impression, а не како стандардна опрема на Premium. Опремата на конкретното возило не е потврдена.',mk)]],
 ['Wireless charger power',[claim('Предниот безжичен полнач за телефон е наведен со моќност од 15 W во пакетот Premium.',mk)]],
 ['Tire size',[claim('За Premium се наведени гуми 235/55 R18 на фелни 7.5J × 18 инчи. Провери ги одобрените димензии на конкретното возило; ова не е препорака за притисок.',mk)]],
 ['Heated steering wheel',[claim('Греењето на воланот е наведено како стандардна опрема на Premium.',mk)]],
 ['Heated front seats',[claim('Греењето на предните седишта е наведено како стандардна опрема на Premium.',mk)]],
 ['Ambient lighting',[claim('За Premium е наведено амбиентално осветлување со 64 бои.',mk)]],
 ['HDA',[claim('Highway Driving Assist (HDA) е наведена во Premium само за верзии со DCT. Ова е систем за помош при возење, не потврда за автономно возење.',mk)]],
 ['HUD',[claim('Head-up дисплејот е наведен во пакетот Ultimate, а не како стандардна опрема на Premium.',mk)]],
 ['Panoramic sunroof',[claim('Панорамскиот покрив е дел од опционалниот Plus Pack за Premium и Impression. Не е потврдено дали конкретното возило ја има оваа опција.',opt)]],
 ['Boot capacity',[claim('Наведениот капацитет на багажникот според VDA е 620–1.799 литри.',mk)]],
 ['Wheelbase',[claim('Наведеното меѓуоскино растојание е 2.680 mm.',mk)]]
];
export function createLocalFacts(sources){
 const resolve=createExpandedResolver(sources);
 const entries=new Map();
 for(const [alias,claims] of facts){
  const selected=resolve(alias);
  if(selected.status!=='candidate_evidence'||entries.has(selected.question)||claims.some(c=>c.sources.some(id=>!selected.evidence.some(e=>e.id===id))))throw Error('local_fact_provenance_mismatch');
  entries.set(selected.question,{answer:{status:'answered',claims},usage:0,localOnly:true,answerMode:'verified_local',fitment:selected.fitment,sourceRefs:selected.evidence.map(e=>e.id)});
 }
 return question=>{
  const selected=resolve(question);
  if(selected.status!=='candidate_evidence')return {answer:{status:'insufficient',claims:[]},usage:0,localOnly:true,answerMode:'local_refusal',reason:selected.reason};
  const hit=entries.get(selected.question);if(!hit)throw Error('local_fact_missing');
  return structuredClone(hit);
 };
}
