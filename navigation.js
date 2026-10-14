(()=>{"use strict";
const main=document.querySelector("main.workspace"),editor=document.querySelector(".editor"),preview=document.querySelector(".preview-pane"),kunden=document.getElementById("kundenPanel");
if(!main||!editor||!preview||!kunden)return;
const sections=[["dashboard","Übersicht"],["kunden","Kundenkartei"],["leistungen","Leistungen"],["rechnungen","Rechnungen"],["budgets","Budgets"],["dokumente","Dokumente"],["einstellungen","Einstellungen"]];
const nav=document.createElement("nav");nav.className="os-nav container";nav.setAttribute("aria-label","Hauptnavigation");
nav.innerHTML='<div class="os-nav-inner">'+sections.map(([id,label])=>'<button type="button" class="os-nav-btn" data-os-view="'+id+'" aria-current="false">'+label+'</button>').join("")+'</div>';
document.querySelector(".site-header")?.insertAdjacentElement("afterend",nav);
const dashboard=document.createElement("section");dashboard.className="os-dashboard container";dashboard.hidden=true;
dashboard.innerHTML='<div class="intro"><span class="eyebrow">GRAFSCHAFTER · ÜBERSICHT</span><h1>Dein Leistungsportal.</h1><p>Die bisherige Kundenkartei bleibt unverändert und lokal verschlüsselt. Über das Menü erreichst du alle Arbeitsbereiche.</p></div><div class="os-metrics"><article class="card"><span class="eyebrow">KUNDENKARTEI</span><h2 id="osCustomerCount">Gesperrt</h2><p>Lokaler verschlüsselter Tresor</p><button type="button" class="button green" data-os-go="kunden">Kunden öffnen</button></article><article class="card"><span class="eyebrow">LEISTUNGSNACHWEISE</span><h2 id="osVisitCount">Leistungen</h2><p>Termine und Monatsnachweise</p><button type="button" class="button green" data-os-go="leistungen">Leistungen öffnen</button></article><article class="card"><span class="eyebrow">ABRECHNUNG</span><h2>Rechnungen</h2><p>Rechnungsvorschau und PDF-Druck</p><button type="button" class="button green" data-os-go="rechnungen">Rechnungen öffnen</button></article><article class="card"><span class="eyebrow">§ 45B</span><h2>Budgetplanung</h2><p>Rechnerische Entlastungsbeträge</p><button type="button" class="button green" data-os-go="budgets">Budgets öffnen</button></article></div>';
nav.insertAdjacentElement("afterend",dashboard);
const cloud=document.querySelector('[aria-label="Optionale verschlüsselte Cloud-Sicherung"]'),budget=document.querySelector('[aria-label="Entlastungsbetrag §45b"]');
const placeholder=document.createElement("section");placeholder.className="os-dashboard container";placeholder.hidden=true;nav.insertAdjacentElement("afterend",placeholder);
function refreshOverview(){const unlocked=document.getElementById("vaultOverlay")?.hidden===true;const count=document.getElementById("kundenAuswahl")?.options.length||0;const customer=document.getElementById("osCustomerCount");if(customer)customer.textContent=unlocked?(Math.max(0,count-1)+" Kunden in Auswahl"):"Tresor gesperrt";const visits=document.querySelectorAll("#visits .visit").length;const el=document.getElementById("osVisitCount");if(el)el.textContent=unlocked?visits+" Termine im Formular":"Tresor gesperrt";}
function setView(view){if(!sections.some(x=>x[0]===view))view="dashboard";
 const work=["kunden","leistungen","rechnungen","einstellungen"].includes(view);
 main.hidden=!work;dashboard.hidden=view!=="dashboard";placeholder.hidden=!["budgets","dokumente"].includes(view);
 kunden.hidden=view!=="kunden";
 const form=document.getElementById("documentForm");if(form)form.hidden=view==="kunden";
 editor.hidden=false;preview.hidden=!["leistungen","rechnungen"].includes(view);
 if(view==="rechnungen")document.querySelector('[data-view="invoice"]')?.click();
 if(view==="leistungen")document.querySelector('[data-view="record"]')?.click();
 if(view==="einstellungen"){editor.querySelectorAll(".section").forEach(el=>el.hidden=true);const ids=["iban","bic","taxId","taxMode","customTax","dueDays"];ids.forEach(id=>document.getElementById(id)?.closest(".section")?.removeAttribute("hidden"))}
 else editor.querySelectorAll(".section").forEach(el=>el.hidden=false);
 if(view==="budgets"&&budget){placeholder.replaceChildren(budget);budget.hidden=false}
 else if(budget)budget.hidden=true;
 if(view==="dokumente"){placeholder.innerHTML='<div class="card" style="padding:24px"><h2>Dokumente</h2><p>Vertrags- und Stundenzettel-Uploads werden erst nach Freigabe des geschützten Cloudspeichers aktiviert. Bitte keine sensiblen Dokumente hochladen.</p></div>'}
 if(cloud)cloud.hidden=view!=="einstellungen";
 if(view==="dashboard")refreshOverview();
 nav.querySelectorAll("[data-os-view]").forEach(b=>{const active=b.dataset.osView===view;b.classList.toggle("active",active);b.setAttribute("aria-current",active?"page":"false")});
 try{history.replaceState(null,"","#"+view)}catch{}
}
nav.addEventListener("click",e=>{const b=e.target.closest("[data-os-view]");if(b)setView(b.dataset.osView)});
dashboard.addEventListener("click",e=>{const b=e.target.closest("[data-os-go]");if(b)setView(b.dataset.osGo)});
setView(location.hash.slice(1)||"dashboard");
window.addEventListener("hashchange",()=>setView(location.hash.slice(1)));
const observer=new MutationObserver(()=>{if(!dashboard.hidden)refreshOverview()});observer.observe(document.getElementById("vaultOverlay"),{attributes:true,attributeFilter:["hidden"]});
})();