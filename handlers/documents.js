const {json,session,query}=require("../api/_lib");
const org="grafschafter-alltagsservice";
module.exports=async function(req,res){
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
 try{
  const rows=await query("SELECT id,customer_id,filename,content_type,size_bytes,document_type,review_status,created_at FROM documents WHERE organization_id=? ORDER BY created_at DESC LIMIT 300",[org]);
  return json(res,200,{documents:rows,uploadAvailable:false});
 }catch{return json(res,503,{error:"Dokumentenliste derzeit nicht verfügbar"})}
};
