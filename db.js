"use strict";
/* ---------- Base de datos (IndexedDB) ---------- */
let db;
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open('manuales',1);r.onupgradeneeded=()=>r.result.createObjectStore('fichas',{keyPath:'id'});r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error)})}
const store=m=>db.transaction('fichas',m).objectStore('fichas');
const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const dbAll=()=>rq(store('readonly').getAll());
const dbGet=id=>rq(store('readonly').get(id));
const dbPut=f=>rq(store('readwrite').put(f));
const dbDel=id=>rq(store('readwrite').delete(id));

