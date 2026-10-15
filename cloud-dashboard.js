(()=>{"use strict";
const root=document.querySelector(".os-dashboard");if(!root)return;
const section=document.createElement("section");section.className="card";section.style.padding="20px";
section.innerHTML='<h2>Cloud-Status</h2><p id="osLiveStats" role="status">Cloud-Kennzahlen noch nicht geladen.</p><button type="button" id="osLoadStats">Cloud-Dashboard aktualisieren</button>';
root.append(section);
const out=section.querySelector("#osLiveStats");
section.querySelector("#osLoadStats").addEventListener("click",async()=>{
 out.textContent="Cloud wird geprüft …";
 try{const r=await fetch("/api/dashboard-stats",{credentials:"same-origin",cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Nicht verbunden");
 out.textContent=j.customers+" Kunden · "+j.visits+" Leistungen · "+j.invoices+" Rechnungen · "+j.documents+" Dokumente in Cloudflare D1";
 }catch(e){out.textContent=e.message}
});
})();