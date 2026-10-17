"use strict";
const app=document.getElementById('app');
function el(tag,props,...kids){
  const e=document.createElement(tag);
  for(const [k,v] of Object.entries(props||{})){
    if(k==='class')e.className=v;
    else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);
    else if(['value','hidden','disabled','selected'].includes(k))e[k]=v;
    else e.setAttribute(k,v);
  }
  for(const c of kids.flat()){if(c==null)continue;e.append(c.nodeType?c:document.createTextNode(c));}
  return e;
}
const fmt=d=>new Date(d).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'});
let tt;function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2800);}

/* ---------- Tags ---------- */
const DEF=['ELECTRICO','TI','OPERACION','DIAGNOSTICO','COTIZACION'];
function getTags(){try{const t=JSON.parse(localStorage.getItem('tags'));if(Array.isArray(t)&&t.length)return t}catch(e){}return DEF.slice()}
function saveTags(t){try{localStorage.setItem('tags',JSON.stringify(t))}catch(e){}}
function tagSelect(sel,opts){
  opts=opts||{};const all=!!opts.all;
  const s=el('select');let last;
  const fill=v=>{
    s.innerHTML='';
    if(all)s.append(el('option',{value:''},'Todos los tags'));
    getTags().forEach(t=>s.append(el('option',{value:t},t)));
    if(!all)s.append(el('option',{value:'__add'},'+ AGREGAR tag...'));
    s.value=(v===undefined||v===null)?(all?'':getTags()[0]):v;
    if(s.value!==v&&v!==undefined&&v!==null)s.value=all?'':getTags()[0];
    last=s.value;
  };
  fill(sel);
  s.addEventListener('change',()=>{
    if(s.value==='__add'){
      const n=(prompt('Nombre del nuevo tag:')||'').trim().toUpperCase();
      if(n){const t=getTags();if(!t.includes(n)){t.push(n);saveTags(t);}fill(n);}else fill(last);
    }
    last=s.value;
    if(opts.onchange)opts.onchange(s.value);
  });
  return s;
}

/* ---------- Imagen ---------- */
function readImg(file){return new Promise((res,rej)=>{
  const fr=new FileReader();
  fr.onload=()=>{const im=new Image();
    im.onload=()=>{const M=1280,k=Math.min(1,M/Math.max(im.width,im.height));
      const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
      c.getContext('2d').drawImage(im,0,0,c.width,c.height);
      res({data:c.toDataURL('image/jpeg',.8),w:c.width,h:c.height});};
    im.onerror=rej;im.src=fr.result;};
  fr.onerror=rej;fr.readAsDataURL(file);
})}

/* ---------- Navegación ---------- */
let cur=null;const hist=[];const views={};
function go(v,a){if(cur)hist.push(cur);cur=[v,a];draw();}
function replace(v,a){cur=[v,a];draw();}
function back(){cur=hist.pop()||['home'];draw();}
function draw(){
  app.innerHTML='';window.scrollTo(0,0);
  document.getElementById('back').hidden=(cur[0]==='home');
  Promise.resolve(views[cur[0]](cur[1])).catch(e=>{console.error(e);toast('Error: '+e.message)});
}
document.getElementById('back').onclick=back;
function setTitle(t){document.getElementById('ttl').textContent=t}

/* ---------- Inicio ---------- */
views.home=()=>{
  setTitle('Manuales Rápidos');
  app.append(
    el('p',{class:'lead'},'Crea manuales paso a paso con fotos y descripciones simples. Lo esencial, de lo básico a lo complejo.'),
    el('button',{class:'btn big',onclick:()=>go('datos')},'+ Agregar manual'),
    el('button',{class:'btn big alt',onclick:()=>go('consulta')},'Consultar manuales')
  );
};

/* ---------- Datos de la ficha (nuevo / editar) ---------- */
views.datos=async id=>{
  const f=id?await dbGet(id):null;
  setTitle(f?'Editar datos':'Nuevo manual');
  const ti=el('input',{type:'text',placeholder:'Ej. Cambio de sensor de presión',value:f?f.titulo:''});
  const es=el('textarea',{placeholder:'Describe el escenario en pocas palabras: ¿qué pasa y qué se quiere lograr?'},f?f.escenario:'');
  const tg=tagSelect(f?f.tag:undefined);
  app.append(el('div',{class:'card'},
    el('label',{class:'f'},'Título'),ti,
    el('label',{class:'f'},'Descripción simple del escenario'),es,
    el('label',{class:'f'},'Tag'),tg,
    el('p',{class:'meta'},'La fecha y hora se guardan automáticamente.'),
    el('button',{class:'btn',onclick:async()=>{
      if(!ti.value.trim()){toast('Falta el título');return}
      if(tg.value==='__add'){toast('Elige un tag');return}
      let g=f;
      if(g){g.titulo=ti.value.trim();g.escenario=es.value.trim();g.tag=tg.value;}
      else g={id:Date.now(),titulo:ti.value.trim(),escenario:es.value.trim(),tag:tg.value,creado:new Date().toISOString(),estado:'borrador',pasos:[]};
      g.actualizado=new Date().toISOString();
      await dbPut(g);toast('Guardado');
      replace('ficha',g.id);
    }},f?'Guardar cambios':'Continuar a los pasos')
  ));
};

/* ---------- Formulario de paso ---------- */
function stepForm(f,i){
  const nuevo=i<0;
  const p=nuevo?{}:f.pasos[i];
  const n=nuevo?f.pasos.length+1:i+1;
  let foto=p.foto||null,w=p.w,h=p.h;
  const prev=el('img',{class:'foto'});if(foto)prev.src=foto;else prev.hidden=true;
  const onFile=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{const r=await readImg(file);foto=r.data;w=r.w;h=r.h;prev.src=foto;prev.hidden=false;}catch(x){toast('No se pudo leer la foto')}
    e.target.value='';
  };
  const cam=el('input',{type:'file',accept:'image/*',capture:'environment',onchange:onFile});
  const gal=el('input',{type:'file',accept:'image/*',onchange:onFile});
  const ds=el('textarea',{placeholder:'Primeros principios: ¿qué es lo esencial de este paso? ¿qué ves, para qué sirve y por qué se hace así?'},p.desc||'');
  const box=el('div',{class:'card',style:'border:2px solid #99f6e4'},
    el('h3',{},'PASO '+n+(nuevo?' (nuevo)':' (editando)')),
    el('div',{class:'pic'},
      el('label',{class:'btn alt'},'📷 Cámara',cam),
      el('label',{class:'btn gris'},'🖼 Galería',gal)),
    prev,ds,
    el('div',{class:'row'},
      el('button',{class:'btn',onclick:async()=>{
        if(!foto){toast('Agrega una foto');return}
        if(!ds.value.trim()){toast('Agrega una descripción');return}
        if(nuevo)f.pasos.push({id:Date.now(),foto,w,h,desc:ds.value.trim(),fecha:new Date().toISOString()});
        else{Object.assign(p,{foto,w,h,desc:ds.value.trim(),editado:new Date().toISOString()});}
        f.actualizado=new Date().toISOString();f.estado='borrador';
        await dbPut(f);toast('Paso guardado');replace('ficha',f.id);
      }},'Guardar paso'),
      nuevo?null:el('button',{class:'btn gris',onclick:()=>replace('ficha',f.id)},'Cancelar')
    ));
  return box;
}

/* ---------- Ficha (manual) ---------- */
views.ficha=async id=>{
  const f=await dbGet(id);if(!f){back();return}
  setTitle('Manual');
  app.append(el('div',{class:'card'},
    el('h2',{},f.titulo),
    el('div',{class:'meta'},
      el('span',{class:'chip'},f.tag),
      el('span',{class:'chip '+(f.estado==='final'?'fin':'bor')},f.estado==='final'?'FINAL':'BORRADOR'),
      ' ',fmt(f.creado)),
    f.escenario?el('p',{},f.escenario):null,
    el('div',{class:'row'},
      el('button',{class:'btn gris',onclick:()=>go('datos',f.id)},'Editar datos'),
      el('button',{class:'btn rojo',onclick:async()=>{
        if(confirm('¿Eliminar este manual completo?')){await dbDel(f.id);toast('Manual eliminado');back();}
      }},'Eliminar manual'))
  ));
  f.pasos.forEach((p,i)=>{
    const card=el('div',{class:'card'},
      el('h3',{},'PASO '+(i+1)),
      el('div',{class:'meta'},fmt(p.fecha)+(p.editado?' · editado '+fmt(p.editado):'')),
      el('img',{class:'foto',src:p.foto}),
      el('p',{},p.desc),
      el('div',{class:'row'},
        el('button',{class:'btn gris',onclick:()=>card.replaceWith(stepForm(f,i))},'Editar'),
        el('button',{class:'btn rojo',onclick:async()=>{
          if(!confirm('¿Eliminar el PASO '+(i+1)+'?'))return;
          f.pasos.splice(i,1);f.actualizado=new Date().toISOString();await dbPut(f);toast('Paso eliminado');replace('ficha',f.id);
        }},'Eliminar')));
    app.append(card);
  });
  app.append(stepForm(f,-1));
  if(f.pasos.length){
    app.append(el('div',{class:'card'},
      el('h3',{},'Diagrama esquemático'),
      el('img',{class:'foto',src:diagramCanvas(f).toDataURL('image/png')}),
      el('button',{class:'btn',onclick:async()=>{
        f.estado='final';f.actualizado=new Date().toISOString();await dbPut(f);toast('Manual guardado como FINAL');replace('ficha',f.id);
      }},'Finalizar y guardar'),
      el('button',{class:'btn alt',onclick:()=>exportPdf(f)},'Exportar PDF'),
      el('button',{class:'btn alt',onclick:()=>sharePdf(f)},'Compartir por mensaje o correo')
    ));
  }
};

/* ---------- Consulta ---------- */
let filtro='';
views.consulta=async()=>{
  setTitle('Consultar');
  const list=el('div');
  const all=(await dbAll()).sort((a,b)=>new Date(b.creado)-new Date(a.creado));
  const render=()=>{
    list.innerHTML='';
    const r=all.filter(f=>!filtro||f.tag===filtro);
    if(!r.length){list.append(el('div',{class:'empty'},'No hay manuales para mostrar.'));return}
    r.forEach(f=>list.append(el('div',{class:'card item',onclick:()=>go('ficha',f.id)},
      el('h3',{},f.titulo),
      el('div',{class:'meta'},el('span',{class:'chip'},f.tag),el('span',{class:'chip '+(f.estado==='final'?'fin':'bor')},f.estado==='final'?'FINAL':'BORRADOR'),
        ' ',fmt(f.creado),' · ',f.pasos.length+' paso(s)'))));
  };
  app.append(el('label',{class:'f'},'Filtrar por tag (histórico, más recientes primero)'),
    tagSelect(filtro,{all:true,onchange:v=>{filtro=v;render();}}),el('div',{style:'height:14px'}),list);
  render();
};

/* ---------- Diagrama ---------- */
function rrect(x,px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath();}
function wrapLines(x,text,maxW,maxLines){
  const words=text.replace(/\s+/g,' ').trim().split(' ');const lines=[];let l='';
  for(const w of words){const t=l?l+' '+w:w;if(x.measureText(t).width>maxW&&l){lines.push(l);l=w;}else l=t;}
  if(l)lines.push(l);
  if(lines.length>maxLines){lines.length=maxLines;let s=lines[maxLines-1];while(s.length>1&&x.measureText(s+'...').width>maxW)s=s.slice(0,-1);lines[maxLines-1]=s+'...';}
  return lines;
}
function diagramCanvas(f){
  const nodes=[{t:'INICIO',s:f.titulo,c:'#0f766e'}].concat(f.pasos.map((p,i)=>({t:'PASO '+(i+1),s:p.desc,c:'#1d4ed8'})),[{t:'FIN',s:'Manual completado',c:'#15803d'}]);
  const W=700,bw=580,bh=92,gap=38,pad=24,H=pad*2+nodes.length*bh+(nodes.length-1)*gap;
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  nodes.forEach((n,i)=>{
    const y=pad+i*(bh+gap),bx=(W-bw)/2;
    x.fillStyle=n.c;rrect(x,bx,y,bw,bh,14);x.fill();
    x.fillStyle='#fff';x.textAlign='left';x.font='bold 20px sans-serif';x.fillText(n.t,bx+18,y+30);
    x.font='16px sans-serif';
    wrapLines(x,n.s||'',bw-36,2).forEach((ln,k)=>x.fillText(ln,bx+18,y+56+k*22));
    if(i<nodes.length-1){
      const ax=W/2,y1=y+bh,y2=y+bh+gap;
      x.strokeStyle='#334155';x.fillStyle='#334155';x.lineWidth=3;
      x.beginPath();x.moveTo(ax,y1+2);x.lineTo(ax,y2-8);x.stroke();
      x.beginPath();x.moveTo(ax-9,y2-12);x.lineTo(ax+9,y2-12);x.lineTo(ax,y2-1);x.closePath();x.fill();
    }
  });
  return c;
}

/* ---------- PDF ---------- */
function buildPdf(f){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,M=15,CW=W-2*M;let y=M;
  const need=hh=>{if(y+hh>285){doc.addPage();y=M;}};
  doc.setFont('helvetica','bold');doc.setFontSize(20);
  doc.splitTextToSize(f.titulo,CW).forEach(l=>{need(9);doc.text(l,M,y+6);y+=9;});
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(90);
  need(6);doc.text('Tag: '+f.tag+'   |   Fecha: '+fmt(f.creado),M,y+4);y+=8;
  doc.setTextColor(0);doc.setFontSize(11);
  if(f.escenario)doc.splitTextToSize(f.escenario,CW).forEach(l=>{need(6);doc.text(l,M,y+4);y+=5.5;});
  y+=4;
  f.pasos.forEach((p,i)=>{
    need(16);
    doc.setFont('helvetica','bold');doc.setFontSize(15);doc.setTextColor(15,118,110);
    doc.text('PASO '+(i+1),M,y+6);y+=8;
    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(100);
    doc.text(fmt(p.fecha),M,y+3);y+=6;doc.setTextColor(0);
    let iw=CW,ih=iw*p.h/p.w;if(ih>110){ih=110;iw=ih*p.w/p.h;}
    need(ih+4);doc.addImage(p.foto,'JPEG',M,y,iw,ih);y+=ih+4;
    doc.setFontSize(11);
    doc.splitTextToSize(p.desc,CW).forEach(l=>{need(6);doc.text(l,M,y+4);y+=5.5;});
    y+=8;
  });
  doc.addPage();y=M;
  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text('Diagrama esquematico',M,y+6);y+=12;
  const cv=diagramCanvas(f);let dw=CW,dh=dw*cv.height/cv.width;
  if(dh>260){dh=260;dw=dh*cv.width/cv.height;}
  doc.addImage(cv.toDataURL('image/png'),'PNG',M+(CW-dw)/2,y,dw,dh);
  const n=doc.getNumberOfPages();
  for(let k=1;k<=n;k++){doc.setPage(k);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(120);doc.text('Pagina '+k+' de '+n,W-M,292,{align:'right'});}
  const name=(f.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_|_$/g,'')||'manual')+'.pdf';
  return {blob:doc.output('blob'),name};
}
const NATIVE=!!(window.Capacitor&&typeof window.Capacitor.isNativePlatform==='function'&&window.Capacitor.isNativePlatform());
function download(blob,name){const a=el('a',{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);}
function blobB64(b){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]);fr.onerror=rej;fr.readAsDataURL(b)})}
async function nativeShare(f,r){
  const P=window.Capacitor.Plugins;
  if(!P||!P.Filesystem||!P.Share)throw new Error('Plugins nativos no disponibles');
  const data=await blobB64(r.blob);
  const w=await P.Filesystem.writeFile({path:r.name,data:data,directory:'CACHE'});
  await P.Share.share({title:f.titulo,text:f.titulo+' ('+f.tag+')',files:[w.uri],dialogTitle:'Enviar manual en PDF'});
}
async function exportPdf(f){
  if(!window.jspdf){toast('No se cargó el generador de PDF');return}
  const r=buildPdf(f);
  if(NATIVE){
    try{await nativeShare(f,r)}catch(e){const m=String((e&&e.message)||e);if(!/cancel/i.test(m))toast('No se pudo compartir: '+m)}
    return;
  }
  download(r.blob,r.name);toast('PDF generado');
}
async function sharePdf(f){
  if(NATIVE){return exportPdf(f)}
  if(!window.jspdf){toast('No se cargó el generador de PDF');return}
  const r=buildPdf(f);const file=new File([r.blob],r.name,{type:'application/pdf'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:f.titulo,text:f.titulo+' ('+f.tag+')'});return}catch(e){if(e.name==='AbortError')return}
  }
  download(r.blob,r.name);toast('Se descargó el PDF. Adjúntalo en tu correo o mensaje.');
}

/* ---------- Arranque ---------- */
openDB().then(()=>go('home')).catch(()=>{app.textContent='Este navegador no permite guardar datos locales.'});

/* ---------- Service worker (solo web, no en APK) ---------- */
if('serviceWorker' in navigator&&!NATIVE&&/^https?:$/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));}
