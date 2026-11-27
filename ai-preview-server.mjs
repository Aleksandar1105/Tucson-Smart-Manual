import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createGateway,ALTERNATIVE_MODEL} from './ai-gateway.mjs';
import {loadPilotSources} from './rag-gateway-pilot.mjs';
import {createExpandedResolver} from './rag-expanded.mjs';
import {createLocalFacts} from './rag-local-facts.mjs';
const assets=new Map([['/',['index.html','text/html']],['/preview.css',['preview.css','text/css']],['/preview.js',['preview.js','text/javascript']]].map(([path,[name,type]])=>[path,{body:readFileSync(new URL('./ai-preview/'+name,import.meta.url)),type:type+'; charset=utf-8'}]));
export function createPreviewServer({port=8790,upstreamPort=8791,token,fetcher=fetch,resolveLocal=null,aiEnabled=true}){
 if(typeof token!=='string'||token.length<32)throw Error('missing_token');
 const host=`127.0.0.1:${port}`, origin=`http://${host}`;
 return createServer(async(req,res)=>{
  const send=(status,body,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});res.end(body)};
  const fail=(s,error)=>send(s,JSON.stringify({error}));
  if(req.headers.host!==host||(req.headers.origin&&req.headers.origin!==origin)||['cross-site','same-site'].includes(req.headers['sec-fetch-site']))return fail(403,'local_only');
  if(req.method==='GET'&&assets.has(req.url)){const a=assets.get(req.url);return send(200,a.body,a.type)}
  if(req.method==='GET'&&req.url==='/config')return send(200,JSON.stringify({localFacts:!!resolveLocal,aiEnabled}));
  if(req.method!=='POST'||!['/ask','/ask-ai'].includes(req.url))return fail(404,'not_found');
  if(req.headers.origin!==origin||req.headers['x-tucson-preview']!=='1')return fail(403,'local_only');
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']??''))return fail(415,'content_type');
  try{
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>4096)return fail(413,'too_large');chunks.push(chunk)}
   let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{return fail(400,'invalid_json')}
   if(!input||Object.keys(input).length!==1||typeof input.question!=='string'||!input.question.trim()||input.question.length>500)return fail(400,'invalid_question');
   if(req.url==='/ask'&&resolveLocal)return send(200,JSON.stringify(resolveLocal(input.question)));
   if(!aiEnabled)return fail(503,'ai_disabled');
   const r=await fetcher(`http://127.0.0.1:${upstreamPort}/ask`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({question:input.question}),signal:AbortSignal.timeout(52000)});
   return send(r.status,JSON.stringify(await r.json()));
  }catch{return fail(502,'generation_unavailable')}
 });
}
async function start(){
 const aiEnabled=process.env.TUCSON_PILOT_CONSENT==='YES'&&!!process.env.TUCSON_GEMINI_KEY;
 const sources=loadPilotSources();
 const token=randomBytes(32).toString('hex');
 const gateway=aiEnabled?createGateway({key:process.env.TUCSON_GEMINI_KEY,token,port:8791,model:ALTERNATIVE_MODEL,resolveEvidence:createExpandedResolver(sources),maxRequests:6}):null;
 const preview=createPreviewServer({token,resolveLocal:createLocalFacts(sources),aiEnabled});
 const listen=(s,p)=>new Promise((resolve,reject)=>{s.once('error',reject);s.listen(p,'127.0.0.1',resolve)});
 try{if(gateway)await listen(gateway,8791);await listen(preview,8790)}catch(e){gateway?.close();preview.close();throw e}
 console.log('Tucson preview: http://127.0.0.1:8790 ('+(aiEnabled?'local facts + optional Flash-Lite':'offline local facts only')+'; Ctrl+C to stop)');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)start().catch(()=>{console.error('Preview startup failed. Check local sources, optional key/consent and ports 8790/8791.');process.exitCode=1});
