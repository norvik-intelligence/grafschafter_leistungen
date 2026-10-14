const {json,session,sameOrigin}=require("./_lib");
module.exports=function(req,res){
 if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
 if(!sameOrigin(req))return json(res,403,{error:"Origin rejected"});
 res.setHeader("Set-Cookie","grafschafter_cloud_session=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0");
 return json(res,200,{ok:true});
};