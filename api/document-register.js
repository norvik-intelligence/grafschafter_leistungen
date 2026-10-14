const {json,session,sameOrigin}=require("./_lib");
module.exports=async(req,res)=>{
 if(!session(req))return json(res,401,{error:"Anmeldung erforderlich"});
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Ungültige Herkunft"});
 return json(res,501,{error:"Dokumenten-Upload noch nicht freigegeben. R2-Signierung und Upload-Verifikation erforderlich."});
};
