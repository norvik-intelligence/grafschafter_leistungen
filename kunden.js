
/**
 * Grafschafter Kundenkartei V1
 * Lokal verschlüsselter IndexedDB-Tresor, keine Backend-Calls, keine Klartextspeicherung.
 */
(async () => {
  "use strict";
  const app = window.GrafschafterApp;
  const $ = (id) => document.getElementById(id);
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const DATABASE = "grafschafter_leistungen_local_vault_v1";
  const RECORD = "primary";
  const ITERATIONS = 310000;
  const CUSTOMER_KEYS = ["customer","street","city","birth","insured","care","payer","payerAddress","rate"];
  const BUSINESS_KEYS = ["iban","bic","taxId","taxMode","customTax","dueDays","extraName"];
  const cryptoApi = window.crypto;
  let db, seal, vault, salt, cryptoKey, customerId = null;
  let month = app.currentMonth();
  let currentSave = Promise.resolve(), timer = null, recovering = false, pendingImport = null, busy = false;
  const sleep = (ms) => new Promise(resolve=>setTimeout(resolve,ms));
  function status(message,kind="info"){
    $("kundenStatus").textContent=message;
    $("kundenStatus").dataset.kind=kind;
  }
  function newVault(){
    return {version:1,customers:[],business:{},lastCustomerId:null,lastMonth:null};
  }
  function toB64(bytes) {
    let out="";
    for(let i=0;i<bytes.length;i+=8192){
      out+=String.fromCharCode(...bytes.subarray(i,i+8192));
    }
    return btoa(out);
  }
  function fromB64(value){
    const chars=atob(value),out=new Uint8Array(chars.length);
    for(let i=0;i<chars.length;i++)out[i]=chars.charCodeAt(i);
    return out;
  }
  function randomBytes(n){const out=new Uint8Array(n);cryptoApi.getRandomValues(out);return out;}
  async function derive(password,saltBytes) {
    const base=await cryptoApi.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveKey"]);
    return cryptoApi.subtle.deriveKey({
      name:"PBKDF2",salt:saltBytes,iterations:ITERATIONS,hash:"SHA-256"
    },base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
  }
  function validSeal(record) {
    return !!record && typeof record==="object" && record.format==="grafschafter-vault"
      && record.version===1 && record.iterations===ITERATIONS
      && ["salt","iv","cipher"].every(k=>typeof record[k]==="string"&&record[k].length>10)
      && record.cipher.length < 12000000;
  }
  function validateVault(data){
    if(!data || data.version!==1 || !Array.isArray(data.customers) || data.customers.length>10000)throw Error("Ungültiges Kundenarchiv.");
    if(!data.business || typeof data.business!=="object") data.business={};
    data.customers=data.customers.filter(x=>x && typeof x==="object" && typeof x.id==="string" && typeof x.profile==="object" && x.profile!==null && typeof x.months==="object" && x.months!==null);
    if(typeof data.lastCustomerId!=="string")data.lastCustomerId=null;
    if(typeof data.lastMonth!=="string")data.lastMonth=null;
    return data;
  }
  async function decryptSeal(record,password){
    if(!validSeal(record))throw Error("Dieses Backup-Format wird nicht unterstützt.");
    const localSalt=fromB64(record.salt);
    if(localSalt.length!==16||fromB64(record.iv).length!==12)throw Error("Ungültiges Backupformat.");
    const localKey=await derive(password,localSalt);
    const bytes=await cryptoApi.subtle.decrypt({name:"AES-GCM",iv:fromB64(record.iv)},localKey,fromB64(record.cipher));
    const data=validateVault(JSON.parse(dec.decode(bytes)));
    return {data,localKey,localSalt};
  }
  async function sealVault(model,key,saltBytes) {
    const iv=randomBytes(12);
    const ciphertext=await cryptoApi.subtle.encrypt(
      {name:"AES-GCM",iv},key,enc.encode(JSON.stringify(model))
    );
    return {
      format:"grafschafter-vault",version:1,iterations:ITERATIONS,algorithm:"AES-256-GCM",
      salt:toB64(saltBytes),iv:toB64(iv),cipher:toB64(new Uint8Array(ciphertext)),
      modified:new Date().toISOString()
    };
  }
  function openDatabase(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DATABASE,1);
      request.onupgradeneeded=()=> {
        const base=request.result;
        if(!base.objectStoreNames.contains("vault"))base.createObjectStore("vault");
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||Error("IndexedDB konnte nicht geöffnet werden."));
      request.onblocked=()=>reject(Error("Datenbank von anderem Tab blockiert. Bitte andere Tabs schließen."));
    });
  }
  function readSeal(){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction("vault","readonly");
      const req=tx.objectStore("vault").get(RECORD);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
    });
  }
  function writeSeal(record){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction("vault","readwrite");
      tx.objectStore("vault").put(record,RECORD);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error||Error("Speichern fehlgeschlagen."));
      tx.onabort=()=>reject(tx.error||Error("Speichern abgebrochen."));
    });
  }
  function persist(){
    if(!vault||!cryptoKey)return Promise.resolve();
    const copy=JSON.parse(JSON.stringify(vault));
    const key=cryptoKey, saltCopy=new Uint8Array(salt);
    status("Wird verschlüsselt …");
    currentSave=currentSave.catch(()=>{}).then(async()=>{
      const record=await sealVault(copy,key,saltCopy);
      await writeSeal(record);
      if(key===cryptoKey)seal=record;
      status("Gespeichert","success");
    }).catch(err=>{
      status("Speichern fehlgeschlagen!","error");
      console.error("Lokaler Kundentresor: Schreibfehler",err);
      throw err;
    });
    return currentSave;
  }
  function latestMonths(client){
    return Object.keys(client.months).filter(x=>/^\d{4}-(0[1-9]|1[0-2])$/.test(x)).sort().reverse();
  }
  function selectedClient(){
    return vault?.customers.find(c=>c.id===customerId)||null;
  }
  function profileFromFields(fields){
    return Object.fromEntries(CUSTOMER_KEYS.map(k=>[k,String(fields[k]??"")]));
  }
  function businessFromFields(fields){
    return Object.fromEntries(BUSINESS_KEYS.map(k=>[k,String(fields[k]??"")]));
  }
  function monthLabel(value){
    const [y,m]=String(value||"").split("-").map(Number);
    return y&&m>=1&&m<=12 ? new Date(y,m-1,1).toLocaleDateString("de-DE",{month:"long",year:"numeric"}) : value;
  }
  function saveMonthToModel(overrideMonth){
    if(!vault||!customerId)return false;
    const client=selectedClient();
    if(!client)return false;
    const record=app.snapshot();
    const name=String(record.fields.customer||"").trim();
    if(!name)return false;
    const chosen=/^\d{4}-(0[1-9]|1[0-2])$/.test(overrideMonth||"")?overrideMonth:month;
    if(!chosen)return false;
    record.fields.month=chosen;
    const date=new Date().toISOString();
    client.profile=profileFromFields(record.fields);
    client.lastMode=record.mode;
    client.months[chosen]={snapshot:record,updatedAt:date};
    client.updatedAt=date;
    vault.business=businessFromFields(record.fields);
    vault.lastCustomerId=client.id;
    vault.lastMonth=chosen;
    return true;
  }
  function scheduleSave(){
    if(recovering||busy||!customerId||!vault)return;
    clearTimeout(timer);
    status("Änderungen offen");
    timer=setTimeout(async()=>{
      timer=null;
      if(saveMonthToModel(month)){
        renderPanel();
        try{await persist();}catch(_){}
      }
    },900);
  }
  async function flush(saveCurrent=true){
    clearTimeout(timer);timer=null;
    if(saveCurrent && saveMonthToModel(month)){
      await persist();
    } else {
      await currentSave.catch(()=>{});
    }
  }
  function selectText(label,value){
    const option=document.createElement("option");
    option.value=value;
    option.textContent=label;
    return option;
  }
  function renderPanel(){
    if(!vault)return;
    const search=$("kundenSuche").value.toLocaleLowerCase("de-DE").trim();
    const drop=$("kundenAuswahl");
    const clients=[...vault.customers].sort((a,b)=>String(a.profile.customer||"").localeCompare(String(b.profile.customer||""),"de"));
    const visible=clients.filter(c=>String(c.profile.customer||"").toLocaleLowerCase("de-DE").includes(search)||c.id===customerId);
    drop.replaceChildren(selectText("Kundenakte auswählen ("+vault.customers.length+")",""),...visible.map(c=>selectText(c.profile.customer,c.id)));
    drop.value=customerId||"";
    const client=selectedClient();
    $("kundeAktiv").textContent=client
      ? client.profile.customer+" · "+latestMonths(client).length+" Monatsakten gespeichert"
      : "Neuer Kunde – bitte Stammdaten ausfüllen und speichern.";
    $("kundenMonatPanel").hidden=!client;
    $("kundenLoeschen").disabled=!client;
    $("kundeSpeichern").textContent=client?"Kunde & Monat speichern":"Neuen Kunden speichern";
    const optionMonths=new Set([month,app.currentMonth(),...(client?latestMonths(client):[])]);
    const picker=$("monatsAkten");
    picker.replaceChildren(...[...optionMonths].filter(v=>/^\d{4}-\d{2}$/.test(v)).sort().reverse().map(v=>{
      const saved=!!(client&&client.months[v]);
      return selectText(monthLabel(v)+(saved?" · gespeichert":" · neuer Monat"),v);
    }));
    picker.value=month;
  }
  function loadMonthFromVault(chosen){
    const client=selectedClient();
    if(!client)return;
    const stored=client.months[chosen]?.snapshot;
    const base=app.freshDocument(chosen,{...vault.business,...client.profile});
    base.mode=client.lastMode||"45b";
    recovering=true;
    try{app.restore(stored||base);}finally{recovering=false;}
    month=chosen;
    $("month").value=chosen;
    renderPanel();
    status(stored?"Monat geladen":"Neuer Monat","success");
  }
  async function openCustomer(id,requestedMonth=null){
    if(busy||!vault)return;
    busy=true;
    try{
      await flush();
      const found=vault.customers.find(x=>x.id===id);
      if(!found)throw Error("Kunde nicht gefunden");
      customerId=found.id;
      const wanted=requestedMonth||
        (vault.lastCustomerId===id && /^\d{4}-\d{2}$/.test(vault.lastMonth||"")?vault.lastMonth:app.currentMonth());
      loadMonthFromVault(wanted);
      vault.lastCustomerId=id;vault.lastMonth=wanted;
      await persist();
    }catch(err){alert("Kundenwechsel fehlgeschlagen: "+err.message);}finally{busy=false;}
  }
  async function changeMonth(toMonth){
    if(busy||!/^\d{4}-(0[1-9]|1[0-2])$/.test(toMonth))return;
    if(!customerId){
      const draft=app.snapshot();
      month=toMonth;
      draft.fields.month=toMonth;
      draft.fields.invoiceNo="GA-"+toMonth.replace("-","")+"-"+Date.now().toString(36).slice(-6).toUpperCase();
      draft.visits=[];
      recovering=true;
      try{app.restore(draft);}finally{recovering=false;}
      renderPanel();return;
    }
    if(month===toMonth)return;
    busy=true;
    try{
      await flush();
      loadMonthFromVault(toMonth);
      vault.lastMonth=toMonth;
      await persist();
    }catch(err){alert("Monatswechsel fehlgeschlagen: "+err.message);}finally{busy=false;}
  }
  async function newCustomer(){
    if(busy||!vault)return;
    busy=true;
    try{
      await flush();
      customerId=null;month=app.currentMonth();
      recovering=true;
      try{app.restore(app.freshDocument(month,vault.business));}finally{recovering=false;}
      $("kundenSuche").value="";
      renderPanel();
      status("Noch nicht gespeichert");
      $("customer").focus();
    }catch(err){alert("Bitte aktuellen Kunden erst sichern: "+err.message);}finally{busy=false;}
  }
  async function saveCustomer(){
    if(busy||!vault)return;
    const documentData=app.snapshot();
    if(!String(documentData.fields.customer||"").trim()){
      status("Kundenname fehlt","error");
      $("customer").focus();
      return;
    }
    busy=true;
    clearTimeout(timer);timer=null;
    try{
      if(!customerId){
        const id=cryptoApi.randomUUID();
        const time=new Date().toISOString();
        vault.customers.push({id,profile:profileFromFields(documentData.fields),months:{},lastMode:documentData.mode,createdAt:time,updatedAt:time});
        customerId=id;
      }
      if(!saveMonthToModel(month))throw Error("Monatsakte konnte nicht angelegt werden.");
      await persist();
      renderPanel();
    }catch(err){status("Kunde konnte nicht gespeichert werden","error");alert("Speichern fehlgeschlagen: "+err.message);}finally{busy=false;}
  }
  async function deleteCustomer(){
    if(!vault||!customerId||busy)return;
    const client=selectedClient();
    if(!client)return;
    if(!confirm("Kundenakte „"+client.profile.customer+"“ mit ALLEN Monatsnachweisen auf diesem Gerät unwiderruflich löschen? Bitte vorher ein Backup erstellen."))return;
    busy=true;
    try{
      await currentSave.catch(()=>{});
      clearTimeout(timer);timer=null;
      vault.customers=vault.customers.filter(x=>x.id!==customerId);
      customerId=null;
      vault.lastCustomerId=null;vault.lastMonth=null;
      month=app.currentMonth();
      recovering=true;
      try{app.restore(app.freshDocument(month,vault.business));}finally{recovering=false;}
      await persist();
      renderPanel();
    }catch(err){alert("Löschen fehlgeschlagen: "+err.message);}finally{busy=false;}
  }
  async function lockVault(){
    if(busy)return;
    busy=true;
    try{
      await flush();
      recovering=true;
      try{app.restore(app.freshDocument(app.currentMonth()));}finally{recovering=false;}
      cryptoKey=null;salt=null;vault=null;customerId=null;seal=await readSeal();
      $("vaultPassword").value="";$("vaultConfirm").value="";
      $("vaultError").textContent="";
      showOverlay(true);
      status("Tresor gesperrt");
    }catch(err){alert("Sperren abgebrochen: Die Speicherung schlug fehl: "+err.message);}finally{busy=false;}
  }
  function showOverlay(existing){
    $("vaultTitle").textContent=existing?"Kundentresor entsperren":"Kundentresor einrichten";
    $("vaultDescription").textContent=existing
      ?"Gib deine Passphrase ein, um deine gespeicherten Kunden und Monatsakten auf diesem Gerät zu öffnen."
      :"Lege eine Passphrase mit mindestens 12 Zeichen fest. Deine Kundenakten werden verschlüsselt im Browser auf diesem Gerät gespeichert.";
    $("vaultConfirmWrap").hidden=!!existing;
    $("vaultSubmit").textContent=existing?"Kundenkartei öffnen":"Verschlüsselten Tresor erstellen";
    $("vaultOverlay").hidden=false;
    document.body.classList.add("vault-is-locked");
    $("vaultPassword").focus();
  }
  function hideOverlay(){
    $("vaultOverlay").hidden=true;
    document.body.classList.remove("vault-is-locked");
    $("vaultPassword").value="";$("vaultConfirm").value="";$("vaultError").textContent="";
  }
  async function unlockOrCreate(evt){
    evt.preventDefault();
    if(busy)return;
    const pass=$("vaultPassword").value;
    $("vaultError").textContent="";
    if(!seal && pass.length<12){$("vaultError").textContent="Bitte mindestens 12 Zeichen wählen.";return;}
    if(!seal && pass!==$("vaultConfirm").value){$("vaultError").textContent="Passphrasen stimmen nicht überein.";return;}
    busy=true;
    $("vaultSubmit").disabled=true;
    try{
      if(seal){
        const result=await decryptSeal(seal,pass);
        cryptoKey=result.localKey;salt=result.localSalt;vault=result.data;
      }else{
        salt=randomBytes(16);
        cryptoKey=await derive(pass,salt);
        vault=newVault();
        await persist();
        if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
      }
      customerId=null;
      month=app.currentMonth();
      hideOverlay();
      if(vault.lastCustomerId && vault.customers.some(c=>c.id===vault.lastCustomerId)){
        const preferred=vault.lastCustomerId, preferredMonth=vault.lastMonth;
        customerId=preferred;
        loadMonthFromVault(preferredMonth||month);
      }else{
        recovering=true;
        try{app.restore(app.freshDocument(month,vault.business));}finally{recovering=false;}
        renderPanel();
        status("Bereit","success");
      }
    }catch(err){
      vault=null;cryptoKey=null;salt=null;
      $("vaultError").textContent=seal?"Passphrase falsch oder Kundenarchiv beschädigt.":"Einrichtung fehlgeschlagen: "+err.message;
    }finally{busy=false;$("vaultSubmit").disabled=false;}
  }
  function triggerBackupDownload(record){
    const blob=new Blob([JSON.stringify(record,null,2)],{type:"application/json"});
    const link=document.createElement("a");
    const url=URL.createObjectURL(blob);
    link.href=url;link.download="Grafschafter_Kundenbackup_"+new Date().toISOString().slice(0,10)+".gkbackup";
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportBackup(){
    if(busy||!vault)return;
    busy=true;
    try{
      await flush();
      const record=await readSeal();
      if(!validSeal(record))throw Error("Kein gültiger verschlüsselter Tresor gefunden.");
      triggerBackupDownload(record);
      status("Backup erstellt","success");
    }catch(err){status("Backup fehlgeschlagen","error");alert("Backup fehlgeschlagen: "+err.message);}finally{busy=false;}
  }
  function cancelBackupImport(){
    pendingImport=null;
    $("backupRestoreBox").hidden=true;
    $("backupPassword").value="";
    $("kundenBackupDatei").value="";
  }
  async function restoreBackup(){
    if(busy||!pendingImport)return;
    const password=$("backupPassword").value;
    if(!password){$("backupPassword").focus();return;}
    busy=true;
    try{
      const file=pendingImport;
      if(file.size>10000000)throw Error("Backup ist zu groß.");
      const obj=JSON.parse(await file.text());
      const {data,localKey,localSalt}=await decryptSeal(obj,password);
      if(!confirm("ACHTUNG: Die aktuell gespeicherten "+vault.customers.length+" Kundenakten auf diesem Gerät werden vollständig durch "+data.customers.length+" Kundenakten aus der Sicherung ERSETZT. Fortfahren?"))return;
      clearTimeout(timer);timer=null;
      await currentSave.catch(()=>{});
      await writeSeal(obj);
      seal=obj;cryptoKey=localKey;salt=localSalt;vault=data;
      customerId=null;month=app.currentMonth();
      cancelBackupImport();
      if(vault.lastCustomerId && vault.customers.some(c=>c.id===vault.lastCustomerId)){
        customerId=vault.lastCustomerId;loadMonthFromVault(vault.lastMonth||month);
      }else{
        recovering=true;
        try{app.restore(app.freshDocument(month,vault.business));}finally{recovering=false;}
        renderPanel();
      }
      status("Backup wiederhergestellt","success");
    }catch(err){alert("Sicherung konnte nicht geladen werden: "+err.message);status("Backup fehlgeschlagen","error");}
    finally{busy=false;}
  }
  function onFormChanged(evt){
    if(recovering||busy||!customerId)return;
    if(evt?.target?.id==="month")return;
    scheduleSave();
  }
  $("vaultForm").addEventListener("submit",unlockOrCreate);
  $("kundeNeu").addEventListener("click",newCustomer);
  $("kundeSpeichern").addEventListener("click",saveCustomer);
  $("kundenSuche").addEventListener("input",()=>renderPanel());
  $("kundenAuswahl").addEventListener("change",e=>e.target.value?openCustomer(e.target.value):newCustomer());
  $("monatsAkten").addEventListener("change",e=>changeMonth(e.target.value));
  $("month").addEventListener("change",e=>changeMonth(e.target.value));
  $("naechsterMonat").addEventListener("click",()=>{
    const [y,m]=month.split("-").map(Number);
    const future=new Date(y,m,1);
    const value=future.getFullYear()+"-"+String(future.getMonth()+1).padStart(2,"0");
    changeMonth(value);
  });
  $("kundenLoeschen").addEventListener("click",deleteCustomer);
  $("kundenSperren").addEventListener("click",lockVault);
  $("kundenBackup").addEventListener("click",exportBackup);
  $("kundenImport").addEventListener("click",()=>$("kundenBackupDatei").click());
  $("kundenBackupDatei").addEventListener("change",e=>{
    pendingImport=e.target.files?.[0]||null;
    if(pendingImport){$("backupRestoreBox").hidden=false;$("backupPassword").focus();}
  });
  $("backupRestoreConfirm").addEventListener("click",restoreBackup);
  $("backupCancel").addEventListener("click",cancelBackupImport);
  $("documentForm").addEventListener("input",onFormChanged);
  $("documentForm").addEventListener("change",onFormChanged);
  $("documentForm").addEventListener("click",e=>{
    if(e.target.closest("[data-type]") || e.target.closest("[data-remove]") || e.target.id==="addVisit"){
      queueMicrotask(scheduleSave);
    }
  });
  $("reset").addEventListener("click",e=>{
    e.preventDefault();e.stopImmediatePropagation();
    newCustomer();
  },true);
  // Die bisherige Kundenakte vor dem Laden fremder Monatsdaten sichern.
  // Der Import selbst darf niemals die bisher geöffnete Kundenakte überschreiben.
  $("importFile").addEventListener("change",()=>{
    if(busy||!vault||!customerId)return;
    clearTimeout(timer);timer=null;
    if(saveMonthToModel(month))persist().catch(()=>{});
  },true);
  window.addEventListener("grafschafter:imported",()=>{
    if(busy||!vault)return;
    clearTimeout(timer);timer=null;
    customerId=null;
    month=app.snapshot().fields.month||app.currentMonth();
    renderPanel();
    status("Importiertes Dokument – als neuen Kunden speichern");
  });
  window.addEventListener("beforeunload",e=>{
    // Nicht auf asynchrone IndexedDB-Schreibvorgänge beim Schließen verlassen.
    if(timer||$("kundenStatus").dataset.kind==="error"){
      e.preventDefault();e.returnValue="";
    }
  });
  try{
    if(!window.isSecureContext || !window.indexedDB || !cryptoApi?.subtle){
      throw Error("Sichere Speicherung erfordert einen aktuellen Browser mit HTTPS und aktiviertem IndexedDB.");
    }
    db=await openDatabase();
    seal=await readSeal();
    showOverlay(!!seal);
  }catch(err){
    $("vaultTitle").textContent="Kundentresor nicht verfügbar";
    $("vaultDescription").textContent=err.message+" Bitte normalen Browser-Modus verwenden und die Browser-Einstellungen prüfen.";
    $("vaultForm").hidden=true;
    $("vaultError").textContent=err.message;
    status("Speicherung nicht verfügbar","error");
  }
})();
