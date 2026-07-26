(function(){
"use strict";
const SIGN_SETS=[
{id:1,name:'Set 1: Immediate Safety',signs:[
{id:"stop",label:'Stop',meaning:'Stop',image:"assets/community-signs/stop.svg"},
{id:"do-not-enter",label:'Do Not Enter',meaning:'Do Not Enter',image:"assets/community-signs/do-not-enter.svg"},
{id:"danger",label:'Danger',meaning:'Danger',image:"assets/community-signs/danger.svg"},
{id:"poison",label:'Poison',meaning:'Poison',image:"assets/community-signs/poison.svg"},
{id:"caution",label:'Caution',meaning:'Caution',image:"assets/community-signs/caution.svg"},
{id:"slippery-when-wet",label:'Slippery When Wet',meaning:'Slippery When Wet',image:"assets/community-signs/slippery-when-wet.svg"}
]},
{id:2,name:'Set 2: Movement and Exits',signs:[
{id:"exit",label:'Exit',meaning:'Exit',image:"assets/community-signs/exit.svg"},
{id:"fire-exit",label:'Fire Exit',meaning:'Fire Exit',image:"assets/community-signs/fire-exit.svg"},
{id:"walk",label:'Walk',meaning:'Walk',image:"assets/community-signs/walk.svg"},
{id:"dont-walk",label:"Don't Walk",meaning:"Don't Walk",image:"assets/community-signs/dont-walk.svg"},
{id:"elevator",label:'Elevator',meaning:'Elevator',image:"assets/community-signs/elevator.svg"},
{id:"stairs",label:'Stairs',meaning:'Stairs',image:"assets/community-signs/stairs.svg"}
]},
{id:3,name:'Set 3: Rules and Access',signs:[
{id:"no-smoking",label:'No Smoking',meaning:'No Smoking',image:"assets/community-signs/no-smoking.svg"},
{id:"no-food-drink",label:'No Food or Drink',meaning:'No Food or Drink',image:"assets/community-signs/no-food-drink.svg"},
{id:"open",label:'Open',meaning:'Open',image:"assets/community-signs/open.svg"},
{id:"closed",label:'Closed',meaning:'Closed',image:"assets/community-signs/closed.svg"},
{id:"wheelchair-accessible",label:'Wheelchair Accessible',meaning:'Wheelchair Accessible',image:"assets/community-signs/wheelchair-accessible.svg"},
{id:"restroom-unisex",label:'Unisex Restroom',meaning:'Unisex Restroom',image:"assets/community-signs/restroom-unisex.svg"}
]},
{id:4,name:'Set 4: Restroom Identification',signs:[
{id:"restroom-men",label:"Men's Restroom",meaning:"Men's Restroom",image:"assets/community-signs/restroom-men.svg"},
{id:"restroom-women",label:"Women's Restroom",meaning:"Women's Restroom",image:"assets/community-signs/restroom-women.svg"},
{id:"restroom-family",label:'Family Restroom',meaning:'Family Restroom',image:"assets/community-signs/restroom-family.svg"}
]}
];
const MASTERY={minimumTrials:10,accuracy:80,independence:80};
const $=id=>document.getElementById(id);
const state={student:null,total:10,index:0,order:[],responses:[],trial:null,sessionStartedAt:null,promptTimers:[],accepting:false,setIndex:0,unlockedSet:1,promptingMode:"least-to-most",waitTime:10,promptStep:5,audioEnabled:true};
function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function getStudent(){try{return JSON.parse(sessionStorage.getItem("buddySkillsSelectedStudent")||"null");}catch(e){return null;}}
function studentName(s){return s?.preferredName||s?.firstName||s?.name||"Student";}
function studentKey(){return state.student?.id||state.student?.name||"local-student";}
function progressKey(){return `buddyCommunitySignsProgress:${studentKey()}`;}
function loadProgress(){try{const p=JSON.parse(localStorage.getItem(progressKey())||"{}");return Math.min(SIGN_SETS.length,Math.max(1,Number(p.unlockedSet)||1));}catch(e){return 1;}}
function saveProgress(unlockedSet){localStorage.setItem(progressKey(),JSON.stringify({unlockedSet,updatedAt:new Date().toISOString()}));}
function speak(text){if(!state.audioEnabled||!("speechSynthesis" in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.88;u.pitch=1;window.speechSynthesis.speak(u);}
function clearPrompts(){state.promptTimers.forEach(clearTimeout);state.promptTimers=[];}
function show(screen){["setupScreen","trialScreen","summaryScreen"].forEach(id=>$(id).hidden=id!==screen);}
function createOrder(total,signs){let pool=[];while(pool.length<total)pool=pool.concat(shuffle(signs));return pool.slice(0,total);}
function applyAssignment(){
  state.student=getStudent();
  if(!state.student||sessionStorage.getItem("buddySkillsStudentMode")!=="active"){window.location.replace("training-station.html?v=2.4.4");return false;}
  const settings=state.student.instructionalSettings||{};
  state.setIndex=Math.min(SIGN_SETS.length-1,Math.max(0,(Number(settings.community_signs_set)||1)-1));
  state.total=[5,10,15,20].includes(Number(settings.community_signs_trial_count))?Number(settings.community_signs_trial_count):10;
  state.promptingMode=settings.prompting_mode||"least-to-most";
  state.waitTime=Number(settings.wait_time_seconds)||10;
  state.promptStep=Number(settings.community_signs_prompt_step_seconds)||5;
  state.audioEnabled=settings.community_signs_audio_enabled!==false;
  const set=SIGN_SETS[state.setIndex];
  $('setName').textContent=set.name; $('setSigns').textContent=set.signs.map(x=>x.meaning).join(' • ');
  $('assignmentNote').textContent=`${state.total} trials • ${state.promptingMode==='least-to-most'?'Least-to-most distractor removal':state.promptingMode==='baseline'?'Baseline—no prompts':'Independent opportunity'}${state.audioEnabled?' • Audio on':' • Audio off'}`;
  $('repeatAudio').hidden=!state.audioEnabled;
  return true;
}
async function start(){const set=SIGN_SETS[state.setIndex];state.index=0;state.responses=[];state.order=createOrder(state.total,set.signs);state.sessionStartedAt=Date.now();show('trialScreen');$('activeSet').textContent=set.name;
try{await window.BuddySessionEngine?.startSession({studentId:state.student?.id||"local-student",activityKey:"community-signs",activityName:`Community Signs — ${set.name}`,teachingPhase:state.promptingMode,sessionType:"discrete-trial",promptingMode:state.promptingMode,staffName:state.student?.jobCoach||null,moduleVersion:"2.4.4",taskData:{setId:set.id,setName:set.name,signs:set.signs.map(s=>s.meaning)}});}catch(e){console.error(e);}nextTrial();}
function nextTrial(){clearPrompts();state.accepting=true;const set=SIGN_SETS[state.setIndex];const target=state.order[state.index];const distractors=shuffle(set.signs.filter(x=>x.id!==target.id)).slice(0,2);const choices=shuffle([target,...distractors]);state.trial={target,choices,promptLevel:"Independent",removed:[],startedAt:performance.now(),firstResponse:null};$('trialProgress').textContent=`Trial ${state.index+1} of ${state.total}`;$('progressFill').style.width=`${(state.index/state.total)*100}%`;$('promptStatus').textContent='Independent';$('direction').textContent='What does this sign mean?';$('signImage').src=target.image;$('signImage').alt=`Community sign: ${target.label}`;$('feedback').textContent='';$('feedback').className='feedback';renderChoices();speak('What does this sign mean?');schedulePrompts();}
function renderChoices(){const grid=$('answerGrid');grid.innerHTML='';state.trial.choices.forEach(choice=>{const b=document.createElement('button');b.type='button';b.className='answer-button';b.textContent=choice.meaning;b.dataset.id=choice.id;b.addEventListener('click',()=>answer(choice,b));grid.appendChild(b);});}
function schedulePrompts(){if(state.promptingMode!=='least-to-most')return;const wait=state.waitTime*1000;const step=state.promptStep*1000;state.promptTimers.push(setTimeout(()=>removeDistractor(),wait));state.promptTimers.push(setTimeout(()=>removeDistractor(),wait+step));}
function removeDistractor(){if(!state.accepting)return;const candidates=state.trial.choices.filter(x=>x.id!==state.trial.target.id&&!state.trial.removed.includes(x.id));if(!candidates.length)return;const remove=shuffle(candidates)[0];state.trial.removed.push(remove.id);state.trial.promptLevel=state.trial.removed.length===1?'Removal 1':'Removal 2';$('promptStatus').textContent=state.trial.promptLevel;const button=$('answerGrid').querySelector(`[data-id="${remove.id}"]`);if(button)button.classList.add('removed');speak(state.trial.removed.length===1?'Look again. One choice is gone.':`Choose ${state.trial.target.meaning}.`);}
function answer(choice,button){if(!state.accepting)return;const now=performance.now();if(state.trial.firstResponse===null)state.trial.firstResponse=now;const correct=choice.id===state.trial.target.id;const latency=(state.trial.firstResponse-state.trial.startedAt)/1000;state.accepting=false;clearPrompts();if(correct){button.classList.add('correct-model');$('feedback').textContent='Nice job!';$('feedback').className='feedback correct';speak('Nice job!');finishTrial(true,choice.meaning,latency,false);}else{$('feedback').textContent=`Not quite. This sign means ${state.trial.target.meaning}.`;$('feedback').className='feedback incorrect';const correctButton=$('answerGrid').querySelector(`[data-id="${state.trial.target.id}"]`);if(correctButton){correctButton.classList.remove('removed');correctButton.classList.add('correct-model');}speak(`This sign means ${state.trial.target.meaning}.`);finishTrial(false,choice.meaning,latency,true);}}
function finishTrial(correct,response,latency,corrected){const set=SIGN_SETS[state.setIndex];const record={trialNumber:state.index+1,target:state.trial.target.meaning,studentResponse:response,correct,independent:correct&&state.trial.promptLevel==='Independent',promptLevel:state.trial.promptLevel,latencySeconds:Number(latency.toFixed(2)),correctedResponse:corrected,timestamp:new Date().toISOString(),taskData:{module:'community-signs',setId:set.id,setName:set.name,choices:state.trial.choices.map(x=>x.meaning),removedDistractors:[...state.trial.removed]}};state.responses.push(record);window.BuddySessionEngine?.recordTrial(record);setTimeout(()=>{state.index++;if(state.index>=state.total)end();else nextTrial();},1500);}
async function end(){clearPrompts();state.accepting=false;const total=state.responses.length;const correct=state.responses.filter(r=>r.correct).length;const independent=state.responses.filter(r=>r.independent).length;const prompted=state.responses.filter(r=>r.correct&&!r.independent).length;const avg=total?state.responses.reduce((s,r)=>s+r.latencySeconds,0)/total:0;const accuracy=total?correct/total*100:0;const independence=total?independent/total*100:0;const mastered=total>=MASTERY.minimumTrials&&accuracy>=MASTERY.accuracy&&independence>=MASTERY.independence;let advanced=false;if(mastered&&state.setIndex+1===state.unlockedSet&&state.unlockedSet<SIGN_SETS.length){state.unlockedSet++;saveProgress(state.unlockedSet);advanced=true;}try{await window.BuddySessionEngine?.endSession({durationSeconds:(Date.now()-state.sessionStartedAt)/1000,totalTrials:total,correctTrials:correct,independentTrials:independent,promptedTrials:prompted,incorrectTrials:total-correct,averageLatencySeconds:avg,taskData:{setId:SIGN_SETS[state.setIndex].id,setName:SIGN_SETS[state.setIndex].name,mastered,advancedToSet:advanced?state.unlockedSet:null,accuracyPercent:accuracy,independencePercent:independence}});}catch(e){console.error(e);}renderSummary(correct,independent,avg,mastered,advanced);show('summaryScreen');}
function renderSummary(correct,independent,avg,mastered,advanced){const total=state.responses.length;$('summarySet').textContent=SIGN_SETS[state.setIndex].name;$('summaryAccuracy').textContent=total?`${Math.round(correct/total*100)}%`:'0%';$('summaryIndependent').textContent=`${independent} / ${total}`;$('summaryLatency').textContent=`${avg.toFixed(1)}s`;const levels=['Independent','Removal 1','Removal 2'];$('summaryPrompt').textContent=levels[Math.max(0,...state.responses.map(r=>levels.indexOf(r.promptLevel)))];$('masteryResult').textContent=mastered?(advanced?`Mastered — ${SIGN_SETS[state.unlockedSet-1].name} is now available.`:'Mastery criterion met. Continue maintenance practice.'):`Not yet mastered. Continue this set until accuracy and independence are each at least ${MASTERY.accuracy}%.`;$('masteryResult').className=`mastery-result ${mastered?'mastered':'practice'}`;$('summaryRows').innerHTML=state.responses.map(r=>`<tr><td>${r.trialNumber}</td><td>${r.target}</td><td>${r.studentResponse}</td><td>${r.correct?'Correct':'Incorrect'}</td><td>${r.latencySeconds.toFixed(2)}s</td><td>${r.promptLevel}</td></tr>`).join('');}
$('startSession').addEventListener('click',start);$('repeatAudio').addEventListener('click',()=>speak('What does this sign mean?'));$('endEarly').addEventListener('click',end);$('newSession').addEventListener('click',()=>{show('setupScreen');applyAssignment();});if(applyAssignment())$('studentWelcome').textContent=`Ready to practice, ${studentName(state.student)}?`;
window.CommunitySignsTest={SIGN_SETS,MASTERY,shuffle,createOrder};
})();
