import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {webcrypto} from "node:crypto";
import vm from "node:vm";

const source=readFileSync(new URL("../kunden.js",import.meta.url),"utf8");
const clone=(value)=>JSON.parse(JSON.stringify(value));
const wait=(ms=150)=>new Promise(resolve=>setTimeout(resolve,ms));
const initialData=(period="2026-10",overrides={})=>({
  mode:"45b",direct:false,
  fields:{
    customer:"",street:"",city:"",birth:"",insured:"",care:"",payer:"",
    payerAddress:"",month:period,staff:"",rate:"38.50",extra:"0",
    extraName:"Fahrtkosten",invoiceDate:"2026-10-09",
    invoiceNo:"GA-202610-TEST",taxId:"",taxMode:"",customTax:"",
    iban:"",bic:"",dueDays:"14",...overrides
  },
  visits:[]
});

function memoryDatabase(existing){
  const store=existing??{records:new Map(),schema:false};
  const db={
    objectStoreNames:{contains(){return store.schema;}},
    createObjectStore(){store.schema=true;},
    transaction(){
      const tx={oncomplete:null,onerror:null,onabort:null,
        objectStore(){return {
          get(key){
            const req={result:undefined,onsuccess:null,onerror:null};
            setTimeout(()=>{req.result=store.records.get(key);req.onsuccess?.();},0);
            return req;
          },
          put(value,key){
            setTimeout(()=>{store.records.set(key,clone(value));tx.oncomplete?.();},0);
          }
        };}
      };
      return tx;
    }
  };
  const indexedDB={open(){
    const request={result:db,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};
    setTimeout(()=>{
      if(!store.schema)request.onupgradeneeded?.();
      request.onsuccess?.();
    },0);
    return request;
  }};
  return {store,indexedDB};
}

async function boot(database){
  const {store,indexedDB}=memoryDatabase(database);
  const elements=new Map();
  const body={classList:{add(){},remove(){}},appendChild(){}};
  class Element{
    constructor(id){
      this.id=id;this.value="";this.textContent="";this.innerHTML="";
      this.hidden=false;this.disabled=false;this.dataset={};this.children=[];
      this.files=[];this.handlers={};this.classList={add(){},remove(){},toggle(){}};
    }
    addEventListener(type,handler){
      (this.handlers[type]??=[]).push(handler);
    }
    async emit(type,detail={}){
      for(const handler of this.handlers[type]??[]){
        await handler({
          target:this,
          preventDefault(){},
          stopImmediatePropagation(){},
          ...detail
        });
      }
    }
    replaceChildren(...children){this.children=children;}
    focus(){}
    click(){}
    remove(){}
    querySelector(){return {textContent:""};}
    closest(){return null;}
  }
  const node=(id)=>{
    if(!elements.has(id))elements.set(id,new Element(id));
    return elements.get(id);
  };
  const document={
    getElementById:node,
    createElement:(type)=>new Element(type),
    body
  };
  let current=initialData();
  const app={
    currentMonth(){return "2026-10";},
    freshDocument:(period="2026-10",prefills={})=>initialData(period,prefills),
    restore(data){
      current=clone(data);
      node("month").value=current.fields.month;
      node("customer").value=current.fields.customer;
    },
    snapshot(){return clone(current);}
  };
  const events=new Map();
  const window={
    crypto:webcrypto,
    isSecureContext:true,
    indexedDB,
    GrafschafterApp:app,
    addEventListener(name,cb){events.set(name,cb);}
  };
  const navigator={storage:{persist:async()=>true}};
  const context=vm.createContext({
    window,document,navigator,indexedDB,TextEncoder,TextDecoder,
    URL:{createObjectURL(){return "blob:test";},revokeObjectURL(){}},
    Blob,Date,Math,JSON,Array,Set,Map,Object,Number,String,
    Promise,Error,Uint8Array,setTimeout,clearTimeout,
    queueMicrotask,console,
    btoa:(value)=>Buffer.from(value,"binary").toString("base64"),
    atob:(value)=>Buffer.from(value,"base64").toString("binary"),
    confirm:()=>true,alert:()=>{}
  });
  vm.runInContext(source,context,{timeout:10000});
  await wait(70);
  return {
    node,app,store,events,
    setForm(changes,visits){
      Object.assign(current.fields,changes);
      node("customer").value=current.fields.customer;
      node("month").value=current.fields.month;
      if(visits!==undefined)current.visits=clone(visits);
    },
    getForm:()=>clone(current)
  };
}

async function setupVault(app,password="Grafschafter2026!Streng"){
  app.node("vaultPassword").value=password;
  app.node("vaultConfirm").value=password;
  await app.node("vaultForm").emit("submit");
  assert.equal(app.node("vaultOverlay").hidden,true,app.node("vaultError").textContent);
}
async function unlockVault(app,password="Grafschafter2026!Streng"){
  app.node("vaultPassword").value=password;
  await app.node("vaultForm").emit("submit");
  assert.equal(app.node("vaultOverlay").hidden,true,app.node("vaultError").textContent);
}
test("encrypted saved customers survive reload; months stay independent",async()=>{
  const first=await boot();
  assert.equal(first.node("vaultOverlay").hidden,false);
  await setupVault(first);
  first.setForm({
    customer:"Maria Musterfrau",street:"Musterweg 8",city:"47443 Moers",
    insured:"A123456789",care:"2",payer:"KNAPPSCHAFT",rate:"38.50",
    taxId:"123/456/789",iban:"DE12345678901234567890"
  },[{date:"2026-10-09",start:"09:00",end:"11:30",breakMinutes:0,activity:"Haushaltshilfe"}]);
  await first.node("kundeSpeichern").emit("click");
  assert.match(first.node("kundeAktiv").textContent,/Maria Musterfrau/);
  const ciphertext=JSON.stringify(first.store.records.get("primary"));
  assert.ok(!ciphertext.includes("Maria Musterfrau"),"Kundennamen dürfen nicht im Klartext in IndexedDB stehen");
  assert.ok(!ciphertext.includes("A123456789"),"Versichertennummern dürfen nicht im Klartext in IndexedDB stehen");
  await first.node("naechsterMonat").emit("click");
  await wait(200);
  assert.equal(first.getForm().fields.month,"2026-11");
  assert.equal(first.getForm().visits.length,0);
  first.setForm({staff:"Sokayna",invoiceNo:"GA-202611-001"},
    [{date:"2026-11-10",start:"13:00",end:"16:00",breakMinutes:0,activity:"Betreuung"}]);
  await first.node("kundeSpeichern").emit("click");
  assert.match(first.node("kundeAktiv").textContent,/2 Monatsakten/);
  const second=await boot(first.store);
  assert.equal(second.node("vaultTitle").textContent,"Kundentresor entsperren");
  await unlockVault(second);
  assert.equal(second.getForm().fields.customer,"Maria Musterfrau");
  assert.equal(second.getForm().fields.month,"2026-11");
  assert.equal(second.getForm().visits[0].date,"2026-11-10");
  await second.node("monatsAkten").emit("change",{target:{value:"2026-10"}});
  assert.equal(second.getForm().fields.month,"2026-10");
  assert.equal(second.getForm().visits[0].date,"2026-10-09");
  assert.equal(second.getForm().fields.insured,"A123456789");
  await second.node("monatsAkten").emit("change",{target:{value:"2026-11"}});
  assert.equal(second.getForm().visits[0].date,"2026-11-10");
});

test("incorrect passphrase does not unlock saved customers",async()=>{
  const one=await boot();
  await setupVault(one);
  one.setForm({customer:"Kunde Falschpasswort"});
  await one.node("kundeSpeichern").emit("click");
  const two=await boot(one.store);
  two.node("vaultPassword").value="falsches Passwort 0000";
  await two.node("vaultForm").emit("submit");
  assert.equal(two.node("vaultOverlay").hidden,false);
  assert.match(two.node("vaultError").textContent,/Passphrase falsch/);
  await unlockVault(two);
  assert.equal(two.getForm().fields.customer,"Kunde Falschpasswort");
});

test("deleting a customer removes the encrypted customer record",async()=>{
  const one=await boot();
  await setupVault(one);
  one.setForm({customer:"Löschkunde"});
  await one.node("kundeSpeichern").emit("click");
  await one.node("kundenLoeschen").emit("click");
  assert.match(one.node("kundeAktiv").textContent,/Neuer Kunde/);
  const two=await boot(one.store);
  await unlockVault(two);
  assert.equal(two.node("kundenAuswahl").children.length,1);
  assert.equal(two.getForm().fields.customer,"");
});


test("loading a legacy month file cannot overwrite the previously open customer",async()=>{
  const one=await boot();
  await setupVault(one);
  one.setForm({customer:"Kundin Bestand",insured:"BESTAND-123"});
  await one.node("kundeSpeichern").emit("click");
  await one.node("importFile").emit("change");
  one.setForm({customer:"Kundin Import",insured:"IMPORT-456"});
  await one.events.get("grafschafter:imported")();
  await one.node("kundeSpeichern").emit("click");
  const two=await boot(one.store);
  await unlockVault(two);
  const choices=two.node("kundenAuswahl").children;
  assert.equal(choices.length,3,"zwei Kundeneinträge und eine Auswahloption");
  const bestand=choices.find(x=>x.textContent==="Kundin Bestand");
  const neu=choices.find(x=>x.textContent==="Kundin Import");
  assert.ok(bestand);
  assert.ok(neu);
  await two.node("kundenAuswahl").emit("change",{target:{value:bestand.value}});
  assert.equal(two.getForm().fields.insured,"BESTAND-123");
  await two.node("kundenAuswahl").emit("change",{target:{value:neu.value}});
  assert.equal(two.getForm().fields.insured,"IMPORT-456");
});
