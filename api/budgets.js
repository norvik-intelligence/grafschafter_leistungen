const {json,session,query}=require("./_lib");
const org="grafschafter-alltagsservice";
module.exports=async function(req,res){
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method!=="GET")return json(res,405,{error:"Method not allowed"});
 try{
  const rows=await query("SELECT customer_id,allowance_year,allowance_month,amount_cents,used_cents,expiry_date FROM budget_45b_lots WHERE organization_id=? ORDER BY allowance_year DESC,allowance_month DESC LIMIT 500",[org]);
  return json(res,200,{lots:rows,notice:"Rechnerische Daten; Anspruch und Übertragbarkeit fachlich prüfen."});
 }catch{return json(res,503,{error:"Budgetdaten derzeit nicht verfügbar"})}
};
