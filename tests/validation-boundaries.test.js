const {test}=require("node:test");
const assert=require("node:assert/strict");
const {customer,invoice,visit}=require("../api/_validation");
const id="123e4567-e89b-42d3-a456-426614174000";
test("rejects unknown fields",()=>{
 assert.equal(customer.safeParse({name:"Test",isAdmin:true}).success,false);
 assert.equal(invoice.safeParse({customerId:id,number:"R-1",amountCents:100,isAdmin:true}).success,false);
});
test("rejects noninteger or excessive invoice amounts",()=>{
 for(const amountCents of [-1,1.5,100000001,NaN,Infinity])assert.equal(invoice.safeParse({customerId:id,number:"R-1",amountCents}).success,false);
});
test("rejects missing customer or invalid visit interval",()=>{
 assert.equal(visit.safeParse({customerId:"",startsAt:"2026-10-15T12:00"}).success,false);
 assert.equal(visit.safeParse({customerId:id,startsAt:"2026-10-15T12:00",endsAt:"2026-10-15T11:00"}).success,false);
});
