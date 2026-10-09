
(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const fields = ["customer","street","city","birth","insured","care","payer","payerAddress","month","staff","rate","extra","extraName","invoiceDate","invoiceNo","taxId","taxMode","customTax","iban","bic","dueDays"];
const LOGO = "https://www.grafschafter-alltagsservice.de/logo-optimized.webp";
let mode = "45b";
let activeView = "record";
let visits = [];
const now = new Date();
const dateISO = [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
$("month").value = dateISO.substring(0,7);
$("invoiceDate").value = dateISO;
$("invoiceNo").value = "GA-"+dateISO.replaceAll("-","")+"-"+String(Math.floor(Math.random()*900)+100);
const get = (name) => $(name).value.trim();
const clean = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const euros = (n) => (Number(n) || 0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const decimal = (n) => (Number(n) || 0).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2});
const number = (n) => Math.max(0,Number(n)||0);
const displayDate = (date) => date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split("-").reverse().join(".") : "________________";
const types = {
  "45b":{name:"Entlastungsbetrag",heading:"Angebote zur Unterstützung im Alltag gemäß § 45b SGB XI",hint:"Bei direkter Kassenabrechnung muss die nötige Abtretung bzw. Ermächtigung vorliegen. Nur erstattungsfähige anerkannte Leistungen abrechnen."},
  "39":{name:"Verhinderungspflege",heading:"Stundenweise Verhinderungspflege gemäß § 39 SGB XI",hint:"Voraussetzungen, verfügbare Mittel und individuelle Abrechnungsberechtigung vorher prüfen. Verhinderungspflege getrennt von § 45b dokumentieren."},
  "privat":{name:"Privatrechnung",heading:"Privat vereinbarte Betreuungs- und Alltagshilfeleistungen",hint:"Die Rechnung geht an die zahlungspflichtige Person. Pflegekassenansprüche sind nicht automatisch enthalten."}
};
const startMinutes = (value) => {
 if(!/^\d{2}:\d{2}$/.test(value||"")) return null;
 const [h,m] = value.split(":").map(Number);
 if(h>23||m>59) return null;
 return h*60+m;
};
function duration(v){
 if(!v.date||!v.start||!v.end) return 0;
 const s=startMinutes(v.start),e=startMinutes(v.end);
 if(s===null||e===null||e<=s) return 0;
 return Math.max(0,e-s-number(v.breakMinutes));
}
function validVisit(v){
 if(!v.date||!v.start||!v.end) return false;
 const s=startMinutes(v.start),e=startMinutes(v.end);
 return s!==null&&e!==null&&e>s&&e-s>number(v.breakMinutes)&&v.date.slice(0,7)===get("month");
}
function totals(){
 let minutes=0,visitCount=0;
 visits.forEach(v=>{if(validVisit(v)){minutes+=duration(v);visitCount++;}});
 const amount = Math.round((minutes/60*number(get("rate"))+number(get("extra")))*100)/100;
 return {minutes,visitCount,hours:minutes/60,amount,serviceCost:Math.round(minutes/60*number(get("rate"))*100)/100};
}
function createVisit(data){
 visits.push(Object.assign({id:"v"+Date.now()+Math.random().toString(36).substring(2),date:"",start:"",end:"",breakMinutes:0,activity:"Haushaltshilfe",note:""},data||{}));
 renderVisitFields();
 update();
}
function renderVisitFields(){
 $("visits").innerHTML=visits.map((v,index)=>
 '<div class="visit" data-id="'+clean(v.id)+'"><div class="visit-title"><span>Einsatz '+(index+1)+'</span><button type="button" data-remove="'+clean(v.id)+'">Entfernen ×</button></div>'+
 '<div class="visit-fields">'+
 '<div class="fields"><label>Datum<input data-field="date" type="date" value="'+clean(v.date)+'"></label></div>'+
 '<div class="fields"><label>Start<input data-field="start" type="time" value="'+clean(v.start)+'"></label></div>'+
 '<div class="fields"><label>Ende<input data-field="end" type="time" value="'+clean(v.end)+'"></label></div>'+
 '<div class="fields"><label>Pause (Min)<input data-field="breakMinutes" type="number" min="0" value="'+clean(v.breakMinutes)+'"></label></div>'+
 '</div>'+
 '<div class="visit-fields second"><div class="fields"><label>Leistung<select data-field="activity">'+
 ["Haushaltshilfe","Betreuung","Alltagsbegleitung","Einkauf / Besorgungen","Begleitung zu Terminen","Entlastung Angehöriger","Sonstige Leistung"].map(o=>'<option'+(o===v.activity?' selected':'')+'>'+clean(o)+'</option>').join("")+
 '</select></label></div><div class="fields"><label>Notiz<input data-field="note" value="'+clean(v.note)+'" placeholder="Optional"></label></div></div>'+
 '<p class="visit-summary">'+duration(v)+' Minuten</p></div>'
 ).join("");
}
function logo(){
 return '<img class="logo" src="'+LOGO+'" alt="Grafschafter Alltagsservice" referrerpolicy="no-referrer">';
}
function paperHeader(title,subtitle){
 return '<div class="paper-head">'+logo()+'<div class="document-title"><h2>'+clean(title)+'</h2><p>'+clean(subtitle)+'</p></div></div>';
}
function meta(title,content){
 return '<div class="meta-box"><h3>'+clean(title)+'</h3><p>'+clean(content)+'</p></div>';
}
function monthName(){
 const [year,month]=(get("month")||"").split("-").map(Number);
 return year&&month?new Date(year,month-1,1).toLocaleDateString("de-DE",{month:"long",year:"numeric"}):"Monat / Jahr";
}
function drawRecord(){
 const dateValues=get("month").split("-");
 const year=Number(dateValues[0]),month=Number(dateValues[1]);
 const count=year&&month?new Date(year,month,0).getDate():31;
 const byDay=new Map();
 visits.filter(validVisit).forEach(v=>{
   const day=Number(v.date.slice(-2));
   if(!byDay.has(day)) byDay.set(day,[]);
   byDay.get(day).push(v);
 });
 const days=Array.from({length:31},(_,i)=>i+1);
 const shortActivity = (name) => ({
    "Haushaltshilfe":"HH","Betreuung":"BT","Alltagsbegleitung":"AB","Einkauf / Besorgungen":"EK","Begleitung zu Terminen":"BG","Entlastung Angehöriger":"EA","Sonstige Leistung":"SO"
 }[name] || "SO");
 const rows=[
  ["Tag",day=>String(day)],
  ["Leistung(en)",day=>(byDay.get(day)||[]).map(v=>shortActivity(v.activity)).join("/")],
  ["Zeit in Minuten",day=>byDay.has(day)?String(byDay.get(day).reduce((s,v)=>s+duration(v),0)):""],
  ["Besuchszeit",day=>(byDay.get(day)||[]).map(v=>v.start+"–"+v.end).join("\n")],
  ["Handzeichen",day=>""]
 ];
 const table='<table class="calendar-table" aria-label="Leistungen nach Kalendertag"><tbody>'+
  rows.map((r,i)=>'<tr><th scope="row">'+r[0]+'</th>'+days.map(day=>{
    const tag=i===0?"th":"td";
    return '<'+tag+' class="'+(i===3?'tiny ':'')+(day>count?'unused':'')+'">'+(day>count?"":clean(r[1](day)))+'</'+tag+'>';
  }).join("")+'</tr>').join("")+'</tbody></table>';
 const t=totals();
 const descriptions=visits.filter(validVisit).map(v=>displayDate(v.date)+": "+v.activity+(v.note?" ("+v.note+")":"")).join(" · ");
 $("recordPaper").innerHTML=paperHeader("LEISTUNGSNACHWEIS",monthName())+
 '<div class="paper-meta">'+
 meta("VERSICHERTE PERSON",get("customer")+"\n"+get("street")+" · "+get("city")+"\nVers.-Nr.: "+get("insured")+"\nGeburtsdatum: "+displayDate(get("birth"))+" · Pflegegrad: "+get("care"))+
 meta("PFLEGEKASSE / RECHNUNGSEMPFÄNGER",get("payer")+"\n"+get("payerAddress")+"\n"+types[mode].heading)+
 meta("LEISTUNGSERBRINGER","Grafschafter Alltagsservice · Sokayna Malki\nLippestraße 9L · 47443 Moers\nIK-Nummer: 462559247\nkontakt@grafschafter-alltagsservice.de")+
 '</div>'+table+
 '<div class="activity-list"><b>Erbrachte Leistungen:</b> '+clean(descriptions||"________________________________________________________________________")+'</div>'+
 '<div class="paper-summary"><b>Gesamt:</b> '+t.minutes+' Minuten / '+decimal(t.hours)+' Stunden &nbsp;&nbsp; | &nbsp;&nbsp; <b>Einsatzkraft:</b> '+clean(get("staff")||"____________________________")+'</div>'+
 '<div class="paper-summary">Die unterzeichnenden Personen bestätigen die tatsächlich erbrachten und oben dokumentierten Leistungen.</div>'+
 '<div class="signatures"><div class="signature">Leistungserbringer / Betreuungskraft<small>Ort, Datum, Unterschrift: __________________________________</small></div><div class="signature">Versicherte Person / bevollmächtigte Vertretung<small>Ort, Datum, Unterschrift: __________________________________</small></div></div>';
}
function taxText(){
 if(get("taxMode")==="exempt")return "Steuerfreie Leistungen gemäß § 4 Nr. 16 UStG (bei Vorliegen der gesetzlichen Voraussetzungen).";
 if(get("taxMode")==="small")return "Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.";
 if(get("taxMode")==="custom")return get("customTax")||"Steuerlichen Hinweis ergänzen.";
 return "Steuerlichen Rechnungsvermerk vor Einreichung ergänzen und steuerlich prüfen.";
}
function invoiceDue(){
 const d=get("invoiceDate");if(!d)return "____________";
 const date = new Date(d+"T12:00:00");date.setDate(date.getDate()+number(get("dueDays")));
 return date.toLocaleDateString("de-DE");
}
function drawInvoice(){
 const t=totals();
 const label=types[mode].heading;
 const isPrivate=mode==="privat";
 const payer=get("payer")||(isPrivate?get("customer"):"Pflegekasse / Kostenträger");
 const addr=get("payerAddress")||(isPrivate?(get("street")+"\n"+get("city")):"");
 const items='<tr><td>01</td><td><strong>'+clean(label)+'</strong><br><span style="color:#728076">Leistungen im Zeitraum '+clean(monthName())+' gemäß Leistungsnachweis</span></td><td>'+decimal(t.hours)+' Std.</td><td>'+euros(get("rate"))+'</td><td>'+euros(t.serviceCost)+'</td></tr>'+
 (number(get("extra"))>0?'<tr><td>02</td><td>'+clean(get("extraName")||"Zusatzkosten")+'</td><td>1</td><td>'+euros(get("extra"))+'</td><td>'+euros(get("extra"))+'</td></tr>':"");
 let payerNote="";
 if(!isPrivate)payerNote=$("direct").checked?"Direkte Abrechnung gemäß vorliegender Abtretung / Vollmacht.":"Hinweis: Die Abrechnung mit dem Kostenträger setzt eine gesonderte Ermächtigung voraus.";
 $("invoicePaper").innerHTML=paperHeader("RECHNUNG",types[mode].name)+
 '<div class="invoice-address"><p><strong>Rechnungsempfänger</strong><br>'+clean(payer)+'<br>'+clean(addr)+'</p>'+
 '<div class="invoice-facts"><div><span>Rechnungsnummer</span><strong>'+clean(get("invoiceNo"))+'</strong></div><div><span>Rechnungsdatum</span><strong>'+displayDate(get("invoiceDate"))+'</strong></div><div><span>Leistungsmonat</span><strong>'+clean(monthName())+'</strong></div><div><span>IK-Nummer</span><strong>462559247</strong></div></div></div>'+
 '<div class="invoice-customer"><strong>Leistungsempfänger:</strong> '+clean(get("customer"))+'<br><strong>Versichertennummer:</strong> '+clean(get("insured")||"–")+' &nbsp; <strong>Pflegegrad:</strong> '+clean(get("care")||"–")+'</div>'+
 '<table class="invoice-table"><thead><tr><th>Pos.</th><th>Leistung</th><th>Menge</th><th>Einzelpreis</th><th>Betrag</th></tr></thead><tbody>'+items+'</tbody></table>'+
 '<div class="invoice-total"><span>Rechnungsbetrag</span><span>'+euros(t.amount)+'</span></div>'+
 '<div class="invoice-note"><strong>Steuerlicher Hinweis:</strong> '+clean(taxText())+
 '\n<strong>Zahlung:</strong> Bitte bis '+invoiceDue()+' unter Angabe der Rechnungsnummer überweisen.'+
 '\n<strong>Kontoinhaber:</strong> Sokayna Malki   <strong>IBAN:</strong> '+clean(get("iban")||"________________________")+
 (get("bic")?"   <strong>BIC:</strong> "+clean(get("bic")):"")+
 (payerNote?"\n\n"+clean(payerNote):"")+
 '</div>'+
 '<div class="invoice-footer"><strong>Grafschafter Alltagsservice · Inhaberin Sokayna Malki</strong><br>Lippestraße 9L · 47443 Moers · kontakt@grafschafter-alltagsservice.de<br>Institutionskennzeichen: 462559247 · Steuernummer / USt-IdNr.: '+clean(get("taxId")||"_____________________")+
 '<br>Anlage: Leistungsnachweis '+clean(monthName())+'</div>';
}
function update(){
 const t=totals();
 $("statCount").textContent=String(t.visitCount);
 $("statHours").textContent=decimal(t.hours);
 $("statAmount").textContent=euros(t.amount);
 $("typeHint").textContent=types[mode].hint;
 $("customTaxWrap").hidden=get("taxMode")!=="custom";
 $("direct").disabled=mode==="privat";
 if(mode==="privat")$("direct").checked=false;
 document.querySelectorAll("[data-type]").forEach(el=>el.classList.toggle("selected",el.dataset.type===mode));
 drawRecord();drawInvoice();
}
function showView(view){
 activeView=view;
 $("recordPaper").hidden=view!=="record";
 $("invoicePaper").hidden=view!=="invoice";
 document.querySelectorAll("[data-view]").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
}
function problems(which){
 const issues=[];
 if(!get("customer"))issues.push("Name des Kunden / der versicherten Person");
 if(!get("month"))issues.push("Abrechnungsmonat");
 if(!visits.some(validVisit))issues.push("mindestens ein vollständig ausgefüllter Einsatz im Abrechnungsmonat");
 if(visits.some(v=>(v.date||v.start||v.end)&&!validVisit(v)))issues.push("unvollständige oder ungültige Einsätze (Datum, Start, Ende, Pause)");
 if(which==="invoice"){
  if(!get("payer"))issues.push("Rechnungsempfänger");
  if(!get("invoiceNo"))issues.push("Rechnungsnummer");
  if(!get("invoiceDate"))issues.push("Rechnungsdatum");
  if(!get("taxId"))issues.push("Steuernummer oder USt-IdNr.");
  if(!get("iban"))issues.push("IBAN");
  if(!get("taxMode")||(get("taxMode")==="custom"&&!get("customTax")))issues.push("zutreffenden steuerlichen Rechnungsvermerk");
  if(mode!=="privat"&&!$("direct").checked)issues.push("Bestätigung der Abtretung / Vollmacht für direkte Kassenabrechnung");
 }
 return issues;
}
function print(which){
 const issues=problems(which);
 if(issues.length&&!window.confirm("Vor dem Drucken bitte prüfen / ergänzen:\n\n• "+issues.join("\n• ")+"\n\nTrotzdem mit den aktuellen Eingaben drucken?"))return;
 showView(which);
 document.body.classList.remove("print-record","print-invoice");
 document.body.classList.add("print-"+which);
 const pageStyle=document.createElement("style");
 pageStyle.id="printOrientation";
 pageStyle.textContent="@page {size:A4 "+(which==="record"?"landscape":"portrait")+"; margin:0}";
 document.head.appendChild(pageStyle);
 window.print();
 window.addEventListener("afterprint",()=>{pageStyle.remove();document.body.classList.remove("print-record","print-invoice");},{once:true});
}
function exportData(){
 const data={version:1,mode,fields:Object.fromEntries(fields.map(k=>[k,get(k)])),direct:$("direct").checked,visits};
 const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");link.href=url;
 link.download="Grafschafter_Leistungen_"+(get("customer")||"Kunde").replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g,"_")+"_"+get("month")+".json";
 link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function importData(file){
 if(!file||file.size>2_000_000){alert("Bitte eine passende JSON-Datei unter 2 MB wählen.");return;}
 let d;
 try{d=JSON.parse(await file.text());}catch(e){alert("Die Datei ist keine gültige JSON-Datei.");return;}
 if(d.version!==1||!d.fields||typeof d.fields!=="object"||!Array.isArray(d.visits)||d.visits.length>200){alert("Unbekanntes oder ungültiges Dateiformat.");return;}
 mode=Object.hasOwn(types,d.mode)?d.mode:"45b";
 fields.forEach(k=>{if(typeof d.fields[k]==="string")$(k).value=d.fields[k].slice(0,500);});
 $("direct").checked=!!d.direct;
 visits=d.visits.filter(v=>v&&typeof v==="object").map(v=>({
  id:"v"+Math.random().toString(36).slice(2),
  date:String(v.date||"").slice(0,10),
  start:String(v.start||"").slice(0,5),
  end:String(v.end||"").slice(0,5),
  breakMinutes:Math.min(1440,number(v.breakMinutes)),
  activity:String(v.activity||"Haushaltshilfe").slice(0,100),
  note:String(v.note||"").slice(0,300)
 }));
 renderVisitFields();update();showView("record");
}
function reset(){
 if(!window.confirm("Alle eingegebenen Daten dieses Dokuments verwerfen?"))return;
 $("documentForm").reset();
 fields.forEach(k=>{if(["rate","extra","extraName","dueDays"].includes(k))return;$(k).value="";});
 $("month").value=dateISO.slice(0,7);
 $("invoiceDate").value=dateISO;
 $("invoiceNo").value="GA-"+dateISO.replaceAll("-","")+"-"+String(Math.floor(Math.random()*900)+100);
 mode="45b";visits=[];createVisit();showView("record");
}
document.querySelectorAll("[data-type]").forEach(el=>el.addEventListener("click",()=>{mode=el.dataset.type;if(mode==="privat"&&!get("payer"))$("payer").value=get("customer");update();}));
document.querySelectorAll("[data-view]").forEach(el=>el.addEventListener("click",()=>showView(el.dataset.view)));
fields.forEach(name=>$(name).addEventListener("input",update));
$("direct").addEventListener("change",update);
$("addVisit").addEventListener("click",()=>createVisit());
$("visits").addEventListener("input",(ev)=>{
 const holder=ev.target.closest(".visit");if(!holder)return;
 const v=visits.find(x=>x.id===holder.dataset.id);
 if(!v||!ev.target.dataset.field)return;
 v[ev.target.dataset.field]=ev.target.value;
 holder.querySelector(".visit-summary").textContent=duration(v)+" Minuten";
 update();
});
$("visits").addEventListener("change",(ev)=>{if(ev.target.dataset.field)update();});
$("visits").addEventListener("click",(ev)=>{
 const button=ev.target.closest("[data-remove]");
 if(!button)return;
 visits=visits.filter(v=>v.id!==button.dataset.remove);
 if(visits.length===0)createVisit();
 else {renderVisitFields();update();}
});
$("printRecord").addEventListener("click",()=>print("record"));
$("printInvoice").addEventListener("click",()=>print("invoice"));
$("export").addEventListener("click",exportData);
$("import").addEventListener("click",()=>$("importFile").click());
$("importFile").addEventListener("change",(ev)=>{importData(ev.target.files[0]);ev.target.value="";});
$("reset").addEventListener("click",reset);

/* Schnittstelle für die verschlüsselte Kundenkartei; keine Datenübertragung. */
function freshDocument(month = dateISO.slice(0,7), prefills = {}) {
  const values = Object.fromEntries(fields.map(name=>[name,""]));
  Object.assign(values,{
    month,rate:"38.50",extra:"0",extraName:"Fahrtkosten",
    invoiceDate:dateISO,
    invoiceNo:"GA-"+month.replace("-","")+"-"+Date.now().toString(36).slice(-6).toUpperCase(),
    dueDays:"14"
  },prefills);
  return {mode:"45b",direct:false,fields:values,visits:[]};
}
function snapshot() {
  return {
    mode,
    direct:$("direct").checked,
    fields:Object.fromEntries(fields.map(k=>[k,$(k).value])),
    visits:visits.map(v=>({...v}))
  };
}
function restore(data) {
  if(!data || !data.fields || typeof data.fields!=="object") return;
  mode=Object.hasOwn(types,data.mode)?data.mode:"45b";
  fields.forEach(k=>{$(k).value=typeof data.fields[k]==="string"?data.fields[k].slice(0,500):"";});
  $("direct").checked=!!data.direct;
  visits=Array.isArray(data.visits)?data.visits.slice(0,150).filter(v=>v&&typeof v==="object").map(v=>({
    id:"v"+Math.random().toString(36).slice(2),
    date:String(v.date||"").slice(0,10),
    start:String(v.start||"").slice(0,5),
    end:String(v.end||"").slice(0,5),
    breakMinutes:Math.min(1440,number(v.breakMinutes)),
    activity:String(v.activity||"Haushaltshilfe").slice(0,100),
    note:String(v.note||"").slice(0,300)
  })):[];
  if(visits.length===0)visits=[{id:"v"+Math.random().toString(36).slice(2),date:"",start:"",end:"",breakMinutes:0,activity:"Haushaltshilfe",note:""}];
  renderVisitFields();
  update();
  showView("record");
}
window.GrafschafterApp={snapshot,restore,freshDocument,currentMonth:()=>dateISO.slice(0,7)};
createVisit();
showView("record");
})();
