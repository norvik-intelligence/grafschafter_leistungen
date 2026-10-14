import {NextRequest,NextResponse} from "next/server";
import {createRemoteJWKSet,jwtVerify} from "jose";
export async function middleware(req:NextRequest){
 const domain=process.env.CF_ACCESS_TEAM_DOMAIN, audience=process.env.CF_ACCESS_AUD;
 if(!domain||!audience)return new NextResponse("Zugriffsschutz nicht eingerichtet",{status:503});
 const token=req.cookies.get("CF_Authorization")?.value||req.headers.get("cf-access-jwt-assertion");
 if(!token)return new NextResponse("Anmeldung erforderlich. Öffne die Anwendung über Cloudflare Access.",{status:401});
 try{const issuer="https://"+domain.replace(/^https?:\/\//,"").replace(/\/$/,"");await jwtVerify(token,createRemoteJWKSet(new URL(issuer+"/cdn-cgi/access/certs")),{issuer,audience});return NextResponse.next()}catch{return new NextResponse("Ungültige oder abgelaufene Anmeldung",{status:401})}
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
