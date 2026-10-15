const {json,session,sameOrigin,query,crypto}=require("../api/_lib");
const org="grafschafter-alltagsservice";
const MAX_BYTES=4*1024*1024;
const types=new Set(["application/pdf","image/jpeg","image/png","image/webp"]);
function validBase64(s){return typeof s==="string"&&s.length>0&&s.length<=Math.ceil(MAX_BYTES/3)*4+4&&s.length%4===0&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s)}
function signatureOk(data,type){if(type==="application/pdf")return data.subarray(0,5).toString()==="%PDF-";if(type==="image/png")return data.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex"));if(type==="image/jpeg")return data[0]===255&&data[1]===216&&data[2]===255;if(type==="image/webp")return data.toString("ascii",0,4)==="RIFF"&&data.toString("ascii",8,12)==="WEBP";return false}
function r2url(key){const account=process.env.CF_ACCOUNT_ID;const bucket=process.env.CF_R2_BUCKET||"grafschafter-dokumente";if(!/^[0-9a-f]{32}$/.test(account||"")||!/^[a-z0-9-]+$/.test(bucket))throw Error("R2_NOT_CONFIGURED");return "https://api.cloudflare.com/client/v4/accounts/"+account+"/r2/buckets/"+bucket+"/objects/"+key}
async function r2(method,key,body,type){const token=process.env.CF_R2_API_TOKEN;if(!token)throw Error("R2_NOT_CONFIGURED");const headers={Authorization:"Bearer "+token};if(type)headers["Content-Type"]=type;const response=await fetch(r2url(key),{method,headers,body,signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error("R2_UNAVAILABLE");return response}
module.exports=async(req,res)=>{
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method==="GET"){
  const id=req.query?.id;if(typeof id!=="string"||!/^[0-9a-f-]{36}$/i.test(id))return json(res,400,{error:"Ungültige Dokument-ID"});
  try{const rows=await query("SELECT object_key,filename,content_type FROM documents WHERE organization_id=? AND id=? LIMIT 1",[org,id]);if(!rows.length)return json(res,404,{error:"Dokument nicht gefunden"});const item=rows[0];const response=await r2("GET",item.object_key);const bytes=Buffer.from(await response.arrayBuffer());res.statusCode=200;res.setHeader("Content-Type",item.content_type);res.setHeader("Content-Disposition","attachment; filename*=UTF-8''"+encodeURIComponent(item.filename));res.setHeader("Cache-Control","private, no-store");res.setHeader("X-Content-Type-Options","nosniff");return res.end(bytes)}catch{return json(res,503,{error:"Dokument derzeit nicht abrufbar"})}
 }
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Ungültige Herkunft"});
 const {filename,contentType,base64,customerId,documentType="other"}=req.body||{};
 if(typeof filename!=="string"||filename.length<1||filename.length>180||/[\\/\x00-\x1f]/.test(filename)||!types.has(contentType)||!validBase64(base64)||typeof documentType!=="string"||!/^[a-z_]{1,40}$/.test(documentType)||customerId!=null&&!(typeof customerId==="string"&&/^[0-9a-f-]{36}$/i.test(customerId)))return json(res,400,{error:"Ungültige Dokumentdaten"});
 const data=Buffer.from(base64,"base64");if(!data.length||data.length>MAX_BYTES||!signatureOk(data,contentType))return json(res,400,{error:"Dateiinhalt ungültig oder zu groß (max. 4 MB)"});
 try{
  if(customerId){const customer=await query("SELECT id FROM customers WHERE organization_id=? AND id=? LIMIT 1",[org,customerId]);if(!customer.length)return json(res,404,{error:"Kunde nicht gefunden"})}
  const id=crypto.randomUUID(),key=org+"/"+id;
  await r2("PUT",key,data,contentType);
  try{await query("INSERT INTO documents(id,organization_id,customer_id,object_key,filename,content_type,size_bytes,document_type,review_status) VALUES(?,?,?,?,?,?,?,?,?)",[id,org,customerId||null,key,filename,contentType,data.length,documentType,"pending"])}
  catch{try{await r2("DELETE",key)}catch{}return json(res,503,{error:"Dokument-Metadaten konnten nicht gespeichert werden"})}
  return json(res,201,{id,filename,sizeBytes:data.length});
 }catch{return json(res,503,{error:"R2-Upload nicht verfügbar. Berechtigung und Konfiguration prüfen"})}
};
