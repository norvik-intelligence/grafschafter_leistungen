import {test} from "node:test";
import {strict as assert} from "node:assert";
import {allowance45b,preview45bCharge} from "./budget";
test("monthly allowance is 131 EUR",()=>assert.equal(allowance45b(2026,1).amountCents,13100));
test("oldest expiry used first and private balance remains pending",()=>{const r=preview45bCharge([{id:"new",remainingCents:10000,expiryDate:"2027-06-30",eligible:true},{id:"old",remainingCents:5000,expiryDate:"2026-06-30",eligible:true}],17000,"2026-06-01");assert.deepEqual(r.allocations,[{lotId:"old",amountCents:5000},{lotId:"new",amountCents:10000}]);assert.equal(r.uncoveredCents,2000);assert.equal(r.requiresApproval,true)});
test("expired and unverified amounts excluded",()=>assert.equal(preview45bCharge([{id:"old",remainingCents:9000,expiryDate:"2026-06-30",eligible:true},{id:"unverified",remainingCents:9000,expiryDate:"2027-06-30",eligible:false}],10000,"2026-07-01").uncoveredCents,10000));
