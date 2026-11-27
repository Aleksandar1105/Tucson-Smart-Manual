import {test} from 'node:test';import assert from 'node:assert/strict';import {generate,validateAnswer,createGateway,fetchWith503Retry,selectModel,ALTERNATIVE_MODEL,MODEL} from '../ai-gateway.mjs';
const valid={status:'answered',claims:[{text:'54 литри.',sources:['TEST-1']}]};
const mock=(answer=valid,finishReason='STOP')=>async(url,opt)=>{assert.match(url,/gemini-4-hydrogen:generateContent$/);assert.equal(opt.headers['x-goog-api-key'],'fake-key');assert.match(opt.body,/TEST-1/);assert.ok(!opt.body.includes('fake-key'));return {ok:true,json:async()=>({candidates:[{finishReason,content:{parts:[{thought:true,text:'hidden'},{text:JSON.stringify(answer)}]}}],usageMetadata:{totalTokenCount:100}})}};
test('valid citation',()=>assert.deepEqual(validateAnswer(JSON.stringify(valid),['TEST-1']),valid));
test('invented citation blocked',()=>assert.throws(()=>validateAnswer(JSON.stringify({status:'answered',claims:[{text:'x',sources:['FAKE']}]}),['TEST-1'])));
test('missing citation blocked',()=>assert.throws(()=>validateAnswer(JSON.stringify({status:'answered',claims:[{text:'x',sources:[]}]}),['TEST-1'])));
test('insufficient allowed',()=>assert.deepEqual(validateAnswer('{"status":"insufficient","claims":[]}',[]),{status:'insufficient',claims:[]}));
test('insufficient with claims blocked',()=>assert.throws(()=>validateAnswer(JSON.stringify({...valid,status:'insufficient'}),['TEST-1'])));
test('malformed blocked',()=>assert.throws(()=>validateAnswer('oops',[])));
test('request uses key header and synthetic fixture',async()=>assert.deepEqual(await generate({question:'Капацитет?',key:'fake-key',fetcher:mock()}),{answer:valid,usage:100}));
test('incomplete generation blocked',async()=>assert.rejects(generate({question:'Капацитет?',key:'fake-key',fetcher:mock(valid,'MAX_TOKENS')})));
test('upstream error blocked',async()=>assert.rejects(generate({question:'Капацитет?',key:'fake-key',fetcher:async()=>({ok:false,status:429})})));
test('empty key rejected',async()=>assert.rejects(generate({question:'Капацитет?',key:''})));
test('HTTP auth, origin, evidence injection, rate limit and valid response',async()=>{const port=18787,token='a'.repeat(32);const s=createGateway({key:'fake-key',token,port,fetcher:mock(),maxRequests:2});await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(port,'127.0.0.1',resolve)});try{const url=`http://127.0.0.1:${port}/ask`;const request=(body,headers={})=>fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});const auth={authorization:`Bearer ${token}`};assert.equal((await request({question:'x'})).status,401);assert.equal((await request({question:'x'},{...auth,origin:'https://example.org'})).status,403);assert.equal((await request({question:'x',evidence:'fake'},auth)).status,400);const r=await request({question:'Капацитет?'},auth);assert.equal(r.status,200);assert.deepEqual((await r.json()).answer,valid);assert.equal((await request({question:'x'},auth)).status,429);}finally{await new Promise(r=>s.close(r));}});

// Diagnostics must classify failures without disclosing response content or secrets.
for(const [label,fetcher,expected] of [
 ['upstream status',async()=>({ok:false,status:400}),'upstream_400'],
 ['quota',async()=>({ok:false,status:429}),'upstream_429'],
 ['truncated',mock(valid,'MAX_TOKENS'),'finish_MAX_TOKENS'],
 ['bad JSON',async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'secret raw response'}]}}]})}),'invalid_json_response'],
 ['network failure',async()=>{throw Object.assign(new Error('secret raw network error'),{cause:{code:'ENOTFOUND'}})},'network_ENOTFOUND'],
 ['no candidate',async()=>({ok:true,json:async()=>({})}),'no_candidate'],
 ['empty response',async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[]}}]})}),'empty_response'],
 ['unexpected error',async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:{secret:'fake-key'}}}]})}),'internal_error'],
])test('redacted diagnostic: '+label,async()=>{const port=18788,token='a'.repeat(32),logs=[];const s=createGateway({key:'fake-key',token,port,fetcher,log:x=>logs.push(x)});await new Promise((resolve,reject)=>{s.once('error',reject);s.listen(port,'127.0.0.1',resolve)});try{const r=await fetch(`http://127.0.0.1:${port}/ask`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({question:'test'})});assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'generation_unavailable',diagnostic:expected});assert.deepEqual(logs,['Gateway diagnostic: '+expected]);}finally{await new Promise(r=>s.close(r));}});

// Explicit 503 only; mock delays make tests deterministic and offline.
const unavailable=(header=null)=>({ok:false,status:503,headers:{get:()=>header}});
const runRetry=async(responses)=>{let calls=0;const delays=[];const signal=AbortSignal.timeout(45000);const result=await fetchWith503Retry(async(url,opt)=>{assert.equal(opt.signal,signal);return responses[calls++];},'https://example.invalid',{signal},{wait:async(ms)=>delays.push(ms),clock:()=>0});return {calls,delays,result};};
test('503 then success: one retry',async()=>{const r=await runRetry([unavailable(),{ok:true,status:200}]);assert.equal(r.calls,2);assert.deepEqual(r.delays,[2000]);assert.equal(r.result.status,200)});
test('two 503 then success: bounded backoff',async()=>{const r=await runRetry([unavailable(),unavailable(),{ok:true,status:200}]);assert.equal(r.calls,3);assert.deepEqual(r.delays,[2000,4000]);assert.equal(r.result.status,200)});
test('persistent 503: stops at three',async()=>{let calls=0;await assert.rejects(generate({question:'test',key:'fake-key',fetcher:async()=>{calls++;return unavailable()},retryWait:async()=>{}}),/upstream_503/);assert.equal(calls,3)});
test('429 and 400 never retried',async()=>{for(const status of [400,429]){const r=await runRetry([{ok:false,status}]);assert.equal(r.calls,1);assert.deepEqual(r.delays,[])}});
test('Retry-After respected within limit',async()=>{const r=await runRetry([unavailable('6'),{ok:true,status:200}]);assert.deepEqual(r.delays,[6000])});
test('long Retry-After stops without repeating',async()=>{const r=await runRetry([unavailable('30')]);assert.equal(r.calls,1);assert.equal(r.result.status,503);assert.deepEqual(r.delays,[])});
test('invalid cited answer after 503 still blocked',async()=>{let calls=0;await assert.rejects(generate({question:'test',key:'fake-key',retryWait:async()=>{},fetcher:async(...args)=>++calls===1?unavailable():mock({status:'answered',claims:[{text:'x',sources:['FAKE']}]})(...args)}),/invalid_citation/);assert.equal(calls,2)});
test('aborted deadline prevents next retry',async()=>{const c=new AbortController();let calls=0;await assert.rejects(fetchWith503Retry(async()=>{calls++;return unavailable()},'https://example.invalid',{signal:c.signal},{wait:async()=>c.abort()}),{name:'AbortError'});assert.equal(calls,1)});

test('model selection default and allowlist',()=>{assert.equal(selectModel(),MODEL);assert.equal(selectModel(ALTERNATIVE_MODEL),'gemini-3.5-flash-lite');assert.throws(()=>selectModel('other'),/unsupported_model/)});
test('alternative model uses identical structured schema and evidence validation',async()=>{let calls=0;const result=await generate({question:'Capacity?',key:'fake-key',model:ALTERNATIVE_MODEL,fetcher:async(url,opt)=>{calls++;assert.match(url,/\/models\/gemini-3\.5-flash-lite:generateContent$/);const p=JSON.parse(opt.body);assert.equal(p.generationConfig.responseMimeType,'application/json');assert.equal(p.generationConfig.responseSchema.type,'OBJECT');return mock()(url.replace(ALTERNATIVE_MODEL,MODEL),opt)}});assert.equal(calls,1);assert.deepEqual(result.answer,valid)});
test('unsupported model never reaches network',async()=>{await assert.rejects(generate({question:'x',key:'fake-key',model:'other',fetcher:()=>assert.fail('network')}),/unsupported_model/);assert.throws(()=>createGateway({key:'fake-key',token:'a'.repeat(32),model:'other'}),/unsupported_model/)});
test('alternate model still rejects fabricated citations',async()=>{await assert.rejects(generate({question:'x',key:'fake-key',model:ALTERNATIVE_MODEL,fetcher:(url,opt)=>mock({status:'answered',claims:[{text:'x',sources:['FAKE']}]})(url.replace(ALTERNATIVE_MODEL,MODEL),opt)}),/invalid_citation/)});
