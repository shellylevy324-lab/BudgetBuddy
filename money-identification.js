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
const generalization={
  coinNames:moneySettings.generalization?.coinNames!==false,
  writtenValues:moneySettings.generalization?.writtenValues!==false,
  coinSides:moneySettings.generalization?.coinSides!==false,
  rotation:moneySettings.generalization?.rotation!==false,
  backgrounds:moneySettings.generalization?.backgrounds!==false,
  relativeSize:moneySettings.generalization?.relativeSize!==false
};
const reinforcement=window.BuddySkillFramework?.createReinforcement({shared,cloudPackage:student?.cloudReinforcementPackage});
const session=window.BuddySkillFramework?.createSession({studentId:student?.id||"local-student",activityKey:"money-identification",activityName:"Money Identification",promptingMode:shared.promptingMode,moduleVersion:"3.0.6",reinforcementPackageId:String(settings.reinforcement_package||"").startsWith("library:")?String(settings.reinforcement_package).slice(8):null});
const BASE="https://www.usmint.gov/content/dam/usmint/coins/";
const COINS={
 penny:{id:"penny",name:"penny",cents:1,diameterMm:19.05,heads:BASE+"circulating-coins/2025-lincoln-penny-uncirculated-obverse-philadelphia.jpg",tails:BASE+"circulating-coins/2025-lincoln-penny-uncirculated-reverse.jpg",labels:["1¢","1 cent","$0.01"]},
 nickel:{id:"nickel",name:"nickel",cents:5,diameterMm:21.21,heads:BASE+"circulating-coins/2025-jefferson-nickel-uncirculated-obverse-philadelphia.jpg",tails:BASE+"circulating-coins/2025-jefferson-nickel-uncirculated-reverse.jpg",labels:["5¢","5 cents","$0.05"]},
 dime:{id:"dime",name:"dime",cents:10,diameterMm:17.91,heads:BASE+"circulating-coins/2025-roosevelt-dime-uncirculated-obverse-philadelphia.jpg",tails:BASE+"circulating-coins/2025-roosevelt-dime-uncirculated-reverse.jpg",labels:["10¢","10 cents","$0.10"]},
 quarter:{id:"quarter",name:"quarter",cents:25,diameterMm:24.26,heads:BASE+"american-women-quarters/2025-american-women-quarters-coin-uncirculated-obverse-philadelphia.jpg",tails:BASE+"american-women-quarters/2025-american-women-quarters-coin-ida-wells-uncirculated-reverse.jpg",labels:["25¢","25 cents","$0.25"]}
};
const activeCoins=selectedCoins.map(id=>COINS[id]).filter(Boolean);
let order=[],index=0,trial=null,accepting=false;
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function show(id){["setupScreen","trialScreen","summaryScreen"].forEach(x=>$(x).hidden=x!==id)}
function imageCard(coin,side,button=false,options={}){
  const el=document.createElement(button?"button":"div");
  el.className=`coin-photo-card ${button?"coin-choice":""}`;
  if(button)el.type="button";
  const useRelative=options.relativeSize!==false;
  const scale=useRelative?Math.max(.65,Math.min(1,Number(coin.diameterMm||24.26)/24.26)):1;
  el.style.setProperty("--coin-scale",scale.toFixed(3));
  el.style.setProperty("--coin-rotation",`${options.rotation||0}deg`);
  el.style.setProperty("--coin-brightness",String(options.brightness||1));
  el.style.setProperty("--coin-contrast",String(options.contrast||1));
  if(options.background)el.classList.add(`generalization-background-${options.background}`);
  el.dataset.coinSize=coin.id;
  const img=document.createElement("img");
  img.src=coin[side];
  img.alt=`${coin.name}, ${side}, shown ${useRelative?"at its relative size":"enlarged"}`;
  img.loading="eager";
  el.appendChild(img);
  return el;
}
function variationOptions(){
  if(level!==4)return {relativeSize:true};
  return {
    relativeSize:generalization.relativeSize,
    rotation:generalization.rotation?pick([-20,-12,-6,0,7,14,22]):0,
    background:generalization.backgrounds?pick([0,1,2,3,4]):0,
    brightness:generalization.backgrounds?pick([.92,1,1.06]):1,
    contrast:generalization.backgrounds?pick([.96,1,1.05]):1
  };
}
function buildOrder(){
  const coins=Array.from({length:trialCount},(_,i)=>activeCoins[i%activeCoins.length]);
  return shuffle(coins);
}
async function start(){
  if(!activeCoins.length){$("levelDescription").textContent="Ask your teacher to select at least one coin.";return}
  order=buildOrder();index=0;await session?.start();show("trialScreen");next();
}
function levelFourTypes(){
  const types=[];
  if(generalization.coinSides)types.push("match-sides");
  if(generalization.writtenValues)types.push("coin-to-value","value-to-coin");
  if(generalization.coinNames)types.push("name-to-coin");
  return types.length?types:["name-to-coin","value-to-coin"];
}
function addCoinChoices(target,correctSideMode=false){
  const choiceCoins=shuffle([target,...shuffle(Object.values(COINS).filter(c=>c.id!==target.id)).slice(0,3)]);
  choiceCoins.forEach(c=>{
    const side=correctSideMode?"tails":pick(["heads","tails"]);
    const b=imageCard(c,side,true,variationOptions());
    b.setAttribute("aria-label",`${c.name}, ${side}`);
    b.dataset.correct=String(c.id===target.id);
    b.onclick=()=>answer(c.id===target.id,b,`${c.id}-${side}`);
    $("answerGrid").appendChild(b);
  });
}
function addValueChoices(target){
  const correctLabel=pick(target.labels);
  trial.valueFormat=correctLabel;
  const distractors=shuffle(Object.values(COINS).filter(c=>c.id!==target.id)).slice(0,3).map(c=>pick(c.labels));
  shuffle([correctLabel,...distractors]).forEach(label=>{
    const b=document.createElement("button");
    b.className="answer-button";b.type="button";b.textContent=label;
    b.dataset.correct=String(target.labels.includes(label));
    b.onclick=()=>answer(target.labels.includes(label),b,label);
    $("answerGrid").appendChild(b);
  });
}
function next(){
  if(index>=order.length)return finish();
  const target=order[index];
  const trialType=level===1?"match-sides":level===2?"coin-to-value":level===3?"value-to-coin":pick(levelFourTypes());
  trial={target,started:performance.now(),level,type:trialType};accepting=true;
  $("trialProgress").textContent=`Trial ${index+1} of ${order.length}`;
  $("progressFill").style.width=`${index/order.length*100}%`;
  $("promptStatus").textContent=level===4?"Generalization":"Independent";
  $("feedback").textContent="";$("moneyVisual").innerHTML="";$("answerGrid").innerHTML="";

  if(trialType==="match-sides"){
    $("direction").textContent="Find the other side of this coin.";
    $("moneyVisual").appendChild(imageCard(target,"heads",false,variationOptions()));
    addCoinChoices(target,true);
  }else if(trialType==="coin-to-value"){
    const side=pick(["heads","tails"]);
    $("direction").textContent="How much is this coin worth?";
    $("moneyVisual").appendChild(imageCard(target,side,false,variationOptions()));
    addValueChoices(target);
  }else if(trialType==="value-to-coin"){
    const promptLabel=pick(target.labels);trial.valueFormat=promptLabel;
    $("direction").textContent="Which coin has the same value?";
    const card=document.createElement("div");card.className="value-prompt-card";card.textContent=promptLabel;
    card.setAttribute("aria-label",`${promptLabel}. Choose the coin with the same value.`);
    $("moneyVisual").appendChild(card);addCoinChoices(target,false);
  }else{
    $("direction").textContent=`Find the ${target.name}.`;
    const card=document.createElement("div");card.className="coin-name-prompt-card";card.textContent=target.name;
    card.setAttribute("aria-label",`Find the ${target.name}.`);
    $("moneyVisual").appendChild(card);addCoinChoices(target,false);
  }
  reinforcement?.renderTokenBoard($("moneyTokenBoard"));
}
function answer(correct,button,response){
  if(!accepting)return;accepting=false;
  const latency=(performance.now()-trial.started)/1000;
  button.classList.add(correct?"correct-model":"incorrect");
  if(!correct){[...$("answerGrid").children].find(b=>b.dataset.correct==="true")?.classList.add("correct-model")}
  const messages={
    "match-sides":`That is the other side of the ${trial.target.name}.`,
    "coin-to-value":`A ${trial.target.name} is worth ${trial.target.labels[0]}.`,
    "value-to-coin":`${trial.valueFormat} has the same value as a ${trial.target.name}.`,
    "name-to-coin":`That is the ${trial.target.name}.`
  };
  $("feedback").textContent=correct?"Nice job!":messages[trial.type];
  window.BuddySkillFramework?.speak($("feedback").textContent);
  session?.record({trialNumber:index+1,target:trial.target.id,response,correct,independent:true,promptLevel:"Independent",latencySeconds:latency,level,trialType:trial.type,valueFormat:trial.valueFormat||null,generalization:level===4?generalization:null});
  if(correct)reinforcement?.award(true);
  reinforcement?.renderTokenBoard($("moneyTokenBoard"));
  setTimeout(()=>{index++;next()},1300);
}
async function finish(){await session?.end();reinforcement?.renderCompletion($("moneyCompletion"),"Money Identification");show("summaryScreen")}
$("startSession").addEventListener("click",start);
$("endEarly").addEventListener("click",finish);
$("returnToActivities").addEventListener("click",()=>location.replace("training-station.html?v=3.0.6"));
if(student)$("studentWelcome").textContent=`Ready to practice, ${student.preferredName||student.firstName||"Student"}?`;
const descriptions={1:"Match the heads side of each real coin to its tails side.",2:"Look at a real coin and identify its value written in different ways.",3:"Match a written money value to the real coin with the same value.",4:"Generalize money identification across mixed directions, coin sides, written values, sizes, rotations, and backgrounds."};
$("levelDescription").textContent=descriptions[level]||descriptions[1];
})();
