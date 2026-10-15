const {test}=require("node:test");const assert=require("node:assert/strict");
test("invoice draft PDF has valid header",async()=>{const {invoicePdf}=require("../api/_invoice-pdf");const bytes=await invoicePdf({number:"TEST-1",customer:"Testkunde",amountCents:12500});assert.equal(bytes.subarray(0,5).toString(),"%PDF-");assert.ok(bytes.length>500)});
test("invoice draft PDF rejects invalid amounts",async()=>{const {invoicePdf}=require("../api/_invoice-pdf");await assert.rejects(()=>invoicePdf({number:"T",customer:"C",amountCents:-1}))});
