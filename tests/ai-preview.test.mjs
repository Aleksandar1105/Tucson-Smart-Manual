import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewServer} from '../ai-preview-server.mjs';
import {createGateway,ALTERNATIVE_MODEL} from '../ai-gateway.mjs';
import {createPilotResolver,loadPilotSources,pilotQuestions} from '../rag-gateway-pilot.mjs';
const token='preview-secret-'+ 'a'.repeat(40), port=18890, upstreamPort=18891, origin=`http://127.0.0.1:${port}`;
const listen=(s,p)=>new Promise((resolve,reject)=>{s.once('error',reject);s.listen(p,'127.0.0.1',resolve)});
test('preview requires a server-side token',()=>assert.throws(()=>createPreviewServer({token:'short'}),/missing_token/));
test('preview static UI, same-origin guard, credentials private, valid response and local refusal',async()=>{
 let calls=0;const gateway=createGateway({key:'fake-key',token,port:upstreamPort,model:ALTERNATIVE_MODEL,resolveEvidence:createPilotResolver(loadPilotSources()),fetcher:async(url,opt)=>{calls++;assert.match(url,/gemini-3.5-flash-lite:generateContent$/);assert.equal(opt.headers['x-goog-api-key'],'fake-key');const payload=JSON.parse(JSON.parse(opt.body).contents[0].parts[0].text);assert.equal(payload.question,pilotQuestions[0]);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({status:'answered',claims:[{text:'54 литри.',sources:['MK-MY26:PDF-2']}]})}]}}],usageMetadata:{totalTokenCount:100}})}}});
 const preview=createPreviewServer({port,upstreamPort,token});await listen(gateway,upstreamPort);await listen(preview,port);
 try{
  for(const path of ['/','/preview.css','/preview.js']){const r=await fetch(origin+path);assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(r.headers.get('cache-control'),'no-store');const body=await r.text();assert.ok(!body.includes(token)&&!body.includes('fake-key'));}
  for(const path of ['/.tucson-local/EU-MY25.json','/ai-gateway.mjs','/../manual-data.js'])assert.equal((await fetch(origin+path)).status,404);
  const ask=(body,extra={})=>fetch(origin+'/ask',{method:'POST',headers:{origin,'content-type':'application/json','x-tucson-preview':'1',...extra},body:JSON.stringify(body)});
  assert.equal((await ask({question:pilotQuestions[0]},{origin:'https://example.org'})).status,403);
  assert.equal((await ask({question:pilotQuestions[0]},{'x-tucson-preview':'0'})).status,403);
  assert.equal((await ask({question:pilotQuestions[0],evidence:[]})).status,400);
  assert.equal((await ask({question:'x'.repeat(501)})).status,400);
  assert.equal(calls,0);
  const no=await ask({question:'After-Blow'});assert.equal(no.status,200);assert.equal((await no.json()).usage,0);assert.equal(calls,0);
  const yes=await ask({question:pilotQuestions[0]});assert.equal(yes.status,200);const data=await yes.json();assert.equal(data.answer.claims[0].text,'54 литри.');assert.equal(data.answer.claims[0].sources[0],'MK-MY26:PDF-2');assert.equal(calls,1);assert.ok(!JSON.stringify(data).includes(token));
 }finally{await Promise.all([new Promise(r=>preview.close(r)),new Promise(r=>gateway.close(r))]);}
});
test('preview provider failure becomes safe 502 without exposing secrets',async()=>{const port=18892,origin=`http://127.0.0.1:${port}`;const server=createPreviewServer({port,upstreamPort,token,fetcher:async()=>{throw Error('secret '+token)}});await listen(server,port);try{const r=await fetch(origin+'/ask',{method:'POST',headers:{origin,'content-type':'application/json','x-tucson-preview':'1'},body:JSON.stringify({question:'test'})});assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'generation_unavailable'});}finally{await new Promise(r=>server.close(r));}});
