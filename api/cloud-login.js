const {config,json,newSession,sameOrigin,crypto}=require("./_lib");
module.exports=async function(req,res){
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
 const c=config();if(!c.OS_ADMIN_PASSWORD_SCRYPT||!c.OS_SESSION_SECRET||c.OS_SESSION_SECRET.length<32)return json(res,503,{error:"Cloud login not configured"});
 const pwd=req.body?.password;if(typeof pwd!=="string"||pwd.length>512)return json(res,401,{error:"Ungültige Anmeldung"});
 const [salt,hex]=c.OS_ADMIN_PASSWORD_SCRYPT.split(":");if(!salt||!hex)return json(res,503,{error:"Cloud login not configured"});
 try{const a=crypto.scryptSync(pwd,salt,64),b=Buffer.from(hex,"hex");if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return json(res,401,{error:"Ungültige Anmeldung"});
 res.setHeader("Set-Cookie","grafschafter_cloud_session="+newSession()+"; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800");return json(res,200,{ok:true});
 }catch{return json(res,503,{error:"Cloud login unavailable"})}
};
