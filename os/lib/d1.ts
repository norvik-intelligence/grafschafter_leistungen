type D1Result<T>={success:boolean;errors?:{message:string}[];result?:{results:T[];success:boolean}[]};
export async function d1<T=Record<string,unknown>>(sql:string,params:(string|number|null)[]=[]):Promise<T[]>{
 const {CF_ACCOUNT_ID,CF_D1_DATABASE_ID,CF_D1_API_TOKEN}=process.env;
 if(!CF_ACCOUNT_ID||!CF_D1_DATABASE_ID||!CF_D1_API_TOKEN)throw new Error("DATABASE_NOT_CONFIGURED");
 const response=await fetch("https://api.cloudflare.com/client/v4/accounts/"+CF_ACCOUNT_ID+"/d1/database/"+CF_D1_DATABASE_ID+"/query",{
 method:"POST",headers:{"Authorization":"Bearer "+CF_D1_API_TOKEN,"Content-Type":"application/json"},
 body:JSON.stringify({sql,params}),cache:"no-store"});
 const json=await response.json() as D1Result<T>;
 if(!response.ok||!json.success||!json.result?.[0]?.success)throw new Error("D1_QUERY_FAILED");
 return json.result[0].results;
}
