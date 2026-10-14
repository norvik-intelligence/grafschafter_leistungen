const {test}=require("node:test");
const assert=require("node:assert/strict");
const {z}=require("zod");
const customer=z.object({name:z.string().trim().min(2).max(160)}).strict();
const invoice=z.object({customerId:z.string().uuid(),number:z.string().trim().min(2).max(80),amountCents:z.number().int().min(0).max(100000000)}).strict();
const visit=z.object({customerId:z.string().uuid(),startsAt:z.iso.datetime({local:true}),endsAt:z.iso.datetime({local:true}).optional()}).strict().refine(v=>!v.endsAt||v.endsAt>v.startsAt);
test("customer validation",()=>{assert.equal(customer.safeParse({name:"A"}).success,false);assert.equal(customer.safeParse({name:" Test "}).data.name,"Test")});
test("invoice validation",()=>{assert.equal(invoice.safeParse({customerId:"no",number:"A",amountCents:-1}).success,false)});
test("visit date order",()=>{const id="123e4567-e89b-42d3-a456-426614174000";assert.equal(visit.safeParse({customerId:id,startsAt:"2026-10-14T12:00:00",endsAt:"2026-10-14T11:00:00"}).success,false)});
