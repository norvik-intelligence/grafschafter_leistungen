import {NextRequest,NextResponse} from "next/server";
import {jwtVerify} from "jose";
export async function middleware(req:NextRequest){
 const p=req.nextUrl.pathname;
 if(p==="/login"||p==="/api/auth/login")return NextResponse.next();
 const s=process.env.OS_SESSION_SECRET;
 if(!s||s.length<32)return new NextResponse("Anmeldung nicht konfiguriert",{status:503});
 const token=req.cookies.get("grafschafter_session")?.value;
 if(token){try{const {payload}=await jwtVerify(token,new TextEncoder().encode(s),{issuer:"grafschafter-os",algorithms:["HS256"]});if(payload.sub==="local-owner")return NextResponse.next()}catch{}}
 if(p.startsWith("/api/"))return NextResponse.json({error:"Unauthorized"},{status:401});
 const url=req.nextUrl.clone();url.pathname="/login";url.search="";return NextResponse.redirect(url);
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
