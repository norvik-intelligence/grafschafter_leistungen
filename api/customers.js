const {json,session,sameOrigin,query,crypto}=require("./_lib");
const org="grafschafter-alltagsservice";
module.exports=async function(req,res){
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method==="GET"){try{const rows=await query("SELECT id,customer_number,display_name,status,created_at,updated_at FROM customers WHERE organization_id=? ORDER BY display_name COLLATE NOCASE LIMIT 500",[org]);return json(res,200,{customers:rows})}catch{return json(res,503,{error:"Kundenliste derzeit nicht verfügbar"})}}
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
 const name=String(req.body?.name||"").trim();
 if(name.length<2||name.length>160)return json(res,400,{error:"Kundenname muss 2 bis 160 Zeichen enthalten"});
 const id=crypto.randomUUID();
 try{await query("INSERT INTO customers(id,organization_id,display_name,status) VALUES(?,?,?,'active')",[id,org,name]);return json(res,201,{id,name})}catch{return json(res,503,{error:"Kunde konnte nicht gespeichert werden"})}
};