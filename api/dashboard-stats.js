const {json,session,query}=require("./_lib");
module.exports=async(req,res)=>{
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
 try{
  const org="grafschafter-alltagsservice";
  const [customers,visits,invoices,documents]=await Promise.all([
   query("SELECT COUNT(*) AS total FROM customers WHERE organization_id=?",[org]),
   query("SELECT COUNT(*) AS total FROM visits WHERE organization_id=?",[org]),
   query("SELECT COUNT(*) AS total FROM invoices WHERE organization_id=?",[org]),
   query("SELECT COUNT(*) AS total FROM documents WHERE organization_id=?",[org])
  ]);
  return json(res,200,{customers:customers[0].total,visits:visits[0].total,invoices:invoices[0].total,documents:documents[0].total});
 }catch{return json(res,503,{error:"Cloud-Kennzahlen nicht erreichbar"})}
};