const {json,session,query}=require("../api/_lib");
const {invoicePdf}=require("../api/_invoice-pdf");
const org="grafschafter-alltagsservice";
module.exports=async(req,res)=>{
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
 const id=typeof req.query?.id==="string"?req.query.id:"";
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return json(res,400,{error:"Ungültige ID"});
 try{
  const rows=await query("SELECT i.invoice_number,i.amount_cents,c.display_name FROM invoices i JOIN customers c ON c.id=i.customer_id AND c.organization_id=i.organization_id WHERE i.organization_id=? AND i.id=? LIMIT 1",[org,id]);
  if(!rows.length)return json(res,404,{error:"Rechnung nicht gefunden"});
  const r=rows[0],pdf=await invoicePdf({number:r.invoice_number,customer:r.display_name,amountCents:r.amount_cents});
  res.status(200).setHeader("Content-Type","application/pdf").setHeader("Content-Disposition","attachment; filename=Rechnungsentwurf.pdf").setHeader("Cache-Control","no-store").send(pdf);
 }catch{return json(res,503,{error:"PDF derzeit nicht verfügbar"})}
};
