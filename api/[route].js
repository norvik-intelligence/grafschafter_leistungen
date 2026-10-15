const handlers=Object.freeze({
 "invoice-list":require("../handlers/invoice-list"),
 "visit-list":require("../handlers/visit-list"),
 "dashboard-stats":require("../handlers/dashboard-stats"),
 "budgets":require("../handlers/budgets")
});
module.exports=async(req,res)=>{
 const name=Array.isArray(req.query?.route)?null:req.query?.route;
 if(typeof name!=="string"||!Object.prototype.hasOwnProperty.call(handlers,name)){
  res.statusCode=404;res.setHeader("Content-Type","application/json; charset=utf-8");return res.end(JSON.stringify({error:"Not found"}));
 }
 return handlers[name](req,res);
};
