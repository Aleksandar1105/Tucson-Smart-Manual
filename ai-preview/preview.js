'use strict';
const questions=['Колкав е капацитетот на резервоарот?','Колку степени има 7DCT менувачот?','Дали Premium има камера 360?','Со колку вати е безжичното полнење?','Димензии на гуми','Греење на волан','Амбиентално осветлување','Панорамски покрив'];
const el=id=>document.getElementById(id), thread=el('thread'), input=el('question'), send=el('send'), clear=el('clear');
const fitment={provisional:'Европското MY25 упатство е привремен извор; применливоста за MY2026 не е целосно потврдена.',higher_trim:'Спецификацијата не ја потврдува опремата на поединечно возило.',listed_standard:'Наведено како стандардна опрема во локалната спецификација.',listed_specification:'Податок од локалната спецификација, не потврда за поединечно возило.',optional:'Опционална опрема; провери ја конфигурацијата на конкретното возило.'};
const reasons={unconfirmed_feature:'Функцијата не е потврдена во достапните извори.',no_curated_topic:'Прашањето не е опфатено во пробниот модул.',multiple_topics_require_clarification:'Постави едно прашање за една тема.',outside_pilot_scope:'Прашањето е надвор од проверените теми или формулации.'};
let busy=false;
function add(tag,text,parent,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;}
function message(kind,label,text){const n=add('article','',thread,'message '+kind);add('strong',label,n);if(text)add('p',text,n);return n;}
function state(value){busy=value;send.disabled=value;clear.disabled=value;input.disabled=value;el('suggestions').querySelectorAll('button').forEach(b=>b.disabled=value);send.textContent=value?'Се бара…':'Испрати';}
function reveal(n){n.scrollIntoView({block:'nearest'});}
for(const q of questions){const b=add('button',q,el('suggestions'));b.type='button';b.addEventListener('click',()=>{if(!busy){input.value=q;el('ask-form').requestSubmit();}});}
clear.addEventListener('click',()=>{if(!busy){thread.replaceChildren();input.value='';input.focus();}});
el('ask-form').addEventListener('submit',async e=>{e.preventDefault();const q=input.value.trim();if(busy||!q||q.length>500)return;state(true);message('user','Ти',q);input.value='';const pending=message('assistant','AI асистент','Се проверуваат изворите…');reveal(pending);
 try{const response=await fetch('/ask',{method:'POST',headers:{'Content-Type':'application/json','X-Tucson-Preview':'1'},body:JSON.stringify({question:q}),signal:AbortSignal.timeout(56000)});if(!response.ok)throw Error(response.status===429?'limit':'unavailable');const result=await response.json();const a=result.answer;if(!a||!Array.isArray(a.claims))throw Error('unavailable');pending.replaceChildren();add('strong',result.localOnly?'Локална проверка':'Gemini 3.5 Flash-Lite',pending);
 if(a.status==='answered'&&a.claims.length){for(const claim of a.claims){add('p',claim.text,pending);add('div','Извор: '+claim.sources.join(' · '),pending,'refs');}if(fitment[result.fitment])add('div',fitment[result.fitment],pending,'meta');}
 else if(a.status==='insufficient'){add('p',reasons[result.reason]??'Нема доволно потврдени информации за одговор.',pending);}else throw Error('unavailable');
 add('div',result.localOnly?'Без повик до Gemini':`AI одговор${Number.isFinite(result.usage)?' · '+result.usage+' токени':''}`,pending,'meta');
 }catch(err){pending.replaceChildren();pending.classList.add('error');add('strong','Одговорот е недостапен',pending);add('p',err.message==='limit'?'Достигнат е привремениот лимит. Обиди се подоцна.':'Не можеше да се добие валиден одговор. Провери ја врската или обиди се подоцна.',pending);input.value=q;}
 finally{state(false);reveal(pending);input.focus();}});
