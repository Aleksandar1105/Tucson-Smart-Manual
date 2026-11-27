import {catalog} from './catalog.mjs';
export const MODEL='gemini-3.5-flash-lite';
export const DAILY=20, MINUTE=3;
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const error=(status,code,diagnostic)=>json(status,{error:code,...(diagnostic?{diagnostic}:{})});
const schema={type:'OBJECT',properties:{status:{type:'STRING',enum:['answered','insufficient']},claims:{type:'ARRAY',items:{type:'OBJECT',properties:{text:{type:'STRING'},sources:{type:'ARRAY',items:{type:'STRING'}}},required:['text','sources']}}},required:['status','claims']};
export function validate(raw,ids){
 const r=JSON.parse(raw);if(!r||!Array.isArray(r.claims)||r.claims.length>8)throw Error('invalid_answer');
 if(r.status==='insufficient'&&r.claims.length===0)return {status:'insufficient',claims:[]};
 if(r.status!=='answered'||!r.claims.length)throw Error('invalid_answer');
 return {status:'answered',claims:r.claims.map(c=>{if(typeof c?.text!=='string'||!c.text.trim()||c.text.length>1600||!Array.isArray(c.sources)||!c.sources.length||c.sources.some(id=>!ids.includes(id)))throw Error('invalid_citation');return {text:c.text,sources:[...new Set(c.sources)]};})};
}
function auth(value,secret){if(typeof secret!=='string'||!/^[a-f0-9]{64}$/.test(secret)||!/^Bearer [a-f0-9]{64}$/.test(value??''))return false;let d=0;for(let i=0;i<64;i++)d|=value.charCodeAt(i+7)^secret.charCodeAt(i);return d===0;}
async function readSmall(req){const reader=req.body?.getReader();if(!reader)throw Error('bad_body');let size=0;const decoder=new TextDecoder('utf-8',{fatal:true});let s='';try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>512){await reader.cancel();throw Error('too_large')}s+=decoder.decode(value,{stream:true})}return JSON.parse(s+decoder.decode())}finally{reader.releaseLock()}}
// Global persistent budget: one object for the entire deployment, counts before API calls.
// Fixed UTC minute and UTC day; failed calls count too. No automatic retries.
export async function reserve(storage,now=Date.now()){
 const day=Math.floor(now/86400000),minute=Math.floor(now/60000);
 return storage.transaction(async tx=>{let r=await tx.get('budget');if(!r||r.day!==day)r={day,dayCount:0,minute,minuteCount:0};if(r.minute!==minute){r.minute=minute;r.minuteCount=0}if(r.dayCount>=DAILY||r.minuteCount>=MINUTE)return false;r.dayCount++;r.minuteCount++;await tx.put('budget',r);return true});
}
export class Quota {constructor(ctx){this.storage=ctx.storage}async fetch(req){if(req.method!=='POST')return error(405,'method');return (await reserve(this.storage))?json(200,{allowed:true}):error(429,'budget_exhausted')}}
export async function handle(req,env,fetcher=(...args)=>globalThis.fetch(...args)){
 const url=new URL(req.url);if(url.protocol!=='https:')return error(403,'https_required');
 if(url.pathname!=='/ask'||url.search)return error(404,'not_found');if(req.method!=='POST')return error(405,'method');
 // CLI-only preview. No browser CORS until the mobile interface has been reviewed.
 if(req.headers.has('origin'))return error(403,'browser_disabled');
 if(env.ENABLED!=='YES'||typeof env.GEMINI_API_KEY!=='string'||!env.GEMINI_API_KEY||!env.QUOTA||!(/^[a-f0-9]{64}$/.test(env.ACCESS_TOKEN??'')))return error(503,'not_configured');
 if(!auth(req.headers.get('authorization'),env.ACCESS_TOKEN))return error(401,'unauthorized');
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')??''))return error(415,'content_type');
 let input;try{input=await readSmall(req)}catch(e){return error(e.message==='too_large'?413:400,'invalid_body')}
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==1||typeof input.intent!=='string'||!Object.hasOwn(catalog,input.intent))return error(400,'unsupported_intent');
 const entry=catalog[input.intent],ids=entry.evidence.map(x=>x.id);
 let permit;try{permit=await env.QUOTA.get(env.QUOTA.idFromName('global')).fetch('https://quota.internal/reserve',{method:'POST'})}catch{return error(503,'quota_unavailable')}
 if(permit.status===429)return error(429,'budget_exhausted');if(!permit.ok)return error(503,'quota_unavailable');
 let phase='prepare_request',signal;
 try{
 const payload={systemInstruction:{parts:[{text:'Answer in literary Macedonian. Use only the supplied evidence. Preserve source year, standard vs optional equipment, and provisional applicability. Cite supplied IDs for all factual claims. If evidence is insufficient, return insufficient with empty claims.'}]},contents:[{role:'user',parts:[{text:JSON.stringify({question:entry.question,evidence:entry.evidence})}]}],generationConfig:{temperature:0.1,maxOutputTokens:2048,responseMimeType:'application/json',responseSchema:schema}};
 signal=AbortSignal.timeout(45000);
 phase='provider_fetch';
 const r=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:'POST',redirect:'error',headers:{'x-goog-api-key':env.GEMINI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
 if(!r.ok)return error(r.status===429?429:502,'provider_unavailable',Number.isInteger(r.status)&&r.status>=100&&r.status<=599?'upstream_'+r.status:'upstream_unknown');
 phase='provider_json';
 const data=await r.json(),c=data?.candidates?.[0];
 if(!c)return error(502,'incomplete_response','no_candidate');
 if(c.finishReason!=='STOP'){const known=['MAX_TOKENS','SAFETY','RECITATION','OTHER','BLOCKLIST','PROHIBITED_CONTENT','SPII','MALFORMED_FUNCTION_CALL','UNEXPECTED_TOOL_CALL'];return error(502,'incomplete_response','finish_'+(known.includes(c.finishReason)?c.finishReason:'UNKNOWN'));}
 phase='response_validation';
 const raw=c.content?.parts?.filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('');
 if(!raw)return error(502,'generation_unavailable','empty_response');
 const answer=validate(raw,ids);return json(200,{answer,fitment:entry.fitment,sourceRefs:ids,model:MODEL,usage:Number.isSafeInteger(data.usageMetadata?.totalTokenCount)?data.usageMetadata.totalTokenCount:null});
 }catch(e){
 const code=signal?.aborted||e?.name==='AbortError'||e?.name==='TimeoutError'?'network_timeout':phase==='prepare_request'?'request_setup_error':phase==='provider_fetch'?'network_error':phase==='provider_json'?'invalid_upstream_json':e?.message==='invalid_citation'?'invalid_citation':e?.message==='invalid_answer'?'invalid_answer':'invalid_json_response';
 return error(502,'generation_unavailable',code);
 }
}
export default {fetch:(req,env)=>handle(req,env)};
