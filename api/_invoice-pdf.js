const {PDFDocument,StandardFonts}=require("pdf-lib");
function money(cents){return (cents/100).toLocaleString("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2})+" EUR"}
async function invoicePdf({number,customer,amountCents,company="Grafschafter Alltagsservice",issuedOn=new Date().toISOString().slice(0,10)}){
 if(typeof number!=="string"||!number.trim()||number.length>100||typeof customer!=="string"||!customer.trim()||customer.length>160||!Number.isSafeInteger(amountCents)||amountCents<0)throw Error("Ungültige Rechnungsdaten");
 const doc=await PDFDocument.create();const page=doc.addPage([595.28,841.89]);const font=await doc.embedFont(StandardFonts.Helvetica);
 const safe=s=>s.replace(/[^\x20-\x7E]/g,"?");const line=(s,y,size=12)=>page.drawText(safe(s),{x:52,y,size,font});
 line(company,775,18);line("Rechnungsentwurf – keine steuerliche Endrechnung",733,12);line("Nummer: "+number,693);line("Kunde: "+customer,669);line("Datum: "+issuedOn,645);line("Gesamtbetrag: "+money(amountCents),580,16);
 line("Vor Versand Steuerangaben, Leistungszeitraum und Pflichtangaben prüfen.",100,9);
 return Buffer.from(await doc.save());
}
module.exports={invoicePdf};
