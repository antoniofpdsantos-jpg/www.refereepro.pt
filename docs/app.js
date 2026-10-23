(() => {
  'use strict';
  const L=window.RefereeLogic, P=window.RefereePdf;
  const STORAGE='refereepro.pwa.v1';
  const raw=(()=>{try{return JSON.parse(localStorage.getItem(STORAGE))||{}}catch{return {}}})();
  let draft={...L.DEFAULT,...raw.draft};
  let tab='Jogo';
  let watchIp=raw.watchIp||'';
  let pin='';
  let reportData=raw.reportData||null;
  let notice='';
  let lastUrl='';
  const el=document.getElementById('app'),toast=document.getElementById('toast');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanRoster=x=>Array.isArray(x)?x.join(', '):(x||'');
  const field=(id,label,value,opts={})=>`<div class="field"><label for="${id}">${esc(label)}</label>${opts.multiline?`<textarea id="${id}" data-field="${id}" ${opts.placeholder?`placeholder="${esc(opts.placeholder)}"`:''}>${esc(cleanRoster(value))}</textarea>`:`<input id="${id}" data-field="${id}" type="${opts.type||'text'}" value="${esc(value)}" ${opts.min?`min="${opts.min}"`:''} ${opts.max?`max="${opts.max}"`:''} ${opts.placeholder?`placeholder="${esc(opts.placeholder)}"`:''} autocomplete="off"/>`}</div>`;
  const pillGroup=(key,items,labels)=>`<div class="pills">${items.map((v,i)=>`<button class="pill" type="button" data-choice="${key}" data-value="${esc(v)}" aria-pressed="${draft[key]==v}">${esc(labels?labels[i]:v)}</button>`).join('')}</div>`;
  const card=inner=>`<section class="card">${inner}</section>`;
  const button=(id,text,color='')=>`<button type="button" class="button ${color}" data-action="${id}">${text}</button>`;
  const summary=d=>d?{m:d.match,txt:d.report}:null;
  function save(){try{localStorage.setItem(STORAGE,JSON.stringify({draft,watchIp,reportData}))}catch(e){show('Armazenamento do iPhone indisponível. Faz uma cópia dos dados.',true)}}
  function show(msg,error=false){toast.textContent=msg;toast.hidden=false;toast.className='toast'+(error?' error':'');clearTimeout(show.timeout);show.timeout=setTimeout(()=>toast.hidden=true,6500)}
  function goto(next){tab=next;render();window.scrollTo(0,0)}
  function render(){
    document.querySelectorAll('[data-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.tab===tab));});
    let html='';
    if(tab==='Jogo')html=
      card(`<h2>Preparar o jogo</h2><p class="mini">Configura o escalão e o regulamento antes de enviar o jogo para o relógio.</p><p class="subheading">Escalão</p>${pillGroup('category',L.CATEGORIES)}<hr class="divider"><p class="subheading">Formato de jogo</p>${pillGroup('maxStarters',L.FORMATS,L.FORMATS.map(n=>'Futebol '+n))}${field('minutesPerHalf','Minutos por parte',draft.minutesPerHalf,{type:'number',min:5,max:90})}<p class="mini">Para um jogo de 90 minutos, seleciona 45 minutos por parte.</p><hr class="divider"><p class="subheading">Regulamento de substituições</p>${pillGroup('regulation',L.REGULATIONS)}`)+
      card(`<h2>Próximo passo</h2><p class="mini">Indica as equipas e os números dos jogadores. O número de titulares é validado pelo formato de jogo escolhido.</p>${button('next-teams','Configurar equipas →')}`)+
      card(`<h2>Cópia de segurança</h2><p class="mini">Podes guardar a configuração num ficheiro e recuperá-la se o Safari apagar os dados locais.</p>${button('save-setup','Guardar cópia de segurança','outline')}<div class="field"><label for="setup-file">Restaurar configuração</label><input id="setup-file" type="file" accept=".referee,.json,application/json"/></div>`);
    if(tab==='Equipas')html=['home','away'].map((side,index)=>card(`<h2>${index===0?'Equipa local':'Equipa visitante'}</h2>${field(side,'Nome da equipa',draft[side])}<p class="subheading">Cor do equipamento</p><div class="colors">${L.KITS.map((name,i)=>`<button class="kit" style="background:${L.KIT_HEX[i]}" type="button" data-kit="${side}Kit" data-value="${i}" aria-pressed="${draft[side+'Kit']==i}" aria-label="${esc(name)}" title="${esc(name)}"></button>`).join('')}</div><p class="mini">${esc(L.KITS[draft[side+'Kit']]||L.KITS[0])}</p>`)).join('')+card(button('next-players','Definir jogadores →'));
    if(tab==='Jogadores')html=['home','away'].map((side,index)=>card(`<h2>${index===0?esc(draft.home):esc(draft.away)}</h2>${field(side+'Starters',`Titulares (máximo ${draft.maxStarters})`,draft[side+'Starters'],{multiline:true,placeholder:'1, 2, 3, 4, 5...'})}${field(side+'Bench','Suplentes',draft[side+'Bench'],{multiline:true,placeholder:'12, 13, 14...'})}<p class="mini">Separa os números por vírgulas ou espaços. O mesmo número não pode estar em campo e no banco.</p>`)).join('')+card(button('validate','Validar jogadores','outline')+button('next-link','Ligar ao relógio →'));
    if(tab==='Ligação')html=card(`<h2>Ligação ao Galaxy Watch4</h2><p class="mini">No relógio abre <b>LIGAR IPHONE</b>. Liga o iPhone e o relógio à mesma rede Wi-Fi.</p>${field('watchIp','IP indicado no relógio',watchIp,{placeholder:'192.168.1.25'})}${field('pin','PIN de 6 dígitos',pin,{type:'text',placeholder:'123456'})}<div class="button-row">${button('send-watch','Enviar jogo ao relógio')}${button('receive-pdf','RECEBER RELATÓRIO PDF','blue')}</div><div id="watch-link"></div>`)+
      card(`<h2>Transferir o relatório</h2><p class="mini"><b>1.</b> Termina o jogo no relógio e abre LIGAR IPHONE.</p><p class="mini"><b>2.</b> Toca em <b>RECEBER RELATÓRIO PDF</b> acima.</p><p class="mini"><b>3.</b> O PDF abre no Safari. Usa <b>Partilhar → Guardar em Ficheiros</b> para o guardar no iPhone.</p><div class="note">O PDF é preparado no relógio e aberto no iPhone pela rede Wi-Fi. Mantém o ecrã LIGAR IPHONE aberto durante a transferência.</div>`);
    if(tab==='Relatório'){
      const data=summary(reportData),match=data?.m,events=Array.isArray(match?.events)?match.events:[];
      html=card(`<h2>Relatório final em PDF</h2><p class="mini">No relógio, termina a partida e abre <b>LIGAR IPHONE</b>. Depois carrega neste botão para abrir logo o PDF no iPhone.</p>${button('receive-pdf','RECEBER PDF DO RELÓGIO','blue')}<p class="mini">Se aparecer uma mensagem sobre IP ou PIN, introduz os dados no separador <b>Ligação</b> e volta a este ecrã.</p><p class="mini">No Safari, escolhe <b>Partilhar → Guardar em Ficheiros</b>. Também podes enviar o PDF por WhatsApp, email ou AirDrop.</p>`)+
        (match?card(`<h2>Último relatório guardado</h2><div class="score"><div class="score-status">${match.isFinished?'JOGO TERMINADO':'RELATÓRIO PROVISÓRIO'}</div><div class="score-line"><div class="score-team">${esc(match.home)}</div><div class="score-result">${L.goalCount(match,0)} – ${L.goalCount(match,1)}</div><div class="score-team">${esc(match.away)}</div></div><div class="score-caption">${events.length} acontecimentos</div></div>${button('pdf','Guardar este PDF','outline')}`):'')+
        (data?.txt&&!match?card(`<h2>Relatório guardado</h2><div class="report-box">${esc(data.txt)}</div>${button('pdf','Guardar este PDF','outline')}`):'')+
        '';
    }
    el.innerHTML=html;
  }
  function requireConnection(){const ip=watchIp.trim();if(!L.isLanIp(ip)||!/^\d{6}$/.test(pin))throw Error('Confirma o IP Wi-Fi e o PIN de 6 dígitos no relógio.');return ip;}
  function openWatch(url){lastUrl=url;const w=window.open(url,'_blank');if(!w)show('O iPhone bloqueou a abertura automática. Usa a ligação apresentada no ecrã.');const container=document.getElementById('watch-link');if(container)container.innerHTML=`<div class="note"><p>Se a página não abriu, toca nesta ligação:</p><a class="button yellow" target="_blank" href="${esc(url)}">Abrir página do relógio ↗</a></div>`;}
  function receive(data){try{const d=L.importSnapshot(data);if(!d.match&&!d.report)throw Error('O ficheiro não contém registos.');reportData=d;save();goto('Relatório');show('Relatório recebido e guardado neste iPhone.')}catch(e){show(e.message,true)}}
  async function handleAction(action){try{
    switch(action){
      case 'next-teams':goto('Equipas');break;
      case 'save-setup':downloadBlob(new Blob([JSON.stringify({draft},null,2)],{type:'application/json'}),'referee-pro-configuracao.referee');break;
      case 'next-players':goto('Jogadores');break;
      case 'next-link':goto('Ligação');break;
      case 'validate':L.validateDraft(draft);show('Os números estão válidos para o formato escolhido.');break;
      case 'send-watch':{const ip=requireConnection(),payload=L.buildPayload(draft);openWatch(L.urlForWatch(ip,pin,'import',payload));break;}
      case 'receive-pdf':{const ip=requireConnection();openWatch(L.urlForWatch(ip,pin,'report-pdf'));break;}
      case 'receive-report':{const ip=requireConnection();openWatch(L.urlForWatch(ip,pin,'report-pdf'));break;}
      case 'pdf':{if(!reportData)throw Error('Primeiro importa o relatório.');const buffer=P.pdfOf(reportData.match,reportData.report);const blob=new Blob([buffer],{type:'application/pdf'});const filename='RefereePro_'+(reportData.match?.home||'Relatorio').replace(/[^a-zA-Z0-9-_]/g,'_')+'.pdf';if(navigator.share&&typeof File!=='undefined'){const file=new File([blob],filename,{type:'application/pdf'});if(!navigator.canShare||navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Referee Pro — Relatório'});break;}catch(e){if(e.name==='AbortError')break;}}}downloadBlob(blob,filename);show('PDF criado. Podes encontrá-lo nas transferências do Safari/Ficheiros.');break;}
    }
  }catch(e){show(e.message,true)}}
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),12000)}
  document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)goto(b.dataset.tab)});
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action)handleAction(b.dataset.action);if(b.dataset.choice){const value=b.dataset.choice==='maxStarters'?Number(b.dataset.value):b.dataset.value;draft[b.dataset.choice]=value;if(b.dataset.choice==='category')draft.minutesPerHalf=L.defaultMinutes(value);save();render();}if(b.dataset.kit){draft[b.dataset.kit]=Number(b.dataset.value);save();render()}});
  el.addEventListener('input',e=>{const id=e.target.dataset.field;if(!id)return;let v=e.target.value;if(id==='watchIp'){watchIp=v.trim();save();return;}if(id==='pin'){pin=v.replace(/\D/g,'').slice(0,6);if(v!==pin)e.target.value=pin;return;}draft[id]=id==='minutesPerHalf'?v:v;save();});
  el.addEventListener('change',async e=>{if(e.target.id==='setup-file'&&e.target.files[0]){try{const f=e.target.files[0];if(f.size>100000)throw Error('Ficheiro demasiado grande.');const loaded=JSON.parse(await f.text());const d=loaded.draft||loaded;const restored={...L.DEFAULT,...d};L.validateDraft(restored);draft=restored;save();render();show('Configuração recuperada!')}catch(err){show(err.message,true)}}});
  window.addEventListener('message',event=>{try{if(event.origin!==`http://${watchIp.trim()}:8765`)return;if(event.data?.type==='REFEREE_PRO_REPORT'){
    receive(event.data.data);
    try{event.source?.postMessage({type:'REFEREE_PRO_REPORT_ACK'},event.origin);}catch(_){}
  }}catch(e){show(e.message,true)}});
  function connectivity(){document.getElementById('connectivity').textContent=navigator.onLine?'PRONTO':'OFFLINE'}
  window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity);connectivity();
  if('serviceWorker'in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)))navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
})();
