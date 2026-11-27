import {createGateway} from './ai-gateway.mjs';
const port=8787;
const server=createGateway({key:process.env.TUCSON_GEMINI_KEY,token:process.env.TUCSON_GATEWAY_TOKEN,port});
server.listen(port,'127.0.0.1',()=>console.log('Tucson synthetic-only gateway: http://127.0.0.1:8787'));
