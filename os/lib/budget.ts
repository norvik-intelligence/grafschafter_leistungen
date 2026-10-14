export const MONTHLY_45B_CENTS=13100;
export function expiryForAllowanceYear(year:number){return `${year+1}-06-30`;}
export function allowance45b(year:number,month:number){if(year<2025||month<1||month>12)throw new Error("Unsupported allowance period");return {year,month,amountCents:MONTHLY_45B_CENTS,expiryDate:expiryForAllowanceYear(year)};}
export type BudgetLot={id:string;remainingCents:number;expiryDate:string;eligible:boolean};
export function preview45bCharge(lots:BudgetLot[],amountCents:number,onDate:string){
 if(!Number.isInteger(amountCents)||amountCents<0)throw new Error("Invalid amount");
 let remainder=amountCents;const allocations:{lotId:string;amountCents:number}[]=[];
 for(const lot of [...lots].filter(x=>x.eligible&&x.expiryDate>=onDate&&x.remainingCents>0).sort((a,b)=>a.expiryDate.localeCompare(b.expiryDate))){
 const take=Math.min(lot.remainingCents,remainder);if(take>0)allocations.push({lotId:lot.id,amountCents:take});remainder-=take;if(remainder===0)break;
 }
 return {allocations,uncoveredCents:remainder,requiresApproval:true};
}
