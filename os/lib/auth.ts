import {createRemoteJWKSet,jwtVerify} from "jose";
import type {NextRequest} from "next/server";
const domain=process.env.CF_ACCESS_TEAM_DOMAIN;
const audience=process.env.CF_ACCESS_AUD;
export async function requireUser(req:NextRequest):Promise<string>{
 if(!domain||!audience)throw new Error("AUTH_NOT_CONFIGURED");
 const token=req.cookies.get("CF_Authorization")?.value||req.headers.get("cf-access-jwt-assertion");
 if(!token)throw new Error("UNAUTHORIZED");
 const issuer="https://"+domain.replace(/^https?:\/\//,"").replace(/\/$/,"");
 const keys=createRemoteJWKSet(new URL(issuer+"/cdn-cgi/access/certs"));
 const {payload}=await jwtVerify(token,keys,{issuer,audience});
 if(typeof payload.sub!=="string"||!payload.sub)throw new Error("UNAUTHORIZED");
 return payload.sub;
}
