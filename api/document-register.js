const {json,session,sameOrigin,query}=require("./_lib");
const {randomUUID}=require("node:crypto");
const org="grafschafter-alltagsservice";
module.exports=async(req,res)=>{
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Ungültige Herkunft"});
 const {customerId,filename,contentType,sizeBytes}=req.body||{};
 if(typeof filename!=="string"||!filename.trim()||filename.length>180||!/^(application\/pdf|image\/(jpeg|png))$/.test(contentType||"")||!Number.isInteger(sizeBytes)||sizeBytes<1||sizeBytes>10*1024*1024)return json(res,400,{error:"Ungültige Datei (PDF, JPG, PNG bis 10 MB)"});
 try{
  if(customerId){const c=await query("SELECT id FROM customers WHERE organization_id=? AND id=? LIMIT 1",[org,customerId]);if(!c.length)return json(res,404,{error:"Kunde nicht gefunden"})}
  const id=randomUUID(),key=org+"/"+id;
  await query("INSERT INTO documents(id,organization_id,customer_id,object_key,filename,content_type,size_bytes,review_status) VALUES(?,?,?,?,?,?,?,?)",[id,org,customerId||null,key,filename.trim(),contentType,sizeBytes,"pending"]);
  return json(res,201,{id,status:"pending",uploadAvailable:false,message:"Metadaten registriert; Dateiübertragung noch nicht freigeschaltet"});
 }catch{return json(res,503,{error:"Dokumentenregistrierung nicht verfügbar"})}
};
