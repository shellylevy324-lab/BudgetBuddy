(function(){
"use strict";
const $=id=>document.getElementById(id);
const student=window.BuddySkillFramework?.selectedStudent();
const settings=window.BuddySkillFramework?.settingsFrom(student)||{};
const shared=window.BuddySkillFramework?.normalizeShared(settings)||{};
const moneySettings=settings.activity_teaching_settings?.moneyIdentification||{};
const level=Number(moneySettings.level||1);
const trialCount=Math.max(4,Math.min(20,Number(moneySettings.trialCount||10)));
const selectedCoins=Array.isArray(moneySettings.coins)&&moneySettings.coins.length?moneySettings.coins:["penny","nickel","dime","quarter"];
const reinforcement=window.BuddySkillFramework?.createReinforcement({shared,cloudPackage:student?.cloudReinforcementPackage});
const session=window.BuddySkillFramework?.createSession({studentId:student?.id||"local-student",activityKey:"money-identification",activityName:"Money Identification",promptingMode:shared.promptingMode,moduleVersion:"3.0.2",reinforcementPackageId:String(settings.reinforcement_package||"").startsWith("library:")?String(settings.reinforcement_package).slice(8):null});
const BASE="https://www.usmint.gov/content/dam/usmint/coins/";
const COINS={
 penny:{id:"penny",name:"penny",cents:1,heads:BASE+"circulating-coins/2025-lincoln-penny-uncirculated-obverse-philadelphia.jpg",tails:BASE+"circulating-coins/2025-lincoln-penny-uncirculated-reverse.jpg",labels:["1¢","1 cent","$0.01"]},
 nickel:{id:"nickel",name:"nickel",cents:5,heads:BASE+"circulating-coins/2025-jefferson-nickel-uncirculated-obverse-philadelphia.jpg",tails:BASE+"circulating-coins/2025-jefferson-nickel-uncirculated-reverse.jpg",labels:["5¢","5 cents","$0.05"]},
 dime:{id:"dime",name:"dime",cents:10,heads:BASE+"circulating-coins/2025-roosevelt-dime-uncirculated-obverse-philadelphia.jpg",tails:BASE+"circulating-coins/2025-roosevelt-dime-uncirculated-reverse.jpg",labels:["10¢","10 cents","$0.10"]},
 quarter:{id:"quarter",name:"quarter",cents:25,heads:BASE+"american-women-quarters/2025-american-women-quarters-coin-uncirculated-obverse-philadelphia.jpg",tails:BASE+"american-women-quarters/2025-american-women-quarters-coin-ida-wells-uncirculated-reverse.jpg",labels:["25¢","25 cents","$0.25"]}
};
const activeCoins=selectedCoins.map(id=>COINS[id]).filter(Boolean);
let order=[],index=0,trial=null,accepting=false;
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function show(id){["setupScreen","trialScreen","summaryScreen"].forEach(x=>$(x).hidden=x!==id)}
function imageCard(coin,side,button=false){const el=document.createElement(button?"button":"div");el.className=`coin-photo-card ${button?"coin-choice":""}`;if(button)el.type="button";const img=document.createElement("img");img.src=coin[side];img.alt=`${coin.name}, ${side}`;img.loading="eager";el.appendChild(img);return el}
async function start(){order=Array.from({length:trialCount},(_,i)=>activeCoins[i%activeCoins.length]);order=shuffle(order);index=0;await session?.start();show("trialScreen");next()}
function next(){if(index>=order.length)return finish();const target=order[index];trial={target,started:performance.now()};accepting=true;$("trialProgress").textContent=`Trial ${index+1} of ${order.length}`;$("progressFill").style.width=`${index/order.length*100}%`;$("promptStatus").textContent="Independent";$("feedback").textContent="";const visual=$("moneyVisual");const grid=$("answerGrid");visual.innerHTML="";grid.innerHTML="";
 if(level===1){
   $("direction").textContent="Find the other side of this coin.";visual.appendChild(imageCard(target,"heads"));
   shuffle(activeCoins).forEach(c=>{const b=imageCard(c,"tails",true);b.setAttribute("aria-label",`${c.name} tails`);b.onclick=()=>answer(c.id===target.id,b,`${c.id}-tails`);grid.appendChild(b)});
 }else{
   const side=Math.random()<.5?"heads":"tails";$("direction").textContent="How much is this coin worth?";visual.appendChild(imageCard(target,side));
   const correctLabel=target.labels[Math.floor(Math.random()*target.labels.length)];
   const distractors=shuffle(activeCoins.filter(c=>c.id!==target.id)).slice(0,3).map(c=>c.labels[Math.floor(Math.random()*c.labels.length)]);
   shuffle([correctLabel,...distractors]).forEach(label=>{const b=document.createElement("button");b.className="answer-button";b.type="button";b.textContent=label;b.onclick=()=>answer(target.labels.includes(label),b,label);grid.appendChild(b)});
 }
 reinforcement?.renderTokenBoard($("moneyTokenBoard"));
}
function answer(correct,button,response){if(!accepting)return;accepting=false;const latency=(performance.now()-trial.started)/1000;button.classList.add(correct?"correct-model":"incorrect");if(!correct){if(level===1){[...$("answerGrid").children].find(b=>b.getAttribute("aria-label")===`${trial.target.name} tails`)?.classList.add("correct-model")}else{[...$("answerGrid").children].find(b=>trial.target.labels.includes(b.textContent))?.classList.add("correct-model")}}$("feedback").textContent=correct?"Nice job!":level===1?`That is the other side of the ${trial.target.name}.`:`A ${trial.target.name} is worth ${trial.target.labels[0]}.`;window.BuddySkillFramework?.speak($("feedback").textContent);session?.record({trialNumber:index+1,target:trial.target.id,response,correct,independent:true,promptLevel:"Independent",latencySeconds:latency,level});if(correct)reinforcement?.award(true);reinforcement?.renderTokenBoard($("moneyTokenBoard"));setTimeout(()=>{index++;next()},1300)}
async function finish(){await session?.end();reinforcement?.renderCompletion($("moneyCompletion"),"Money Identification");show("summaryScreen")}
$("startSession").addEventListener("click",start);$("endEarly").addEventListener("click",finish);$("returnToActivities").addEventListener("click",()=>location.replace("training-station.html?v=3.0.2"));
if(student)$("studentWelcome").textContent=`Ready to practice, ${student.preferredName||student.firstName||"Student"}?`;
$("levelDescription").textContent=level===1?"Match the heads side of each real coin to its tails side.":"Look at a real coin and identify its value written in different ways.";
})();
