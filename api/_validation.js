const {z}=require("zod");
const customer=z.object({name:z.string().trim().min(2).max(160)}).strict();
const invoice=z.object({customerId:z.string().uuid(),number:z.string().trim().min(2).max(80),amountCents:z.number().int().min(0).max(100000000)}).strict();
const visit=z.object({customerId:z.string().uuid(),startsAt:z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/),endsAt:z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/).optional()}).strict().refine(v=>!v.endsAt||v.endsAt>v.startsAt);
module.exports={customer,invoice,visit};
