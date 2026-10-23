/* Lógica partilhável, sem dependências nem serviços externos. */
(function(root,factory){ if(typeof module==='object'&&module.exports)module.exports=factory(); else root.RefereeLogic=factory(); })(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CATEGORIES=['Petizes','Traquinas','Benjamins','Infantis','Iniciados','Juvenis','Juniores','Seniores','Personalizado'];
  const REGULATIONS=['5 substituições / 3 paragens','3 substituições','Ilimitadas'];
  const FORMATS=[5,7,9,11];
  const KITS=['Branco','Vermelho','Azul claro','Azul escuro','Verde','Verde escuro','Amarelo','Laranja','Roxo','Rosa','Bordô','Cinzento','Preto','Turquesa','Castanho','Azul cinzento'];
  const KIT_HEX=['#ffffff','#e53d45','#347ef5','#164a9a','#15a05c','#0b6c49','#ffc400','#ff7f21','#9b43cf','#ee489b','#802226','#888992','#222222','#15b6ae','#70482f','#707c91'];
  const DEFAULT={category:'Juvenis',maxStarters:11,minutesPerHalf:45,regulation:REGULATIONS[0],home:'LOCAL',away:'VISITANTE',homeKit:1,awayKit:2,homeStarters:'',awayStarters:'',homeBench:'',awayBench:''};
  const defaultMinutes=cat=>({Petizes:20,Traquinas:20,Benjamins:30,Infantis:30,Iniciados:35,Juvenis:40}[cat]??45);
  function parseNumbers(value){
    const clean=[];
    const list=Array.isArray(value)?value.map(String):(String(value||'').split(/[\s,;\n]+/).filter(Boolean));
    for(const raw of list){const piece=String(raw).trim();if(!/^\d{1,2}$/.test(piece)||+piece<1||+piece>99)throw Error(`Número inválido: ${piece}. Utiliza números entre 1 e 99.`);const n=String(+piece);if(clean.includes(n))throw Error(`O jogador #${n} está repetido.`);clean.push(n)}return clean;
  }
  function validateDraft(d){
    const result={...d};
    if(!FORMATS.includes(Number(d.maxStarters)))throw Error('Formato inválido.');
    if(!REGULATIONS.includes(d.regulation))throw Error('Regulamento inválido.');
    if(!Number.isInteger(Number(d.minutesPerHalf))||+d.minutesPerHalf<5||+d.minutesPerHalf>90)throw Error('A duração deve estar entre 5 e 90 minutos.');
    if(!String(d.home||'').trim()||!String(d.away||'').trim())throw Error('Indica o nome das duas equipas.');
    for(const s of ['home','away']){
      const a=parseNumbers(d[`${s}Starters`]), b=parseNumbers(d[`${s}Bench`]);
      const label=s==='home'?'local':'visitante';
      if(a.length===0)throw Error(`Adiciona os titulares da equipa ${label}.`);
      if(a.length>+d.maxStarters)throw Error(`A equipa ${label} excede ${d.maxStarters} titulares.`);
      if(a.some(n=>b.includes(n)))throw Error(`Um jogador está nos titulares e no banco da equipa ${label}.`);
      result[`${s}Starters`]=a;result[`${s}Bench`]=b;
    }
    return {...result,maxStarters:Number(result.maxStarters),minutesPerHalf:Number(result.minutesPerHalf),home:String(result.home).trim().slice(0,48),away:String(result.away).trim().slice(0,48)};
  }
  function buildPayload(d){return {...validateDraft(d),lineupVersion:2,elapsedMs:0,startedAtMs:0,running:false,hasStarted:false,half:'1.ª parte',homeSubWindows:0,awaySubWindows:0,isFinished:false,events:[]};}
  function importSnapshot(data){
    if(typeof data==='string'){try{data=JSON.parse(data)}catch(_){return {match:null,report:String(data)}}}
    if(!data||typeof data!=='object')throw Error('Não foi encontrado um relatório válido.');
    const match=data.match&&typeof data.match==='object'?data.match:(data.events&&typeof data.home==='string'?data:null);
    if(match&&(!Array.isArray(match.events)||typeof match.away!=='string'))throw Error('Dados incompletos no relatório.');
    return {match,report:typeof data.report==='string'?data.report:''};
  }
  function goalCount(match,side){return (match?.events||[]).filter(e=>e.kind==='GOLO'&&Number(e.side)===side).length;}
  function eventLabel(e){const n=e.number?`#${e.number}`:'';switch(e.kind){case'GOLO':return `Golo ${n}`;case'AMARELO':return `Cartão amarelo ${n}`;case'VERMELHO':return `Cartão vermelho ${n}`;case'SUBSTITUIÇÃO':return `Sai ${n||'—'} · Entra ${e.numberIn?'#'+e.numberIn:'—'}`;default:return `${e.kind||'Acontecimento'} ${n}`.trim()}}
  function describeEvent(e,match){return {minute:`${Number(e.minute)||0}'`,half:e.half||'—',team:Number(e.side)===0?(match.home||'Local'):(match.away||'Visitante'),label:eventLabel(e),detail:[['AMARELO','VERMELHO'].includes(e.kind)?(e.location==='BANCO'?'Banco':'Campo'):'',e.reason||''].filter(Boolean).join(' · ')}};
  function isLanIp(ip){const m=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(String(ip).trim());if(!m||m.slice(1).some(n=>+n>255))return false;const a=m.slice(1).map(Number);return a[0]===10||(a[0]===172&&a[1]>=16&&a[1]<=31)||(a[0]===192&&a[1]===168);}
  function urlForWatch(ip,pin,method,data){if(!isLanIp(ip))throw Error('Indica o IP Wi-Fi privado mostrado no relógio (ex.: 192.168.1.20).');if(!/^\d{6}$/.test(pin))throw Error('O PIN deve ter 6 dígitos.');let url=`http://${ip}:8765/web-${method}?pin=${encodeURIComponent(pin)}`;if(method==='import')url+=`&data=${encodeURIComponent(JSON.stringify(data))}`;if(url.length>14000)throw Error('Os dados são demasiado grandes para este método de transferência.');return url;}
  return {DEFAULT,CATEGORIES,REGULATIONS,FORMATS,KITS,KIT_HEX,defaultMinutes,parseNumbers,validateDraft,buildPayload,importSnapshot,goalCount,eventLabel,describeEvent,isLanIp,urlForWatch};
});
