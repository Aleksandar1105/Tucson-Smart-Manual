// Fixed-question pilot: local source routing, manually reviewed factual paraphrases.
// Full source text never leaves the local process. No general chat yet.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildSourceIndex} from './rag-sources.mjs';
const hashes={
 'EU-MY25':'717b608ce575bb3bd7f66de8a8891ad5fe36f8b828c164020444e9b0192a2a79',
 'MK-MY26':'54e1c0a737552dcdae6c497780bc783be3c85a4c84e91c49f78397bbecff7846'
};
export function loadPilotSources(dir=new URL('./.tucson-local/',import.meta.url)){
 return Object.entries(hashes).map(([id,hash])=>{
 const b=readFileSync(new URL(id+'.json',dir));
 if(createHash('sha256').update(b).digest('hex')!==hash)throw Error('local_source_hash_mismatch');
 const source=JSON.parse(b.toString('utf8'));if(source.sourceId!==id)throw Error('local_source_id_mismatch');return source;
 });
}
const cases=[
 ['Колкав е капацитетот на резервоарот?', 'profile', [['MK-MY26:PDF-2','The local MY2026 dealer specification lists fuel tank capacity as 54 litres.',/54\s*L/]]],
 ['Колку степени има 7DCT менувачот?', 'dct', [['EU-MY25:PDF-307','The MY25 candidate manual describes a dual-clutch transmission with seven forward gears and one reverse gear. Exact MY2026 clutch construction is not established.',/7\s+forward speeds and one reverse speed/],['MK-MY26:PDF-1','The local MY2026 dealer specification lists Premium 1.6 T-GDI 180 hp 2WD with 7DCT.',/PREMIUM[\s\S]*7DCT/]]],
 ['Дали Premium има камера 360?', 'surround', [['MK-MY26:PDF-2','In the local MY2026 dealer specification the 360-degree Surround View Monitor (SVM) is an addition at Impression above Premium. It is not listed as Premium standard equipment. Individual vehicle fitment is unverified.',/IMPRESSION[\s\S]*SVM/]]],
 ['Со колку вати е безжичното полнење?', 'wireless', [['MK-MY26:PDF-2','The local MY2026 dealer specification lists a front wireless phone charger rated at 15 W under Premium additions.',/PREMIUM[\s\S]*15W/]]]
];
export const pilotQuestions=Object.freeze(cases.map(c=>c[0]));
const norm=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
export function createPilotResolver(sources){
 const idx=buildSourceIndex(sources);
 // Verify anchors against the retrieved local evidence at startup.
 const prepared=new Map(cases.map(([question,topic,refs])=>{
 const r=idx.search(question);
 if(r.status!=='candidate_evidence'||r.topic!==topic)throw Error('pilot_route_mismatch');
 const evidence=refs.map(([id,text,anchor])=>{
 const found=r.evidence.find(e=>e.id===id);
 if(!found||!anchor.test(found.text))throw Error('pilot_evidence_mismatch');
 return {id,text};
 });
 return [norm(question),{status:'candidate_evidence',question,fitment:r.fitment,evidence}];
 }));
 return q=>{
 const match=prepared.get(norm(q));
 if(match)return structuredClone(match);
 const r=idx.search(q);
 return {status:'unsupported',reason:r.status==='unsupported'?r.reason:'outside_pilot_scope',evidence:[]};
 };
}
