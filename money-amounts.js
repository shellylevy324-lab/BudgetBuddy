(function(){
"use strict";
const $=id=>document.getElementById(id);
const student=window.BuddySkillFramework?.selectedStudent();
const settings=window.BuddySkillFramework?.settingsFrom(student)||{};
const shared=window.BuddySkillFramework?.normalizeShared(settings)||{};
const amountSettings=settings.activity_teaching_settings?.moneyAmounts||{};
const level=Math.max(1,Math.min(4,Number(amountSettings.level||1)));
const trialCount=Math.max(4,Math.min(20,Number(amountSettings.trialCount||8)));
const maxDollars=Math.max(1,Math.min(20,Number(amountSettings.maxDollars||5)));
const includePennies=amountSettings.includePennies!==false;
const reinforcement=window.BuddySkillFramework?.createReinforcement({shared,cloudPackage:student?.cloudReinforcementPackage});
const session=window.BuddySkillFramework?.createSession({studentId:student?.id||"local-student",activityKey:"money-amounts",activityName:"Build the Amount",promptingMode:shared.promptingMode,moduleVersion:"3.1.0",reinforcementPackageId:String(settings.reinforcement_package||"").startsWith("library:")?String(settings.reinforcement_package).slice(8):null});
const DENOMS=[
 {id:"penny",label:"1¢",cents:1,type:"coin"},{id:"nickel",label:"5¢",cents:5,type:"coin"},{id:"dime",label:"10¢",cents:10,type:"coin"},{id:"quarter",label:"25¢",cents:25,type:"coin"},
 {id:"one",label:"$1",cents:100,type:"bill"},{id:"five",label:"$5",cents:500,type:"bill"},{id:"ten",label:"$10",cents:1000,type:"bill"}
];
let trials=[],index=0,trial=null,selected=[],accepting=false;
function show(id){["setupScreen","trialScreen","summaryScreen"].forEach(x=>$(x).hidden=x!==id)}
function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function money(cents){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100)}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function makeTrial(){
 const step=includePennies?1:5;
 const stepped=(min,max)=>Math.max(step,Math.min(max,Math.round(randomInt(min,max)/step)*step));
 if(level===1){return{type:"build-amount",target:stepped(step,99)};}
 if(level===2){const cents=stepped(step,maxDollars*100);return{type:"price-tag",price:cents,target:cents};}
 if(level===3){let price=stepped(step,Math.max(step,maxDollars*100-1));if(price%100===0)price=Math.max(step,price-step);const target=Math.ceil(price/100)*100;return{type:"next-dollar",price,target};}
 const price=stepped(25,Math.max(25,maxDollars*100-1));const paid=Math.ceil(price/100)*100;return{type:"make-change",price,paid,target:paid-price};
}
function buildTrials(){return Array.from({length:trialCount},makeTrial)}
function allowedDenoms(){
 let list=DENOMS.filter(d=>includePennies||d.id!=="penny");
 if(level===1)list=list.filter(d=>d.cents<100);
 if(level===3)list=list.filter(d=>d.type==="bill"&&d.cents<=Math.max(1000,Math.ceil(maxDollars/5)*500));
 if(level===4&&trial?.target<100)list=list.filter(d=>d.cents<100);
 return list;
}
function renderTask(){
 const visual=$("taskVisual");visual.innerHTML="";
 if(trial.type==="build-amount"){
  $("direction").textContent="Build this amount.";
  visual.innerHTML=`<div class="amount-prompt"><span class="amount-prompt-label">Make</span><strong class="amount-prompt-value">${money(trial.target)}</strong></div>`;
 }else if(trial.type==="price-tag"){
  $("direction").textContent="Use money to pay the exact price.";
  visual.innerHTML=`<div class="price-tag"><span class="price-tag-label">Price</span><strong class="price-tag-value">${money(trial.price)}</strong></div>`;
 }else if(trial.type==="next-dollar"){
  $("direction").textContent="Pay with the next dollar up.";
  visual.innerHTML=`<div class="price-tag"><span class="price-tag-label">Price</span><strong class="price-tag-value">${money(trial.price)}</strong></div>`;
 }else{
  $("direction").textContent="Create the correct change.";
  visual.innerHTML=`<div class="payment-card"><div class="price-tag"><span class="price-tag-label">Price</span><strong class="price-tag-value">${money(trial.price)}</strong></div><div class="payment-line">Paid with <strong>${money(trial.paid)}</strong></div></div>`;
 }
}
function renderBank(){
 const bank=$("denominationBank");bank.innerHTML="";
 allowedDenoms().forEach(d=>{const b=document.createElement("button");b.type="button";b.className=`denomination-button ${d.type}-choice ${d.id}`;b.textContent=d.label;b.setAttribute("aria-label",`Add ${d.label}`);b.onclick=()=>addMoney(d);bank.appendChild(b);});
}
function renderSelected(){
 const tray=$("selectedMoney");tray.innerHTML="";
 if(!selected.length)tray.innerHTML='<p class="empty-tray">Choose money below.</p>';
 selected.forEach(d=>{const el=document.createElement("span");el.className=`money-piece ${d.type} ${d.id}`;el.textContent=d.label;tray.appendChild(el);});
 $("selectedTotal").textContent=money(selected.reduce((sum,d)=>sum+d.cents,0));
}
function addMoney(d){if(!accepting)return;selected.push(d);renderSelected()}
function next(){
 if(index>=trials.length)return finish();
 trial=trials[index];selected=[];accepting=true;
 $("trialProgress").textContent=`Trial ${index+1} of ${trials.length}`;
 $("progressFill").style.width=`${index/trials.length*100}%`;
 $("feedback").textContent="";$("feedback").className="feedback";
 renderTask();renderBank();renderSelected();reinforcement?.renderTokenBoard($("amountTokenBoard"));
 trial.started=performance.now();
}
async function start(){trials=buildTrials();index=0;await session?.start();show("trialScreen");next()}
function check(){
 if(!accepting)return;
 const total=selected.reduce((sum,d)=>sum+d.cents,0);const correct=total===trial.target;const latency=(performance.now()-trial.started)/1000;
 accepting=false;$("feedback").className=`feedback ${correct?"correct":"incorrect"}`;
 if(correct){$("feedback").textContent="Nice job! That is the correct amount.";reinforcement?.award(true);}else{$("feedback").textContent=`That makes ${money(total)}. The correct amount is ${money(trial.target)}.`;}
 window.BuddySkillFramework?.speak($("feedback").textContent);
 session?.record({trialNumber:index+1,targetCents:trial.target,responseCents:total,correct,independent:true,promptLevel:"Independent",latencySeconds:latency,level,trialType:trial.type,priceCents:trial.price||null,paidCents:trial.paid||null,denominations:selected.map(d=>d.id)});
 reinforcement?.renderTokenBoard($("amountTokenBoard"));setTimeout(()=>{index++;next()},correct?1250:2100);
}
async function finish(){accepting=false;await session?.end();reinforcement?.renderCompletion($("amountCompletion"),"Build the Amount");show("summaryScreen")}
$("startSession").addEventListener("click",start);$("checkAnswer").addEventListener("click",check);$("undoMoney").addEventListener("click",()=>{if(accepting){selected.pop();renderSelected()}});$("clearMoney").addEventListener("click",()=>{if(accepting){selected=[];renderSelected()}});$("endEarly").addEventListener("click",finish);$("returnToActivities").addEventListener("click",()=>location.replace("training-station.html?v=3.1.0"));
if(student)$("studentWelcome").textContent=`Ready to practice, ${student.preferredName||student.firstName||"Student"}?`;
const descriptions={1:"Build a named amount using coins.",2:"Make the exact amount shown on a price tag.",3:"Pay for a price using the next whole dollar up.",4:"Create the correct amount of change after paying."};$("levelDescription").textContent=descriptions[level];
})();
