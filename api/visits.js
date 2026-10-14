const {visit}=require("./_validation");
const {json,session,sameOrigin,query,crypto}=require("./_lib");const org="grafschafter-alltagsservice";
module.exports=async(req,res)=>{if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});try{
if(req.method==="GET"){const rows=await query("SELECT v.id,v.customer_id,c.display_name AS customer,v.starts_at,v.ends_at,v.status FROM visits v JOIN customers c ON c.id=v.customer_id AND c.organization_id=v.organization_id WHERE v.organization_id=? ORDER BY v.starts_at DESC LIMIT 200",[org]);return json(res,200,{visits:rows})}
if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
const {customerId,startsAt,endsAt}=req.body||{};if(!visit.safeParse(req.body).success)return json(res,400,{error:"Ungültige Eingabe"});
const c=await query("SELECT id FROM customers WHERE organization_id=? AND id=? LIMIT 1",[org,customerId]);if(!c.length)return json(res,404,{error:"Kunde fehlt"});
const id=crypto.randomUUID();await query("INSERT INTO visits(id,organization_id,customer_id,starts_at,ends_at,status) VALUES(?,?,?,?,?,'planned')",[id,org,customerId,startsAt,endsAt||null]);return json(res,201,{id});
}catch{return json(res,503,{error:"Cloud-Datenbank nicht erreichbar"})}};