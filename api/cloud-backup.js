const {json,session,sameOrigin,query}=require("./_lib");
module.exports=async function(req,res){
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method==="GET"){try{const rows=await query("SELECT payload,updated_at FROM encrypted_vault_backups WHERE organization_id=? LIMIT 1",["grafschafter-alltagsservice"]);return json(res,200,{backup:rows[0]?JSON.parse(rows[0].payload):null,updatedAt:rows[0]?.updated_at||null})}catch{return json(res,503,{error:"Cloud-Speicher nicht erreichbar"})}}
 if(req.method!=="PUT")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
 const p=req.body?.backup;
 if(!p||p.format!=="grafschafter-vault"||p.version!==1||p.iterations!==310000||!["salt","iv","cipher"].every(k=>typeof p[k]==="string")||p.cipher.length>12000000)return json(res,400,{error:"Ungültiges verschlüsseltes Backup"});
 try{await query("INSERT INTO encrypted_vault_backups (organization_id,payload,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(organization_id) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP",["grafschafter-alltagsservice",JSON.stringify(p)]);return json(res,200,{ok:true})}catch{return json(res,503,{error:"Cloud-Speicher nicht erreichbar"})}
};
