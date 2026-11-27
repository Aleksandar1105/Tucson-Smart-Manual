// V3.0.2: local evidence retrieval only, no model calls.
const normalize = s => String(s ?? '').normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim();
const stop = new Set('како што зошто кога каде дали кој која кое кои колку да се на во за со од до по и или е има треба можам може мојот моето автомобил возило ми го ја при после откако само ли сум ако не што правам направам'.split(' '));
const tokens = s => (normalize(s).match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>1&&!stop.has(w)).map(w=>w.length>5?w.replace(/(овите|евите|ите|ата|ото|ови|ски|ска|ско|от|та|то|те|а|и|е)$/u,''):w);
const topics = [
 [/темпомат|\bscc\b|cruise control/i,['паметен темпомат','smart cruise control','растојание на возило']],
 [/притисок.{0,30}гум|\btpms\b/i,['притисок на гумите','притисок во гумите','tpms']],
 [/прегре.{0,25}мотор|мотор.{0,25}прегре/i,['ако моторот прегрее','прегревање','течност за ладење']],
 [/палење.{0,20}кабл|запал.{0,30}кабл/i,['палење со кабли','помошно возило','акумулатор']],
 [/моторно масло|масло.{0,20}мотор/i,['моторно масло','ниво на моторно масло']],
 [/течност.{0,20}сопира/i,['течност за сопирачките','течност за сопирање']],
 [/мртов агол|\bbca\b/i,['мртов агол','слеп агол']],
 [/вентилац|проветрува/i,['вентилација','вентилатор','внес на воздух']],
];
const unsupported = /\bdct\b|\b7\s*[- ]?dct\b|двојн\p{L}*\s+спојк|scheduled ventilation|after[ -]?blow|автоматск\p{L}*\s+проветрува|проветрува\p{L}*\s+по\s+паркира/iu;
const fitment = /(?:притисок|масло|лубрикант|течност|гуми|вртежен момент|интервал|капацитет|прикoлка|приколка).{0,40}(?:колку|мој|точен|точна|точно|\b1[.,]6\b|235)|(?:колку|кој[ае]?|мој|точен|точна|точно|\b1[.,]6\b|235).{0,50}(?:притисок|масло|лубрикант|течност|гуми|вртежен момент|интервал|капацитет|приколка)|\b235\s*\/\s*55\s*r?\s*18\b/i;
const chapterStarts=[5,10,21,81,117,252,333,477,506,583];
const chapterNames=['Вовед','Индекс на слики','Седишта и безбедност','Контролна табла','Карактеристики за удобност','Возење','Помош на возачот','Итни ситуации','Одржување','Информации за возилото'];
const chapterFor = n => chapterNames[chapterStarts.findLastIndex(x=>x<=n)] || 'Почетни страници';
export function buildIndex(data){
 if(!Array.isArray(data)||data.length!==612||data.some((d,i)=>!Array.isArray(d)||typeof d[0]!=='string'||typeof d[1]!=='string'))throw Error('Invalid manual corpus: expected 612 page records');
 const rows=Array.from(data).map((d,i)=>({page:i+1,text:d[1],printedPage:d[1].slice(0,170).match(/(?:^|\n)\s*(\d{1,2}-\d{1,3})\s*(?:\n|$)/)?.[1]??null,chapter:chapterFor(i+1),image:'pages/'+String(i+1).padStart(3,'0')+'.jpg'}));
 const docs=rows.filter(r=>r.text.trim().length>=100 && r.page>=8 && r.page<600 && !/\.{8,}/.test(r.text)).map(r=>{const ts=tokens(r.text),tf=new Map();for(const t of ts)tf.set(t,(tf.get(t)||0)+1);return {...r,tf,len:ts.length,normalized:normalize(r.text)};});
 const df=new Map();for(const d of docs)for(const t of d.tf.keys())df.set(t,(df.get(t)||0)+1);
 const avg=docs.reduce((a,d)=>a+d.len,0)/docs.length;
 const sourceMismatch=rows[6].text.includes('Motor America')&&rows[262].text.includes('осум брзини');
 // Retrieval never authorizes model generation. A verified vehicle-specific source is required first.
 function search(question,{limit=5}={}){
  const q=normalize(question);if(!q||q.length>500)return {status:'unsupported',reason:'invalid_query',evidence:[]};
  if(sourceMismatch&&(unsupported.test(q)||fitment.test(q)))return {status:'unsupported',reason:'vehicle_configuration_unverified',evidence:[]};
  const terms=[...new Set(tokens(q))];if(!terms.length)return {status:'unsupported',reason:'no_query_terms',evidence:[]};
  const aliases=topics.filter(([re])=>re.test(q)).flatMap(([,p])=>p);
  const hits=docs.map(d=>{let score=0,matched=0;for(const t of terms){const f=d.tf.get(t)||0;if(!f)continue;matched++;const idf=Math.log(1+(docs.length-(df.get(t)||0)+.5)/((df.get(t)||0)+.5));score+=idf*f*2.2/(f+1.2*(.25+.75*d.len/avg));}let phrases=aliases.filter(p=>d.normalized.includes(p));score+=phrases.length*5;if(d.normalized.includes(q))score+=8;return {d,score,matched,phrases};}).filter(r=>r.score>=3&&(r.matched>=Math.ceil(terms.length*.6)||r.phrases.length>=2)).sort((a,b)=>b.score-a.score||a.d.page-b.d.page);
  const evidence=hits.slice(0,Math.max(1,Math.min(8,Number(limit)||5))).map(({d,score})=>({id:'PDF-'+d.page,page:d.page,printedPage:d.printedPage,chapter:d.chapter,image:d.image,text:d.text,score:Math.round(score*100)/100}));
  return {status:evidence.length?'candidate_evidence':'unsupported',reason:evidence.length?'requires_grounded_review':'no_relevant_evidence',sourceMismatch,evidence};
 }
 return {search,generationAllowed:false,stats:{pages:rows.length,searchablePages:docs.length,shortTextPages:rows.filter(r=>r.text.trim().length<100).map(r=>r.page),sourceMismatch}};
}
