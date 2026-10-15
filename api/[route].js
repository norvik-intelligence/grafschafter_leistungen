const handlers=Object.freeze({
 "cloud-login":require("../handlers/cloud-login"),
 "cloud-logout":require("../handlers/cloud-logout"),
 "cloud-status":require("../handlers/cloud-status"),
 "cloud-backup":require("../handlers/cloud-backup"),
 "customers":require("../handlers/customers"),
 "visits":require("../handlers/visits"),
 "invoices":require("../handlers/invoices"),
 "company":require("../handlers/company"),
 "documents":require("../handlers/documents"),
 "document-register":require("../handlers/document-register"),
 "invoice-pdf":require("../handlers/invoice-pdf"),
 "invoice-list":require("../handlers/invoice-list"),
 "visit-list":require("../handlers/visit-list"),
 "dashboard-stats":require("../handlers/dashboard-stats"),
 "budgets":require("../handlers/budgets")
});
module.exports=async(req,res)=>{
 const route=Array.isArray(req.query?.route)?null:req.query?.route;
 if(typeof route!=="string"||!Object.prototype.hasOwnProperty.call(handlers,route)){
  res.statusCode=404;res.setHeader("Content-Type","application/json; charset=utf-8");return res.end(JSON.stringify({error:"Not found"}));
 }
 return handlers[route](req,res);
};
