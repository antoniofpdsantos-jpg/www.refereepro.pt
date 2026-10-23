/* Gerador PDF A4 local, sem bibliotecas externas, baseado em fontes PDF padrão. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RefereePdf=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const W=595.28,H=841.89,M=45;
  function cp1252(c){const code=c.codePointAt(0);if(code>=32&&code<=126)return code;if(code>=160&&code<=255)return code;return ({0x20ac:128,0x201a:130,0x0192:131,0x201e:132,0x2026:133,0x2020:134,0x2021:135,0x02c6:136,0x2030:137,0x0160:138,0x2039:139,0x0152:140,0x017d:142,0x2018:145,0x2019:146,0x201c:147,0x201d:148,0x2022:149,0x2013:150,0x2014:151,0x02dc:152,0x2122:153,0x0161:154,0x203a:155,0x0153:156,0x017e:158,0x0178:159})[code]||63;}
  function pdfStr(s){return Array.from(String(s??'')).map(c=>{const n=cp1252(c);if(n===40||n===41||n===92)return '\\'+String.fromCharCode(n);if(n<32||n>126)return '\\'+n.toString(8).padStart(3,'0');return c;}).join('');}
  function wrap(text,max=91){let lines=[];for(const par of String(text).split(/\r?\n/)){if(!par.trim()){lines.push('');continue;}let current='';for(const word of par.trim().split(/\s+/)){if((current+' '+word).trim().length<=max){current=(current+' '+word).trim()}else{if(current)lines.push(current);if(word.length<=max)current=word;else{let left=word;while(left.length>max){lines.push(left.slice(0,max));left=left.slice(max)}current=left}}}lines.push(current)}return lines;}
  function pdfOf(match,reportText){const pages=[];let parts=[],y=H-48,pageNo=0;
    function draw(s){parts.push(s)}
    function rgb(r,g,b){draw(`${r} ${g} ${b} rg`)}
    function rect(x,yy,w,h,r,g,b){rgb(r,g,b);draw(`${x} ${yy} ${w} ${h} re f`)}
    function textAt(t,x,yy,size=10,bold=false,r=.12,g=.18,b=.14){rgb(r,g,b);draw(`BT /${bold?'FB':'FR'} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${yy.toFixed(1)} Tm (${pdfStr(t)}) Tj ET`)}
    function start(){if(parts.length)pages.push(parts.join('\n'));parts=[];pageNo++;rect(0,H-8,W,8,.12,.66,.32);textAt('REFEREE PRO',M,H-40,21,true);textAt('RELATÓRIO DE JOGO',M,H-59,9,true,.26,.45,.32);y=H-90;}
    function foot(){draw('0.75 0.80 0.76 RG');draw(`${M} 47 m ${W-M} 47 l S`);textAt('Referee Pro  |  Registo informativo. Não substitui a ata oficial.',M,33,8,false,.48,.55,.5);textAt(`Pág. ${pageNo}`,W-M-40,33,8,false,.48,.55,.5);}
    function ensure(n){if(y-n<66){foot();start()}}
    function heading(t){ensure(33);rect(M,y-4,W-2*M,23,.91,.96,.92);textAt(t,M+10,y+2,12,true,.10,.35,.19);y-=35;}
    function lines(text,size=10,weight=false,leading=15){const limit=size>10?80:99;for(const line of wrap(text,limit)){ensure(leading);textAt(line,M+4,y,size,weight);y-=leading;}}
    start();
    let title='RELATÓRIO PROVISÓRIO';
    if(match&&typeof match==='object'){
      title=match.isFinished?'JOGO TERMINADO':'RELATÓRIO PROVISÓRIO';
      textAt(title,M,y,10,true,.10,.5,.24);y-=21;
      const events=Array.isArray(match.events)?match.events:[];
      const homeGoals=events.filter(e=>e.kind==='GOLO'&&Number(e.side)===0).length;
      const awayGoals=events.filter(e=>e.kind==='GOLO'&&Number(e.side)===1).length;
      rect(M,y-71,W-2*M,82,.93,.97,.94);
      textAt(`${match.home||'LOCAL'}     ${homeGoals}  -  ${awayGoals}     ${match.away||'VISITANTE'}`,M+12,y-28,17,true);y-=97;
      lines(`${match.category||'Escalão não indicado'}  |  Futebol ${match.maxStarters||'—'}  |  ${match.minutesPerHalf||'—'} min/parte`);
      lines(`Substituições: ${match.regulation||'não indicado'}`);
      y-=10;
      heading('ALINHAMENTOS');
      for(const [side,team] of [['home',match.home||'Local'],['away',match.away||'Visitante']]){
        ensure(48);textAt(team,M+4,y,11,true);y-=17;
        lines('Titulares: '+(match[side+'Starters']||[]).map(n=>'#'+n).join(', '));
        lines('Suplentes: '+(match[side+'Bench']||[]).map(n=>'#'+n).join(', '));y-=7;
      }
      lines(`Paragens: ${match.home||'Local'} ${Number(match.homeSubWindows)||0} · ${match.away||'Visitante'} ${Number(match.awaySubWindows)||0}`);
      y-=10;heading(`ACONTECIMENTOS (${events.length})`);
      if(!events.length)lines('Sem acontecimentos registados.');
      for(const e of events){
        const kind=e.kind==='GOLO'?'Golo':e.kind==='AMARELO'?'Cartão amarelo':e.kind==='VERMELHO'?'Cartão vermelho':e.kind==='SUBSTITUIÇÃO'?'Substituição':String(e.kind||'Acontecimento');
        const num=e.number?' #'+e.number:'';
        const substitution=e.kind==='SUBSTITUIÇÃO'?` · Entra #${e.numberIn||'?'} `:'';
        const team=Number(e.side)===0?(match.home||'Local'):(match.away||'Visitante');
        ensure(40);textAt(`${Number(e.minute)||0}'  ${kind}${num}${substitution}`,M+4,y,11,true,.10,.40,.22);y-=15;
        const extra=[team,e.half||'',e.location==='BANCO'?'Banco':'',e.reason||''].filter(Boolean).join('  ·  ');
        lines(extra,9,false,13);y-=9;
        draw('.82 .87 .83 RG');draw(`${M} ${y+3} m ${W-M} ${y+3} l S`);y-=13;
      }
    }else{
      lines('RELATÓRIO RECEBIDO EM TEXTO',11,true);y-=8;
      heading('REGISTO');
      for(const line of String(reportText||'Sem dados').split(/\r?\n/))lines(line,10,false,15);
    }
    foot();pages.push(parts.join('\n'));
    const objs=[''];function add(v){objs.push(v);return objs.length-1;}
    const catalog=add('');const pagesRef=add('');
    const regular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const pageRefs=[];
    for(const body of pages){const stream=add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
      pageRefs.push(add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /FR ${regular} 0 R /FB ${bold} 0 R >> >> /Contents ${stream} 0 R >>`));}
    objs[pagesRef]=`<< /Type /Pages /Count ${pageRefs.length} /Kids [${pageRefs.map(n=>`${n} 0 R`).join(' ')}] >>`;
    objs[catalog]=`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`;
    let out='%PDF-1.4\n%RefereePro\n';const offsets=[0];
    for(let i=1;i<objs.length;i++){offsets[i]=out.length;out+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}
    const xref=out.length;out+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;
    for(let i=1;i<objs.length;i++)out+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    out+=`trailer\n<< /Size ${objs.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Uint8Array(Array.from(out,c=>c.charCodeAt(0)));
  }
  return {pdfOf,wrap,pdfStr};
});
