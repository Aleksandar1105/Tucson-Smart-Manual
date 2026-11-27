import {createGateway} from './ai-gateway.mjs';
import {createPilotResolver,loadPilotSources} from './rag-gateway-pilot.mjs';
if(process.env.TUCSON_PILOT_CONSENT!=='YES')throw Error('explicit_pilot_consent_required');
const port=8788;
const server=createGateway({key:process.env.TUCSON_GEMINI_KEY,token:process.env.TUCSON_GATEWAY_TOKEN,port,maxRequests:6,resolveEvidence:createPilotResolver(loadPilotSources())});
server.listen(port,'127.0.0.1',()=>console.log('Tucson RAG pilot: http://127.0.0.1:8788'));
