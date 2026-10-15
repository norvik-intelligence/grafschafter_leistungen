const {json,session,sameOrigin,query,crypto}=require("./_lib");
const org="grafschafter-alltagsservice";
const specs={
 visits:{columns:["customer_id","starts_at","ends_at","break_minutes","status","service_code"],required:["customer_id","starts_at"],select:"id,customer_id,starts_at,ends_at,break_minutes,status,service_code,created_at",statuses:["planned","completed","cancelled"]},
 invoices:{columns:["customer_id","invoice_number","period","status","amount_cents","due_on","issued_on"],required:["customer_id","invoice_number"],select:"id,customer_id,invoice_number,period,status,amount_cents,due_on,issued_on,created_at",statuses:["draft","issued","paid","cancelled"]},
 budget_45b_lots:{columns:["customer_id","allowance_year","allowance_month","amount_cents","used_cents","expiry_date"],required:["customer_id","allowance_year","allowance_month","expiry_date"],select:"id,customer_id,allowance_year,allowance_month,amount_cents,used_cents,expiry_date,created_at"}
};
module.exports=async function(req,res){
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 const type=String(req.query?.type||"");const s=specs[type];if(!s)return json(res,400,{error:"Unbekannter Bereich"});
 if(req.method==="GET"){try{return json(res,200,{items:await query("SELECT "+s.select+" FROM "+type+" WHERE organization_id=? ORDER BY created_at DESC LIMIT 500",[org])})}catch{return json(res,503,{error:"Cloud-Abfrage fehlgeschlagen"})}}
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
 const b=req.body||{};if(!b||typeof b!=="object"||Array.isArray(b))return json(res,400,{error:"Ungültige Eingabe"});
 for(const k of s.required)if(b[k]===undefined||b[k]===null||b[k]==="")return json(res,400,{error:"Pflichtfeld fehlt: "+k});
 for(const k of Object.keys(b))if(!s.columns.includes(k))return json(res,400,{error:"Unbekanntes Feld"});
 const v={...b};
 for(const k of ["customer_id","invoice_number","period","service_code","starts_at","ends_at","due_on","issued_on","expiry_date"]){if(v[k]!==undefined&&(typeof v[k]!=="string"||v[k].length>160))return json(res,400,{error:"Ungültiges Feld: "+k})}
 for(const k of ["break_minutes","amount_cents","used_cents","allowance_year","allowance_month"]){if(v[k]!==undefined&&(!Number.isSafeInteger(v[k])||v[k]<0||v[k]>100000000))return json(res,400,{error:"Ungültiger Zahlenwert"})}
 if(v.allowance_month!==undefined&&(v.allowance_month<1||v.allowance_month>12))return json(res,400,{error:"Monat ungültig"});
 if(v.status!==undefined&&!s.statuses?.includes(v.status))return json(res,400,{error:"Status ungültig"});
 if(v.customer_id.length>100)return json(res,400,{error:"Kundenkennung ungültig"});
 try{
 const found=await query("SELECT id FROM customers WHERE id=? AND organization_id=? LIMIT 1",[v.customer_id,org]);if(!found.length)return json(res,404,{error:"Kunde nicht gefunden"});
 const id=crypto.randomUUID();const cols=s.columns.filter(k=>v[k]!==undefined);
 await query("INSERT INTO "+type+" (id,organization_id,"+cols.join(",")+") VALUES ("+["?","?",...cols.map(()=>"?")].join(",")+")",[id,org,...cols.map(k=>v[k])]);
 return json(res,201,{id});
 }catch{return json(res,503,{error:"Speichern fehlgeschlagen"})}
};