import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {requireUser} from "@/lib/auth";
import {d1} from "@/lib/d1";
import {preview45bCharge} from "@/lib/budget";
export const runtime="nodejs";
const Input=z.object({customerId:z.string().uuid(),amountCents:z.number().int().min(0).max(10000000),date:z.iso.date()});
export async function POST(req:NextRequest){try{const sub=await requireUser(req);const u=(await d1<{organization_id:string}>("SELECT organization_id FROM users WHERE external_auth_id=? AND active=1 LIMIT 1",[sub]))[0];if(!u)return NextResponse.json({error:"Forbidden"},{status:403});const p=Input.safeParse(await req.json());if(!p.success)return NextResponse.json({error:"Invalid data"},{status:400});const {customerId,amountCents,date}=p.data;const c=await d1<{id:string}>("SELECT id FROM customers WHERE id=? AND organization_id=?",[customerId,u.organization_id]);if(!c[0])return NextResponse.json({error:"Not found"},{status:404});const rows=await d1<{id:string;amount_cents:number;used_cents:number;expiry_date:string;verified_by:string|null}>("SELECT id,amount_cents,used_cents,expiry_date,verified_by FROM budget_45b_lots WHERE customer_id=? AND organization_id=?",[customerId,u.organization_id]);return NextResponse.json(preview45bCharge(rows.map(x=>({id:x.id,remainingCents:x.amount_cents-x.used_cents,expiryDate:x.expiry_date,eligible:!!x.verified_by})),amountCents,date),{headers:{"Cache-Control":"no-store"}})}catch{return NextResponse.json({error:"Unavailable"},{status:503})}}
