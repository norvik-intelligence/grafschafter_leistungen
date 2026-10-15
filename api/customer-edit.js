const {json,session,sameOrigin,query}=require("./_lib");const org="grafschafter-alltagsservice";
module.exports=async(req,res)=>{if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});try{
if(req.method==="GET"){const rows=await query("SELECT id,display_name,customer_number,status,created_at FROM customers WHERE organization_id=? ORDER BY display_name LIMIT 500",[org]);return json(res,200,{customers:rows})}
if(req.method!=="PATCH")return json(res,405,{error:"Method not allowed"});if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
const id=req.body?.id,name=req.body?.name,status=req.body?.status;
if(!/^[a-f0-9-]{36}$/i.test(id||"")||typeof name!=="string"||name.trim().length<2||name.length>160||!["active","inactive"].includes(status))return json(res,400,{error:"Ungültige Eingabe"});
await query("UPDATE customers SET display_name=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND organization_id=?",[name.trim(),status,id,org]);return json(res,200,{ok:true});
}catch{return json(res,503,{error:"Cloud-Kundenverwaltung nicht verfügbar"})}};