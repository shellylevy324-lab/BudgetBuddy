const STUDENT_STORAGE_KEY="budgetBuddyStudents";
const SELECTED_STUDENT_STORAGE_KEY="budgetBuddySelectedStudent";
const SESSION_STORAGE_KEY="budgetBuddySessions";
const nextTrialDelayMilliseconds=1800;
const rapidResponseThresholdSeconds=1.0;
const budgetOptions=[2,3,4,5,6,8,10];

const starterStudents=[
{id:"shelly-test",name:"Shelly (Test)",totalTrials:10,promptStyle:"baseline",waitTimeSeconds:10},
{id:"student-a",name:"Student A",totalTrials:5,promptStyle:"least-to-most",waitTimeSeconds:10}
];

const appState={students:[],sessions:[],selectedStudentId:"",selectedSessionId:"",currentStudent:null,currentSessionId:"",sessionStartedAt:null,currentTrial:0,responses:[],items:[],shuffledItems:[],currentItem:null,currentBudget:0,trialStartedAt:null,acceptingResponse:false};

const homeScreen=document.getElementById("homeScreen");
const teacherScreen=document.getElementById("teacherScreen");
const welcomeScreen=document.getElementById("welcomeScreen");
const groceryScreen=document.getElementById("groceryScreen");
const completeScreen=document.getElementById("completeScreen");
const homeStudentSelect=document.getElementById("homeStudentSelect");
const startButton=document.getElementById("startButton");
const teacherButton=document.getElementById("teacherButton");
const teacherBackButton=document.getElementById("teacherBackButton");
const studentsTabButton=document.getElementById("studentsTabButton");
const reportsTabButton=document.getElementById("reportsTabButton");
const studentsPanel=document.getElementById("studentsPanel");
const reportsPanel=document.getElementById("reportsPanel");
const addStudentButton=document.getElementById("addStudentButton");
const studentList=document.getElementById("studentList");
const profileFormTitle=document.getElementById("profileFormTitle");
const studentIdInput=document.getElementById("studentId");
const studentNameInput=document.getElementById("studentName");
const sessionLengthSelect=document.getElementById("sessionLength");
const promptStyleSelect=document.getElementById("promptStyle");
const waitTimeInput=document.getElementById("waitTime");
const saveStudentButton=document.getElementById("saveStudent");
const deleteStudentButton=document.getElementById("deleteStudentButton");
const settingsMessage=document.getElementById("settingsMessage");
const reportStudentFilter=document.getElementById("reportStudentFilter");
const exportCsvButton=document.getElementById("exportCsvButton");
const clearReportsButton=document.getElementById("clearReportsButton");
const reportSummaryCards=document.getElementById("reportSummaryCards");
const sessionTableBody=document.getElementById("sessionTableBody");
const selectedSessionLabel=document.getElementById("selectedSessionLabel");
const trialDetailBody=document.getElementById("trialDetailBody");
const welcomeStudentName=document.getElementById("welcomeStudentName");
const welcomeSessionDetails=document.getElementById("welcomeSessionDetails");
const beginSessionButton=document.getElementById("beginSessionButton");
const welcomeBackButton=document.getElementById("welcomeBackButton");
const studentGreeting=document.getElementById("studentGreeting");
const trialCounter=document.getElementById("trialCounter");
const progressBar=document.getElementById("progressBar");
const itemImage=document.getElementById("itemImage");
const itemName=document.getElementById("itemName");
const itemCategory=document.getElementById("itemCategory");
const itemPrice=document.getElementById("itemPrice");
const budgetDisplay=document.getElementById("budgetDisplay");
const yesButton=document.getElementById("yesButton");
const noButton=document.getElementById("noButton");
const feedbackArea=document.getElementById("feedbackArea");
const trialContent=document.getElementById("trialContent");
const endSessionButton=document.getElementById("endSessionButton");
const completionMessage=document.getElementById("completionMessage");
const newSessionButton=document.getElementById("newSessionButton");
const viewReportButton=document.getElementById("viewReportButton");
const completeHomeButton=document.getElementById("completeHomeButton");
const screens=[homeScreen,teacherScreen,welcomeScreen,groceryScreen,completeScreen];

function showScreen(selected){screens.forEach(s=>s.classList.add("hidden"));selected.classList.remove("hidden")}
function showTeacherPanel(name){const students=name==="students";studentsPanel.classList.toggle("hidden",!students);reportsPanel.classList.toggle("hidden",students);studentsTabButton.classList.toggle("active",students);reportsTabButton.classList.toggle("active",!students);if(!students)renderReports()}

function loadStudents(){const raw=localStorage.getItem(STUDENT_STORAGE_KEY);if(raw){try{appState.students=JSON.parse(raw)}catch(e){console.error(e);appState.students=[...starterStudents]}}else{appState.students=[...starterStudents];saveStudents()}const stored=localStorage.getItem(SELECTED_STUDENT_STORAGE_KEY);appState.selectedStudentId=appState.students.some(s=>s.id===stored)?stored:(appState.students[0]?.id||"")}
function saveStudents(){localStorage.setItem(STUDENT_STORAGE_KEY,JSON.stringify(appState.students))}
function saveSelectedStudentId(){localStorage.setItem(SELECTED_STUDENT_STORAGE_KEY,appState.selectedStudentId)}
function loadSessions(){const raw=localStorage.getItem(SESSION_STORAGE_KEY);if(!raw){appState.sessions=[];return}try{appState.sessions=JSON.parse(raw)}catch(e){console.error(e);appState.sessions=[]}}
function saveSessions(){localStorage.setItem(SESSION_STORAGE_KEY,JSON.stringify(appState.sessions))}
function getSelectedStudent(){return appState.students.find(s=>s.id===appState.selectedStudentId)||null}

function updateHomeStudentSelect(){homeStudentSelect.innerHTML="";appState.students.forEach(student=>{const o=document.createElement("option");o.value=student.id;o.textContent=student.name;o.selected=student.id===appState.selectedStudentId;homeStudentSelect.appendChild(o)});startButton.disabled=appState.students.length===0}
function renderStudentList(){studentList.innerHTML="";if(!appState.students.length){studentList.textContent="No students have been added.";return}appState.students.forEach(student=>{const b=document.createElement("button");b.type="button";b.className="studentListButton"+(student.id===appState.selectedStudentId?" selected":"");b.textContent="👤 "+student.name;b.addEventListener("click",()=>selectStudentForEditing(student.id));studentList.appendChild(b)})}
function selectStudentForEditing(id){const s=appState.students.find(x=>x.id===id);if(!s)return;appState.selectedStudentId=s.id;saveSelectedStudentId();studentIdInput.value=s.id;studentNameInput.value=s.name;sessionLengthSelect.value=String(s.totalTrials);promptStyleSelect.value=s.promptStyle;waitTimeInput.value=String(s.waitTimeSeconds);profileFormTitle.textContent="Edit "+s.name;deleteStudentButton.disabled=false;settingsMessage.textContent="";updateHomeStudentSelect();renderStudentList()}
function beginNewStudent(){studentIdInput.value="";studentNameInput.value="";sessionLengthSelect.value="10";promptStyleSelect.value="least-to-most";waitTimeInput.value="10";profileFormTitle.textContent="Add Student";deleteStudentButton.disabled=true;settingsMessage.textContent="";studentNameInput.focus()}
function createStudentId(name){const safe=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");return(safe||"student")+"-"+Date.now()}
function saveStudentProfile(){const name=studentNameInput.value.trim();if(!name){settingsMessage.textContent="Please enter a student name.";studentNameInput.focus();return}const id=studentIdInput.value;const profile={id:id||createStudentId(name),name,totalTrials:Number(sessionLengthSelect.value),promptStyle:promptStyleSelect.value,waitTimeSeconds:Number(waitTimeInput.value)||10};const i=appState.students.findIndex(s=>s.id===id);if(i>=0)appState.students[i]=profile;else appState.students.push(profile);appState.selectedStudentId=profile.id;saveStudents();saveSelectedStudentId();updateHomeStudentSelect();renderStudentList();selectStudentForEditing(profile.id);updateReportStudentFilter();settingsMessage.textContent=profile.name+"'s profile was saved."}
function deleteSelectedStudent(){const id=studentIdInput.value;if(!id)return;const s=appState.students.find(x=>x.id===id);if(!s)return;if(!window.confirm("Delete "+s.name+"'s profile?"))return;appState.students=appState.students.filter(x=>x.id!==id);appState.selectedStudentId=appState.students[0]?.id||"";saveStudents();saveSelectedStudentId();updateHomeStudentSelect();renderStudentList();updateReportStudentFilter();appState.selectedStudentId?selectStudentForEditing(appState.selectedStudentId):beginNewStudent()}

function openStudentWelcome(){const s=getSelectedStudent();if(!s)return;appState.currentStudent=s;welcomeStudentName.textContent="Welcome, "+s.name+"!";welcomeSessionDetails.textContent="You will complete "+s.totalTrials+" shopping trial"+(s.totalTrials===1?".":"s.");showScreen(welcomeScreen)}
function formatCurrency(v){return"$"+Number(v).toFixed(2)}
function formatSeconds(v){return Number(v).toFixed(2)+" sec"}
function average(a){return a.length?a.reduce((t,v)=>t+v,0)/a.length:0}
function median(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}

async function loadGroceryItems(){const r=await fetch("data/grocery.json");if(!r.ok)throw new Error("Could not load grocery.json");const items=await r.json();if(!Array.isArray(items)||!items.length)throw new Error("The grocery item list is empty");appState.items=items}
function shuffleArray(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}return c}
function getNextItem(){if(!appState.shuffledItems.length)appState.shuffledItems=shuffleArray(appState.items);return appState.shuffledItems.pop()}
function getRandomBudget(){return budgetOptions[Math.floor(Math.random()*budgetOptions.length)]}

async function startSession(){if(!appState.currentStudent)appState.currentStudent=getSelectedStudent();if(!appState.currentStudent)return;disableAnswerButtons();try{if(!appState.items.length)await loadGroceryItems();appState.currentSessionId="session-"+Date.now();appState.sessionStartedAt=new Date().toISOString();appState.currentTrial=0;appState.responses=[];appState.shuffledItems=[];studentGreeting.textContent=appState.currentStudent.name+"'s Shopping Practice";showScreen(groceryScreen);loadNextTrial()}catch(e){console.error(e);window.alert("The grocery items could not be loaded.")}}
function finishSession(){appState.acceptingResponse=false;disableAnswerButtons();const trials=[...appState.responses],latencies=trials.map(t=>t.latencySeconds),correct=trials.filter(t=>t.correct).length,rapid=trials.filter(t=>t.latencySeconds<rapidResponseThresholdSeconds).length;const session={id:appState.currentSessionId,studentId:appState.currentStudent.id,studentName:appState.currentStudent.name,startedAt:appState.sessionStartedAt,completedAt:new Date().toISOString(),plannedTrials:appState.currentStudent.totalTrials,completedTrials:trials.length,correctCount:correct,incorrectCount:trials.length-correct,accuracyPercent:trials.length?Number((correct/trials.length*100).toFixed(1)):0,averageLatencySeconds:Number(average(latencies).toFixed(2)),medianLatencySeconds:Number(median(latencies).toFixed(2)),rapidResponseCount:rapid,rapidResponseThresholdSeconds,promptStyle:appState.currentStudent.promptStyle,waitTimeSeconds:appState.currentStudent.waitTimeSeconds,trials};appState.sessions.unshift(session);appState.selectedSessionId=session.id;saveSessions();completionMessage.textContent="Nice work, "+appState.currentStudent.name+"! You completed "+trials.length+" shopping trial"+(trials.length===1?".":"s.");showScreen(completeScreen)}
function loadNextTrial(){hideFeedback();if(appState.currentTrial>=appState.currentStudent.totalTrials){finishSession();return}appState.currentTrial++;appState.currentItem=getNextItem();appState.currentBudget=getRandomBudget();appState.acceptingResponse=true;updateTrialCounter();displayCurrentTrial();enableAnswerButtons();appState.trialStartedAt=performance.now()}
function updateTrialCounter(){const total=appState.currentStudent.totalTrials;trialCounter.textContent="Trial "+appState.currentTrial+" of "+total;progressBar.style.width=(appState.currentTrial/total*100)+"%"}
function displayCurrentTrial(){itemName.textContent=appState.currentItem.name;itemCategory.textContent=appState.currentItem.category;itemPrice.textContent=formatCurrency(appState.currentItem.price);budgetDisplay.textContent=formatCurrency(appState.currentBudget);itemImage.onerror=function(){itemImage.removeAttribute("src");itemImage.alt="Image unavailable for "+appState.currentItem.name};itemImage.src="assets/images/grocery/"+appState.currentItem.image;itemImage.alt=appState.currentItem.name}
function handleAnswer(answer){if(!appState.acceptingResponse)return;const latency=Number(((performance.now()-appState.trialStartedAt)/1000).toFixed(2));appState.acceptingResponse=false;disableAnswerButtons();const correctAnswer=Number(appState.currentBudget)>=Number(appState.currentItem.price)?"yes":"no",isCorrect=answer===correctAnswer;appState.responses.push({trialNumber:appState.currentTrial,item:appState.currentItem.name,category:appState.currentItem.category,price:Number(appState.currentItem.price),budget:Number(appState.currentBudget),studentAnswer:answer,correctAnswer,correct:isCorrect,latencySeconds:latency,rapidResponse:latency<rapidResponseThresholdSeconds,timestamp:new Date().toISOString()});showFeedback(isCorrect?"Nice job! You compared the price and your budget.":"Thanks for trying. Let's practice another one.",isCorrect);setTimeout(loadNextTrial,nextTrialDelayMilliseconds)}
function showFeedback(message,correct){feedbackArea.textContent=message;feedbackArea.classList.remove("hidden","feedbackCorrect","feedbackIncorrect");feedbackArea.classList.add(correct?"feedbackCorrect":"feedbackIncorrect");trialContent.style.opacity=".45"}
function hideFeedback(){feedbackArea.textContent="";feedbackArea.classList.add("hidden");feedbackArea.classList.remove("feedbackCorrect","feedbackIncorrect");trialContent.style.opacity="1"}
function disableAnswerButtons(){yesButton.disabled=true;noButton.disabled=true}
function enableAnswerButtons(){yesButton.disabled=false;noButton.disabled=false}

function updateReportStudentFilter(){const cur=reportStudentFilter.value||"all";reportStudentFilter.innerHTML="";const all=document.createElement("option");all.value="all";all.textContent="All Students";reportStudentFilter.appendChild(all);appState.students.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;reportStudentFilter.appendChild(o)});reportStudentFilter.value=[...reportStudentFilter.options].some(o=>o.value===cur)?cur:"all"}
function getFilteredSessions(){const id=reportStudentFilter.value;return!id||id==="all"?[...appState.sessions]:appState.sessions.filter(s=>s.studentId===id)}
function renderReports(){updateReportStudentFilter();const sessions=getFilteredSessions();renderSummaryCards(sessions);renderSessionTable(sessions);const selected=appState.sessions.find(s=>s.id===appState.selectedSessionId)||sessions[0]||null;if(selected){appState.selectedSessionId=selected.id;renderTrialDetails(selected)}else{selectedSessionLabel.textContent="No saved sessions are available.";trialDetailBody.innerHTML=""}}
function renderSummaryCards(sessions){reportSummaryCards.innerHTML="";const trials=sessions.flatMap(s=>s.trials),correct=trials.filter(t=>t.correct).length;[["Sessions",sessions.length],["Trials",sessions.reduce((t,s)=>t+s.completedTrials,0)],["Overall Accuracy",(trials.length?correct/trials.length*100:0).toFixed(1)+"%"],["Average Latency",formatSeconds(average(trials.map(t=>t.latencySeconds)))]].forEach(([label,value])=>{const d=document.createElement("div");d.className="summaryCard";d.innerHTML="<span>"+label+"</span><strong>"+value+"</strong>";reportSummaryCards.appendChild(d)})}
function renderSessionTable(sessions){sessionTableBody.innerHTML="";if(!sessions.length){const r=document.createElement("tr"),c=document.createElement("td");c.colSpan=7;c.textContent="No sessions have been saved.";r.appendChild(c);sessionTableBody.appendChild(r);return}sessions.forEach(s=>{const r=document.createElement("tr");r.className="sessionRow"+(s.id===appState.selectedSessionId?" selected":"");[new Date(s.completedAt).toLocaleString(),s.studentName,s.completedTrials,s.accuracyPercent+"%",formatSeconds(s.averageLatencySeconds),formatSeconds(s.medianLatencySeconds),s.rapidResponseCount].forEach(v=>{const c=document.createElement("td");c.textContent=v;r.appendChild(c)});r.addEventListener("click",()=>{appState.selectedSessionId=s.id;renderReports()});sessionTableBody.appendChild(r)})}
function renderTrialDetails(session){selectedSessionLabel.textContent=session.studentName+" — "+new Date(session.completedAt).toLocaleString();trialDetailBody.innerHTML="";session.trials.forEach(t=>{const r=document.createElement("tr");[t.trialNumber,t.item,formatCurrency(t.price),formatCurrency(t.budget),t.studentAnswer.toUpperCase(),t.correct?"Yes":"No",formatSeconds(t.latencySeconds)].forEach(v=>{const c=document.createElement("td");c.textContent=v;r.appendChild(c)});trialDetailBody.appendChild(r)})}
function exportSessionsToCsv(){const sessions=getFilteredSessions();if(!sessions.length){window.alert("There are no sessions to export.");return}const rows=[["Session ID","Student","Session Completed","Trial","Item","Category","Price","Budget","Student Answer","Correct Answer","Correct","Latency Seconds","Rapid Response"]];sessions.forEach(s=>s.trials.forEach(t=>rows.push([s.id,s.studentName,s.completedAt,t.trialNumber,t.item,t.category,t.price.toFixed(2),t.budget.toFixed(2),t.studentAnswer,t.correctAnswer,t.correct?"Yes":"No",t.latencySeconds.toFixed(2),t.rapidResponse?"Yes":"No"])));const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="budget-buddy-session-data.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
function clearSavedReports(){if(!window.confirm("Delete all saved session reports from this browser?"))return;appState.sessions=[];appState.selectedSessionId="";saveSessions();renderReports()}

homeStudentSelect.addEventListener("change",()=>{appState.selectedStudentId=homeStudentSelect.value;saveSelectedStudentId()});
startButton.addEventListener("click",openStudentWelcome);
teacherButton.addEventListener("click",()=>{renderStudentList();appState.selectedStudentId?selectStudentForEditing(appState.selectedStudentId):beginNewStudent();showTeacherPanel("students");showScreen(teacherScreen)});
teacherBackButton.addEventListener("click",()=>{updateHomeStudentSelect();showScreen(homeScreen)});
studentsTabButton.addEventListener("click",()=>showTeacherPanel("students"));
reportsTabButton.addEventListener("click",()=>showTeacherPanel("reports"));
addStudentButton.addEventListener("click",beginNewStudent);
saveStudentButton.addEventListener("click",saveStudentProfile);
deleteStudentButton.addEventListener("click",deleteSelectedStudent);
reportStudentFilter.addEventListener("change",renderReports);
exportCsvButton.addEventListener("click",exportSessionsToCsv);
clearReportsButton.addEventListener("click",clearSavedReports);
beginSessionButton.addEventListener("click",startSession);
welcomeBackButton.addEventListener("click",()=>showScreen(homeScreen));
yesButton.addEventListener("click",()=>handleAnswer("yes"));
noButton.addEventListener("click",()=>handleAnswer("no"));
endSessionButton.addEventListener("click",finishSession);
newSessionButton.addEventListener("click",openStudentWelcome);
viewReportButton.addEventListener("click",()=>{showTeacherPanel("reports");showScreen(teacherScreen)});
completeHomeButton.addEventListener("click",()=>showScreen(homeScreen));

loadStudents();loadSessions();updateHomeStudentSelect();updateReportStudentFilter();disableAnswerButtons();showScreen(homeScreen);console.log("Budget Buddy v0.5 loaded successfully");
