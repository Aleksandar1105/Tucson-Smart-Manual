// V3.0.2C pilot: bilingual topic routing, no generative model or network.
// Evidence is provisional, never confirmation of actual vehicle fitment.
const counts={'EU-MY25':649,'MK-MY26':2};
const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const routes=[
 ['ventilation_unknown',/scheduled ventilation|after[ -]?blow|проветрува.*(?:паркира|исклуч|гасење)|автоматск\S*\s+проветрува/iu,[],[],'unconfirmed_feature'],
 ['blind_spot',/мртов агол|слеп агол|\bbca\b|\bbc[wа]\b|blind.spot|\bbvm\b/iu,[],[2],'higher_trim'],
 ['surround',/360|\bsvm\b|surround view/iu,[],[2],'higher_trim'],
 ['seat_vent',/вентилац\S*\s+(?:на\s+)?(?:предни\S*\s+)?седиш|ventilat\w* seat/iu,[],[2],'higher_trim'],
 ['hud',/head.up|\bhud\b|проекц\S*\s+дисплеј/iu,[],[2],'higher_trim'],
 ['tailgate',/панорам|sunroof|електр\S*\s+(?:отвора\S*\s+(?:на\s+)?)?багажник|power tailgate/iu,[],[1],'optional'],
 ['dct_fluid',/(?:dct|менувач|спојк).*(?:масло|течност|fluid)|(?:масло|течност|fluid).*(?:dct|менувач|спојк)/iu,[37],[1],'verify_service'],
 ['dct',/\b7\s*[- ]?dct\b|\bdct\b|двојн\S*\s+спојк|dual clutch|менувач/iu,[307,308,309],[1,2],'provisional'],
 ['hda',/\bhda\b|highway driving assist|асистенц\S*\s+на\s+автопат/iu,[468,469,470,471,472,473],[2],'listed_standard'],
 ['cruise',/темпомат|\bscc\b|\bnscc\b|cruise control/iu,[442,445,446,447,448,454,460,461],[2],'listed_standard'],
 ['tyre',/притисок.*гум|гум.*притисок|235\s*\/\s*55|\btpms\b|tyre pressure|tire pressure/iu,[33,40],[2],'verify_label'],
 ['oil',/моторн\S*\s+масло|масло.*мотор|engine oil|\b0w-20\b/iu,[36,38,568,569],[],'verify_service'],
 ['jump',/палење.*кабл|запал.*кабл|jump start/iu,[517,518,519],[],'provisional'],
 ['overheat',/прегре.*мотор|мотор.*прегре|engine overheat/iu,[519,520],[],'provisional'],
 ['dehumidify',/одвлажнува|dehumidify|одмаглува|defog/iu,[254,255],[2],'provisional'],
 ['wireless',/безжичн\S*\s+полне|wireless.*charg/iu,[263,264],[2],'listed_standard'],
 ['heated_wheel',/гре\S*\s+(?:на\s+)?волан|heated steering wheel/iu,[181,182],[2],'listed_standard'],
 ['profile',/обртен момент|моќност|коњски сили|резервоар|багажник|забрзување|torque|fuel tank|luggage volume/iu,[],[1,2],'listed_specification'],
];
export function buildSourceIndex(sources){
 const byId=new Map();
 for(const s of sources){if(!Object.hasOwn(counts,s.sourceId)||byId.has(s.sourceId)||!Array.isArray(s.pages)||s.pages.length!==counts[s.sourceId]||!/^[a-f0-9]{64}$/.test(s.sha256)||s.pages.some((p,i)=>p.page!==i+1||typeof p.text!=='string'))throw Error('Invalid source');byId.set(s.sourceId,s);}
 if(byId.size!==2)throw Error('Both local sources required');
 function evidence(id,pages){const s=byId.get(id);return pages.map(n=>{const p=s.pages[n-1];return {id:`${id}:PDF-${n}`,sourceId:id,page:n,printedPage:p.printedPage,text:p.text,filename:s.filename,sha256:s.sha256};});}
 return {stats:{sources:byId.size,pages:651},generationAllowed:false,search(question){const q=normalize(question);if(!q||q.length>500)return {status:'unsupported',reason:'invalid_query',evidence:[]};let matches=routes.filter(r=>r[1].test(q));if(matches.some(r=>r[0]==='ventilation_unknown'))return {status:'unsupported',reason:'unconfirmed_feature',evidence:[]};if(matches.some(r=>r[0]==='dct_fluid'))matches=matches.filter(r=>r[0]!=='dct');if(matches.length>1)return {status:'unsupported',reason:'multiple_topics_require_clarification',evidence:[]};if(!matches.length)return {status:'unsupported',reason:'no_curated_topic',evidence:[]};const [topic,,eu,mk,fitment]=matches[0];if(fitment==='unconfirmed_feature')return {status:'unsupported',reason:fitment,evidence:[]};return {status:'candidate_evidence',topic,fitment,reason:'requires_grounded_review',evidence:[...evidence('MK-MY26',mk),...evidence('EU-MY25',eu)]};}};
}
