(function(){
"use strict";
const $=id=>document.getElementById(id);
const student=window.BuddySkillFramework?.selectedStudent();
const settings=window.BuddySkillFramework?.settingsFrom(student)||{};
const shared=window.BuddySkillFramework?.normalizeShared(settings)||{};
const skill=settings.activity_teaching_settings?.relationshipBoundaries||{};
const trialCount=Math.max(5,Math.min(15,Number(skill.trialCount||10)));
const audio=skill.audio!==false;
const categories={
  family:{label:"Family or close caregiver",color:"blue"},
  friend:{label:"Close friend",color:"green"},
  helper:{label:"Familiar helper or staff",color:"yellow"},
  acquaintance:{label:"Acquaintance or community person",color:"orange"},
  stranger:{label:"Stranger or new person",color:"red"}
};
const examples=[
 {text:"A parent or caregiver who takes care of you.",category:"family"},
 {text:"A brother, sister, or family member you know very well.",category:"family"},
 {text:"A close friend you spend time with and know well.",category:"friend"},
 {text:"A friend from school you choose to spend time with.",category:"friend"},
 {text:"Your teacher who you see regularly at school.",category:"helper"},
 {text:"Your job coach or paraprofessional who works with you.",category:"helper"},
 {text:"A school staff member you know and see often.",category:"helper"},
 {text:"A cashier you recognize but do not know personally.",category:"acquaintance"},
 {text:"A neighbor you have only talked with a few times.",category:"acquaintance"},
 {text:"A worker at a store you visit sometimes.",category:"acquaintance"},
 {text:"A person at a bus stop you have never met before.",category:"stranger"},
 {text:"Someone online you have never met in person.",category:"stranger"},
 {text:"A person in the community you do not know.",category:"stranger"}
];
const reinforcement=window.BuddySkillFramework?.createReinforcement({shared,cloudPackage:student?.cloudReinforcementPackage});
const session=window.BuddySkillFramework?.createSession({studentId:student?.id||"local-student",activityKey:"relationships-boundaries",activityName:"Relationships & Boundaries",promptingMode:shared.promptingMode,moduleVersion:"3.3.0",reinforcementPackageId:String(settings.reinforcement_package||"").startsWith("library:")?String(settings.reinforcement_package).slice(8):null});
const scheduler=window.BuddySkillFramework?.createPromptScheduler();
let trials=[],index=0,current=null,accepting=false;
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function show(id){["setupScreen","trialScreen","summaryScreen"].forEach(x=>$(x).hidden=x!==id)}
function buildTrials(){const base=[];while(base.length<trialCount)base.push(...shuffle(examples));return base.slice(0,trialCount)}
function choiceKeys(correct){return shuffle([correct,...shuffle(Object.keys(categories).filter(x=>x!==correct)).slice(0,2)])}
function speak(text){window.BuddySkillFramework?.speak(text)}
function narrateChoices(){if(!audio||!current)return;const labels=current.choiceKeys.map(k=>categories[k].label);speak(`${current.example.text} Who is this person to me? Choices are: ${labels.join(", ")}.`)}
async function start(){trials=buildTrials();index=0;await session?.start();show("trialScreen");next()}
function next(){scheduler?.clear();if(index>=trials.length)return finish();const example=trials[index];const keys=choiceKeys(example.category);current={example,choiceKeys:keys,started:performance.now(),promptLevel:"Independent"};accepting=true;$("trialProgress").textContent=`Trial ${index+1} of ${trials.length}`;$("progressFill").style.width=`${index/trials.length*100}%`;$("promptStatus").textContent="Independent";$("scenarioText").textContent=example.text;$("feedback").textContent="";const grid=$("answerGrid");grid.innerHTML="";keys.forEach(key=>{const b=document.createElement("button");b.type="button";b.className="relationship-answer";b.dataset.category=key;b.textContent=categories[key].label;b.addEventListener("click",()=>answer(key,b));grid.appendChild(b)});reinforcement?.renderTokenBoard($("relationshipTokenBoard"));if(audio)setTimeout(narrateChoices,250);schedulePrompts()}
function schedulePrompts(){if(shared.promptingMode!=="least-to-most")return;const wait=Math.max(2,Number(shared.waitTimeSeconds||10))*1000;scheduler?.schedule(()=>applyPrompt(2),wait);scheduler?.schedule(()=>applyPrompt(3),wait*2);scheduler?.schedule(()=>applyPrompt(4),wait*3)}
function neutralize(){document.querySelectorAll(".relationship-answer").forEach(b=>b.classList.remove("category-blue","category-green","category-yellow","category-orange","category-red","correct-model"))}
function applyPrompt(level){if(!accepting||!current)return;neutralize();if(level===2){current.promptLevel="All Category Colors";$("promptStatus").textContent=current.promptLevel;document.querySelectorAll(".relationship-answer").forEach(b=>b.classList.add(`category-${categories[b.dataset.category].color}`));if(audio)speak("Look at the relationship category colors.")}
if(level===3){current.promptLevel="Correct Color Only";$("promptStatus").textContent=current.promptLevel;const correct=document.querySelector(`.relationship-answer[data-category="${current.example.category}"]`);correct?.classList.add(`category-${categories[current.example.category].color}`);if(audio)speak("Look for the colored choice.")}
if(level===4){current.promptLevel="Full Model";$("promptStatus").textContent=current.promptLevel;const correct=document.querySelector(`.relationship-answer[data-category="${current.example.category}"]`);correct?.classList.add(`category-${categories[current.example.category].color}`,"correct-model");document.querySelectorAll(".relationship-answer").forEach(b=>{if(b!==correct)b.disabled=true});$("feedback").innerHTML=`<span class="full-model-message">This person is: ${categories[current.example.category].label}.</span>`;speak(`This person is ${categories[current.example.category].label}. Choose ${categories[current.example.category].label}.`)}}
function answer(key,button){if(!accepting)return;const correct=key===current.example.category;const latency=(performance.now()-current.started)/1000;if(!correct){button.classList.add("incorrect");applyPrompt(4);return}accepting=false;scheduler?.clear();button.classList.add(`category-${categories[key].color}`,"correct-model");const independent=current.promptLevel==="Independent";$("feedback").textContent=independent?"Nice job!":`Yes. ${categories[key].label}.`;if(audio)speak($("feedback").textContent);const award=reinforcement?.award(independent);session?.record({trialNumber:index+1,target:current.example.category,studentResponse:key,correct:true,independent,promptLevel:current.promptLevel,latencySeconds:latency,tokenEarned:Boolean(award?.awarded),taskData:{module:"relationships-boundaries",level:1,scenario:current.example.text,categoryLabel:categories[current.example.category].label,categoryColor:categories[current.example.category].color,choices:current.choiceKeys.map(k=>categories[k].label)}});reinforcement?.renderTokenBoard($("relationshipTokenBoard"));setTimeout(()=>{index++;next()},1100)}
async function finish(){scheduler?.clear();accepting=false;await session?.end();reinforcement?.renderCompletion($("relationshipCompletion"),"Relationships & Boundaries");show("summaryScreen")}
$("startSession").addEventListener("click",start);$("endEarly").addEventListener("click",finish);$("returnToActivities").addEventListener("click",()=>location.replace("training-station.html?v=3.3.0"));$("repeatPrompt").addEventListener("click",narrateChoices);if(student)$("studentWelcome").textContent=`Ready to practice, ${student.preferredName||student.firstName||"Student"}?`;
})();
