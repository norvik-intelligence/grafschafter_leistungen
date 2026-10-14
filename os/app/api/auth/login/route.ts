import {NextRequest,NextResponse} from "next/server";
import {scryptSync,timingSafeEqual} from "node:crypto";
import {signSession} from "@/lib/auth";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const hash=process.env.OS_ADMIN_PASSWORD_SCRYPT,secret=process.env.OS_SESSION_SECRET;
 if(!hash||!secret||secret.length<32)return NextResponse.json({error:"Login nicht konfiguriert"},{status:503});
 let password="";try{const j=await req.json();password=typeof j.password==="string"?j.password:""}catch{}
 if(password.length>512)return NextResponse.json({error:"Ungültige Anmeldung"},{status:401});
 const [salt,expected]=hash.split(":");
 if(!salt||!expected)return NextResponse.json({error:"Login nicht konfiguriert"},{status:503});
 const got=scryptSync(password,salt,64);const want=Buffer.from(expected,"hex");
 if(want.length!==got.length||!timingSafeEqual(got,want))return NextResponse.json({error:"Ungültiges Passwort"},{status:401,headers:{"Cache-Control":"no-store"}});
 const token=await signSession();const response=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 response.cookies.set("grafschafter_session",token,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:8*3600});
 return response;
}
