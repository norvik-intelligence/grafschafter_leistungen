const {test}=require("node:test");
const assert=require("node:assert/strict");
const {customer,invoice,visit}=require("../api/_validation");
const id="123e4567-e89b-42d3-a456-426614174000";
test("customer validation",()=>{assert.equal(customer.safeParse({name:"A"}).success,false);assert.equal(customer.safeParse({name:" Test "}).data.name,"Test");assert.equal(customer.safeParse({name:"Test",role:"admin"}).success,false)});
test("invoice validation",()=>{assert.equal(invoice.safeParse({customerId:id,number:"R-1",amountCents:12500}).success,true);assert.equal(invoice.safeParse({customerId:id,number:"R-1",amountCents:-1}).success,false)});
test("visit date order",()=>{assert.equal(visit.safeParse({customerId:id,startsAt:"2026-10-14T12:00",endsAt:"2026-10-14T11:00"}).success,false);assert.equal(visit.safeParse({customerId:id,startsAt:"2026-10-14T11:00",endsAt:"2026-10-14T12:00"}).success,true)});
