import {jwtVerify,SignJWT} from "jose";
import type {NextRequest} from "next/server";
function secret(){const s=process.env.OS_SESSION_SECRET;if(!s||s.length<32)throw new Error("AUTH_NOT_CONFIGURED");return new TextEncoder().encode(s)}
export async function signSession(){return new SignJWT({role:"owner"}).setProtectedHeader({alg:"HS256"}).setSubject("local-owner").setIssuedAt().setExpirationTime("8h").setIssuer("grafschafter-os").sign(secret())}
export async function requireUser(req:NextRequest):Promise<string>{const token=req.cookies.get("grafschafter_session")?.value;if(!token)throw new Error("UNAUTHORIZED");try{const {payload}=await jwtVerify(token,secret(),{issuer:"grafschafter-os",algorithms:["HS256"]});if(payload.sub!=="local-owner")throw new Error("UNAUTHORIZED");return payload.sub}catch{throw new Error("UNAUTHORIZED")}}
