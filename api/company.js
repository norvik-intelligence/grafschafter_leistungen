const {json,session,sameOrigin,query}=require("./_lib");const org="grafschafter-alltagsservice";
module.exports=async(req,res)=>{if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});try{
if(req.method==="GET"){const rows=await query("SELECT company_name,owner_name,address,ik_number,tax_number,bank_name,iban,bic FROM company_settings WHERE organization_id=? LIMIT 1",[org]);return json(res,200,{settings:rows[0]||null})}
if(req.method!=="PUT")return json(res,405,{error:"Method not allowed"});if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
const fields=["company_name","owner_name","address","ik_number","tax_number","bank_name","iban","bic"];const v=fields.map(k=>req.body?.[k]);if(v.some(x=>typeof x!=="string"||x.length>500))return json(res,400,{error:"Ungültige Firmendaten"});
await query("INSERT INTO company_settings(organization_id,"+fields.join(",")+") VALUES("+Array(9).fill("?").join(",")+") ON CONFLICT(organization_id) DO UPDATE SET "+fields.map(k=>k+"=excluded."+k).join(",")+",updated_at=CURRENT_TIMESTAMP",[org,...v]);return json(res,200,{ok:true});
}catch{return json(res,503,{error:"Firmendaten nicht verfügbar"})}};