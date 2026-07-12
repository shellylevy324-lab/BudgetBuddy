const STUDENT_STORAGE_KEY="budgetBuddyStudents",SELECTED_STUDENT_STORAGE_KEY="budgetBuddySelectedStudent",SESSION_STORAGE_KEY="budgetBuddySessions",nextTrialDelayMilliseconds=1800,rapidResponseThresholdSeconds=1;
const PROMPT_LEVELS={independent:0,visual:1,audio:2,gesture:3},PROMPT_LABELS={independent:"Independent",visual:"Visual price comparison prompt",audio:"Secondary audio prompt",gesture:"Gestural answer prompt"};
const budgetOptions=[2,3,4,5,6,8,10];
const starterStudents=[{id:"shelly-test",name:"Shelly (Test)",totalTrials:10,promptStyle:"baseline",waitTimeSeconds:10,promptStepTimeSeconds:5,audioSdEnabled:true},{id:"student-a",name:"Student A",totalTrials:5,promptStyle:"least-to-most",waitTimeSeconds:10,promptStepTimeSeconds:5,audioSdEnabled:true}];
const appState={students:[],sessions:[],selectedStudentId:"",selectedSessionId:"",currentStudent:null,currentSessionId:"",sessionStartedAt:null,currentTrial:0,responses:[],items:[],shuffledItems:[],currentItem:null,currentListItems:[],currentListTotal:0,cartChoices:[],selectedCartIndexes:[],cartAttempts:0,currentBudget:0,trialStartedAt:null,firstPromptAt:null,currentPromptLevel:"independent",promptTimeouts:[],acceptingResponse:false};

const $=id=>document.getElementById(id);
const homeScreen=$("homeScreen"),teacherScreen=$("teacherScreen"),welcomeScreen=$("welcomeScreen"),groceryScreen=$("groceryScreen"),completeScreen=$("completeScreen");
const homeStudentSelect=$("homeStudentSelect"),startButton=$("startButton"),teacherButton=$("teacherButton"),teacherBackButton=$("teacherBackButton"),studentsTabButton=$("studentsTabButton"),reportsTabButton=$("reportsTabButton"),dataTabButton=$("dataTabButton"),studentsPanel=$("studentsPanel"),reportsPanel=$("reportsPanel"),dataPanel=$("dataPanel");
const addStudentButton=$("addStudentButton"),studentList=$("studentList"),profileFormTitle=$("profileFormTitle"),studentIdInput=$("studentId"),studentNameInput=$("studentName"),sessionLengthSelect=$("sessionLength"),promptStyleSelect=$("promptStyle"),waitTimeInput=$("waitTime"),promptStepTimeInput=$("promptStepTime"),audioSdEnabledInput=$("audioSdEnabled"),activityLevelInput=$("activityLevel"),listItemCountInput=$("listItemCount"),listItemCountGroup=$("listItemCountGroup"),cartTargetCountInput=$("cartTargetCount"),cartTargetCountGroup=$("cartTargetCountGroup"),cartOptionCountInput=$("cartOptionCount"),cartOptionCountGroup=$("cartOptionCountGroup"),budgetModeInput=$("budgetMode"),minimumBudgetInput=$("minimumBudget"),maximumBudgetInput=$("maximumBudget"),maximumBudgetGroup=$("maximumBudgetGroup"),useWholeDollarBudgetsInput=$("useWholeDollarBudgets"),reinforcementTypeInput=$("reinforcementType"),praiseTextInput=$("praiseText"),feedbackDurationInput=$("feedbackDuration"),saveStudentButton=$("saveStudent"),deleteStudentButton=$("deleteStudentButton"),settingsMessage=$("settingsMessage");
const reportStudentFilter=$("reportStudentFilter"),exportCsvButton=$("exportCsvButton"),clearReportsButton=$("clearReportsButton"),reportSummaryCards=$("reportSummaryCards"),sessionTableBody=$("sessionTableBody"),selectedSessionLabel=$("selectedSessionLabel"),trialDetailBody=$("trialDetailBody");
const exportClassroomButton=$("exportClassroomButton"),importClassroomInput=$("importClassroomInput"),dataMessage=$("dataMessage");
const welcomeStudentName=$("welcomeStudentName"),welcomeSessionDetails=$("welcomeSessionDetails"),beginSessionButton=$("beginSessionButton"),welcomeBackButton=$("welcomeBackButton");
const studentGreeting=$("studentGreeting"),teacherPromptStatus=$("teacherPromptStatus"),trialCounter=$("trialCounter"),progressBar=$("progressBar"),promptArea=$("promptArea"),promptMessage=$("promptMessage"),singleItemCard=$("singleItemCard"),groceryListCard=$("groceryListCard"),groceryListItems=$("groceryListItems"),totalCostDisplay=$("totalCostDisplay"),totalCost=$("totalCost"),cartBuilderCard=$("cartBuilderCard"),cartChoiceGrid=$("cartChoiceGrid"),cartSelectionCount=$("cartSelectionCount"),cartTotal=$("cartTotal"),remainingBudget=$("remainingBudget"),yesNoAnswerButtons=$("yesNoAnswerButtons"),checkCartButton=$("checkCartButton"),affordabilityQuestion=$("affordabilityQuestion"),itemImage=$("itemImage"),itemName=$("itemName"),itemCategory=$("itemCategory"),itemPrice=$("itemPrice"),budgetDisplay=$("budgetDisplay"),repeatSdButton=$("repeatSdButton"),yesButton=$("yesButton"),noButton=$("noButton"),feedbackArea=$("feedbackArea"),trialContent=$("trialContent"),endSessionButton=$("endSessionButton");
const completionMessage=$("completionMessage"),newSessionButton=$("newSessionButton"),viewReportButton=$("viewReportButton"),completeHomeButton=$("completeHomeButton");
const screens=[homeScreen,teacherScreen,welcomeScreen,groceryScreen,completeScreen];

function showScreen(selected){screens.forEach(s=>s.classList.add("hidden"));selected.classList.remove("hidden")}
function showTeacherPanel(name){studentsPanel.classList.toggle("hidden",name!=="students");reportsPanel.classList.toggle("hidden",name!=="reports");dataPanel.classList.toggle("hidden",name!=="data");studentsTabButton.classList.toggle("active",name==="students");reportsTabButton.classList.toggle("active",name==="reports");dataTabButton.classList.toggle("active",name==="data");if(name==="reports")renderReports()}

function normalizeStudent(s){return{id:s.id,name:s.name,totalTrials:Number(s.totalTrials)||10,promptStyle:s.promptStyle==="baseline"?"baseline":"least-to-most",waitTimeSeconds:Number(s.waitTimeSeconds)||10,promptStepTimeSeconds:Number(s.promptStepTimeSeconds)||5,audioSdEnabled:s.audioSdEnabled!==false,activityLevel:["list-affordability","cart-builder"].includes(s.activityLevel)?s.activityLevel:"single-item",cartTargetCount:Math.max(2,Math.min(4,Number(s.cartTargetCount)||2)),cartOptionCount:Math.max(4,Math.min(5,Number(s.cartOptionCount)||4)),listItemCount:Math.max(2,Math.min(5,Number(s.listItemCount)||2)),budgetMode:s.budgetMode==="fixed"?"fixed":"range",minimumBudget:Number(s.minimumBudget)||2,maximumBudget:Number(s.maximumBudget)||10,useWholeDollarBudgets:s.useWholeDollarBudgets!==false,reinforcementType:s.reinforcementType||"text",praiseText:(s.praiseText||"Nice job!").slice(0,80),feedbackDurationSeconds:Number(s.feedbackDurationSeconds)||2}}
function loadStudents(){const raw=localStorage.getItem(STUDENT_STORAGE_KEY);if(raw){try{appState.students=JSON.parse(raw).map(normalizeStudent)}catch(e){console.error(e);appState.students=starterStudents.map(normalizeStudent)}}else{appState.students=starterStudents.map(normalizeStudent);saveStudents()}const stored=localStorage.getItem(SELECTED_STUDENT_STORAGE_KEY);appState.selectedStudentId=appState.students.some(s=>s.id===stored)?stored:(appState.students[0]?.id||"")}
function saveStudents(){localStorage.setItem(STUDENT_STORAGE_KEY,JSON.stringify(appState.students))}
function saveSelectedStudentId(){localStorage.setItem(SELECTED_STUDENT_STORAGE_KEY,appState.selectedStudentId)}
function loadSessions(){const raw=localStorage.getItem(SESSION_STORAGE_KEY);if(!raw){appState.sessions=[];return}try{appState.sessions=JSON.parse(raw)}catch(e){console.error(e);appState.sessions=[]}}
function saveSessions(){localStorage.setItem(SESSION_STORAGE_KEY,JSON.stringify(appState.sessions))}
function getSelectedStudent(){return appState.students.find(s=>s.id===appState.selectedStudentId)||null}
function updateHomeStudentSelect(){homeStudentSelect.innerHTML="";appState.students.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;o.selected=s.id===appState.selectedStudentId;homeStudentSelect.appendChild(o)});startButton.disabled=appState.students.length===0}
function renderStudentList(){studentList.innerHTML="";if(!appState.students.length){studentList.textContent="No students have been added.";return}appState.students.forEach(s=>{const b=document.createElement("button");b.type="button";b.className="studentListButton"+(s.id===appState.selectedStudentId?" selected":"");b.textContent="👤 "+s.name;b.onclick=()=>selectStudentForEditing(s.id);studentList.appendChild(b)})}
function selectStudentForEditing(id){const s=appState.students.find(x=>x.id===id);if(!s)return;appState.selectedStudentId=s.id;saveSelectedStudentId();studentIdInput.value=s.id;studentNameInput.value=s.name;sessionLengthSelect.value=String(s.totalTrials);promptStyleSelect.value=s.promptStyle;waitTimeInput.value=String(s.waitTimeSeconds);promptStepTimeInput.value=String(s.promptStepTimeSeconds);audioSdEnabledInput.checked=s.audioSdEnabled!==false;activityLevelInput.value=s.activityLevel||"single-item";listItemCountInput.value=String(s.listItemCount||2);cartTargetCountInput.value=String(s.cartTargetCount||2);cartOptionCountInput.value=String(s.cartOptionCount||4);updateActivityLevelDisplay();budgetModeInput.value=s.budgetMode||"range";minimumBudgetInput.value=Number(s.minimumBudget||2).toFixed(2);maximumBudgetInput.value=Number(s.maximumBudget||10).toFixed(2);useWholeDollarBudgetsInput.checked=s.useWholeDollarBudgets!==false;updateBudgetModeDisplay();reinforcementTypeInput.value=s.reinforcementType||"text";praiseTextInput.value=s.praiseText||"Nice job!";feedbackDurationInput.value=String(s.feedbackDurationSeconds||2);profileFormTitle.textContent="Edit "+s.name;deleteStudentButton.disabled=false;settingsMessage.textContent="";updateHomeStudentSelect();renderStudentList()}
function beginNewStudent(){studentIdInput.value="";studentNameInput.value="";sessionLengthSelect.value="10";promptStyleSelect.value="least-to-most";waitTimeInput.value="10";promptStepTimeInput.value="5";audioSdEnabledInput.checked=true;activityLevelInput.value="single-item";listItemCountInput.value="2";cartTargetCountInput.value="2";cartOptionCountInput.value="4";updateActivityLevelDisplay();budgetModeInput.value="range";minimumBudgetInput.value="2.00";maximumBudgetInput.value="10.00";useWholeDollarBudgetsInput.checked=true;updateBudgetModeDisplay();reinforcementTypeInput.value="text";praiseTextInput.value="Nice job!";feedbackDurationInput.value="2";profileFormTitle.textContent="Add Student";deleteStudentButton.disabled=true;settingsMessage.textContent="";studentNameInput.focus()}
function createStudentId(name){const safe=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");return(safe||"student")+"-"+Date.now()}
function saveStudentProfile(){const name=studentNameInput.value.trim();if(!name){settingsMessage.textContent="Please enter a student name.";studentNameInput.focus();return}const id=studentIdInput.value;const p=normalizeStudent({id:id||createStudentId(name),name,totalTrials:Number(sessionLengthSelect.value),promptStyle:promptStyleSelect.value,waitTimeSeconds:Number(waitTimeInput.value)||10,promptStepTimeSeconds:Number(promptStepTimeInput.value)||5,audioSdEnabled:audioSdEnabledInput.checked,activityLevel:activityLevelInput.value,listItemCount:Number(listItemCountInput.value)||2,cartTargetCount:Number(cartTargetCountInput.value)||2,cartOptionCount:Number(cartOptionCountInput.value)||4,budgetMode:budgetModeInput.value,minimumBudget:Number(minimumBudgetInput.value)||2,maximumBudget:Number(maximumBudgetInput.value)||10,useWholeDollarBudgets:useWholeDollarBudgetsInput.checked,reinforcementType:reinforcementTypeInput.value,praiseText:(praiseTextInput.value.trim()||"Nice job!").slice(0,80),feedbackDurationSeconds:Number(feedbackDurationInput.value)||2});const i=appState.students.findIndex(s=>s.id===id);if(i>=0)appState.students[i]=p;else appState.students.push(p);appState.selectedStudentId=p.id;saveStudents();saveSelectedStudentId();updateHomeStudentSelect();renderStudentList();selectStudentForEditing(p.id);updateReportStudentFilter();settingsMessage.textContent=p.name+"'s profile was saved."}
function deleteSelectedStudent(){const id=studentIdInput.value;if(!id)return;const s=appState.students.find(x=>x.id===id);if(!s||!confirm("Delete "+s.name+"'s profile?"))return;appState.students=appState.students.filter(x=>x.id!==id);appState.selectedStudentId=appState.students[0]?.id||"";saveStudents();saveSelectedStudentId();updateHomeStudentSelect();renderStudentList();updateReportStudentFilter();appState.selectedStudentId?selectStudentForEditing(appState.selectedStudentId):beginNewStudent()}

function openStudentWelcome(){const s=getSelectedStudent();if(!s)return;appState.currentStudent=s;welcomeStudentName.textContent="Welcome, "+s.name+"!";if(s.activityLevel==="cart-builder"){
        welcomeSessionDetails.textContent=
            "You will choose items that fit within your budget.";
    }else{
        welcomeSessionDetails.textContent=
            "You will complete "+s.totalTrials+" shopping trial"+
            (s.totalTrials===1?".":"s.");
    }showScreen(welcomeScreen)}
const formatCurrency=v=>"$"+Number(v).toFixed(2);
const formatSeconds=v=>v===null||v===undefined?"—":Number(v).toFixed(2)+" sec";
const average=a=>a.length?a.reduce((t,v)=>t+v,0)/a.length:0;
function median(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}

async function loadGroceryItems(){const r=await fetch("data/grocery.json");if(!r.ok)throw new Error("Could not load grocery.json.");const items=await r.json();if(!Array.isArray(items)||!items.length)throw new Error("The grocery item list is empty.");appState.items=items}
function shuffleArray(a){const c=[...a];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}return c}
function getNextItem(){if(!appState.shuffledItems.length)appState.shuffledItems=shuffleArray(appState.items);return appState.shuffledItems.pop()}

function isCartBuilderLevel(){
    return appState.currentStudent &&
        appState.currentStudent.activityLevel==="cart-builder";
}

function buildCartTrial(){
    const optionCount=Math.max(
        4,
        Math.min(
            5,
            Number(appState.currentStudent.cartOptionCount)||4
        )
    );

    appState.cartChoices=
        shuffleArray(appState.items).slice(0,optionCount);

    appState.selectedCartIndexes=[];
    appState.cartAttempts=0;
}


function getMinimumSolvableCartBudget(){
    if(!isCartBuilderLevel() || !appState.cartChoices.length){
        return 0;
    }

    const target=Math.max(
        2,
        Math.min(
            4,
            Number(appState.currentStudent.cartTargetCount)||2
        )
    );

    const cheapestPrices=appState.cartChoices
        .map(function(item){
            return Number(item.price);
        })
        .sort(function(a,b){
            return a-b;
        })
        .slice(0,target);

    return Number(
        cheapestPrices.reduce(function(total,price){
            return total+price;
        },0).toFixed(2)
    );
}

function getCartTotal(){
    return Number(
        appState.selectedCartIndexes.reduce(function(total,index){
            return total+Number(appState.cartChoices[index].price);
        },0).toFixed(2)
    );
}

function renderCartBuilder(){
    cartChoiceGrid.innerHTML="";

    const target=Math.max(
        2,
        Math.min(
            4,
            Number(appState.currentStudent.cartTargetCount)||2
        )
    );

    appState.cartChoices.forEach(function(item,index){
        const button=document.createElement("button");
        button.type="button";
        button.className="cartChoice";

        const selected=
            appState.selectedCartIndexes.includes(index);

        if(selected){
            button.classList.add("selected");
        }

        const image=document.createElement("img");
        image.src="assets/images/grocery/"+item.image;
        image.alt="";

        const text=document.createElement("span");
        text.className="cartChoiceText";

        const name=document.createElement("span");
        name.className="cartChoiceName";
        name.textContent=item.name;

        const price=document.createElement("span");
        price.className="cartChoicePrice";
        price.textContent=formatCurrency(item.price);

        text.appendChild(name);
        text.appendChild(price);
        button.appendChild(image);
        button.appendChild(text);

        button.addEventListener("click",function(){
            toggleCartChoice(index);
        });

        cartChoiceGrid.appendChild(button);
    });

    const selectedCount=appState.selectedCartIndexes.length;
    const total=getCartTotal();
    const remaining=Number(
        (appState.currentBudget-total).toFixed(2)
    );

    cartSelectionCount.textContent=
        selectedCount+" of "+target+" selected";

    cartTotal.textContent=formatCurrency(total);
    remainingBudget.textContent=formatCurrency(remaining);
    remainingBudget.classList.toggle(
        "remainingNegative",
        remaining<0
    );

    checkCartButton.disabled=selectedCount!==target;
}

function toggleCartChoice(index){
    if(!appState.acceptingResponse){
        return;
    }

    const selectedIndex=
        appState.selectedCartIndexes.indexOf(index);

    if(selectedIndex>=0){
        appState.selectedCartIndexes.splice(selectedIndex,1);
    }else{
        const target=Math.max(
            2,
            Math.min(
                4,
                Number(appState.currentStudent.cartTargetCount)||2
            )
        );

        if(appState.selectedCartIndexes.length>=target){
            return;
        }

        appState.selectedCartIndexes.push(index);
    }

    renderCartBuilder();

    if(
        appState.currentPromptLevel==="visual" ||
        appState.currentPromptLevel==="audio" ||
        appState.currentPromptLevel==="gesture"
    ){
        promptMessage.innerHTML=buildComparisonPrompt();
    }
}

function getRandomBudget(){
    const student=appState.currentStudent||getSelectedStudent();

    if(!student){
        return budgetOptions[Math.floor(Math.random()*budgetOptions.length)];
    }

    const minimum=Math.max(1,Number(student.minimumBudget)||2);
    const maximum=Math.max(minimum,Number(student.maximumBudget)||10);

    if(student.budgetMode==="fixed"){
        return Number(minimum.toFixed(2));
    }

    if(student.useWholeDollarBudgets!==false){
        const minWhole=Math.ceil(minimum);
        const maxWhole=Math.floor(maximum);
        const safeMaximum=Math.max(minWhole,maxWhole);

        return minWhole+Math.floor(
            Math.random()*(safeMaximum-minWhole+1)
        );
    }

    const steps=Math.floor((maximum-minimum)/0.5);
    const selectedStep=Math.floor(Math.random()*(steps+1));

    return Number((minimum+selectedStep*0.5).toFixed(2));
}

function clearPromptTimers(){appState.promptTimeouts.forEach(clearTimeout);appState.promptTimeouts=[]}
function resetPromptDisplay(){
    promptArea.className="promptArea hidden";
    promptMessage.textContent="";
    teacherPromptStatus.textContent="Independent";

    groceryScreen.classList.remove(
        "promptCompare",
        "promptGesture"
    );

    [yesButton,noButton].forEach(function(button){
        button.classList.remove(
            "correctChoice",
            "deemphasizedChoice"
        );

        const hand=button.querySelector(".buttonArrow");

        if(hand){
            hand.classList.add("hidden");
        }
    });
}
function showGesturePrompt(){
    const correctButton=getCorrectButton();
    const incorrectButton=
        correctButton===yesButton
            ? noButton
            : yesButton;

    correctButton.classList.add("correctChoice");
    incorrectButton.classList.add("deemphasizedChoice");

    const hand=
        correctButton.querySelector(".buttonArrow");

    if(hand){
        hand.classList.remove("hidden");
    }
}

function getCorrectAnswer(){const cost=isListAffordabilityLevel()?appState.currentListTotal:Number(appState.currentItem.price);return Number(appState.currentBudget)>=Number(cost)?"yes":"no"}
function getCorrectButton(){return getCorrectAnswer()==="yes"?yesButton:noButton}
function schedulePrompts(){clearPromptTimers();resetPromptDisplay();appState.currentPromptLevel="independent";appState.firstPromptAt=null;if(appState.currentStudent.promptStyle==="baseline"){teacherPromptStatus.textContent="Baseline — no prompts";return}const first=appState.currentStudent.waitTimeSeconds*1000,step=appState.currentStudent.promptStepTimeSeconds*1000;appState.promptTimeouts.push(setTimeout(()=>deliverPrompt("visual"),first));appState.promptTimeouts.push(setTimeout(()=>deliverPrompt("audio"),first+step));appState.promptTimeouts.push(setTimeout(()=>deliverPrompt("gesture"),first+step*2))}

function buildComparisonPrompt(){
    const comparisonLabel=
        isCartBuilderLevel()
            ? "Cart Total"
            : isListAffordabilityLevel()
                ? "Total Cost"
                : "Price";

    const comparisonValue=
        isCartBuilderLevel()
            ? getCartTotal()
            : isListAffordabilityLevel()
                ? appState.currentListTotal
                : appState.currentItem.price;

    return '<div class="comparisonValue"><span>'+
        comparisonLabel+
        '</span><strong>'+
        formatCurrency(comparisonValue)+
        '</strong></div>'+
        '<div class="comparisonArrow">↔</div>'+
        '<div class="comparisonValue"><span>Your Budget</span><strong>'+
        formatCurrency(appState.currentBudget)+
        '</strong></div>';
}

function deliverPrompt(level){
    if(!appState.acceptingResponse){
        return;
    }

    appState.currentPromptLevel=level;

    if(appState.firstPromptAt===null){
        appState.firstPromptAt=performance.now();
    }

    promptArea.className="promptArea";
    promptMessage.textContent="";
    teacherPromptStatus.textContent=PROMPT_LABELS[level];

    const comparisonCost=isListAffordabilityLevel()
        ? appState.currentListTotal
        : appState.currentItem.price;

    const comparisonLabel=isListAffordabilityLevel()
        ? "Total Cost"
        : "Price";

    const comparisonHtml=
        '<div class="comparisonValue"><span>'+comparisonLabel+'</span><strong>'+
        formatCurrency(comparisonCost)+
        '</strong></div><div class="comparisonArrow">↔</div><div class="comparisonValue"><span>Your Budget</span><strong>'+
        formatCurrency(appState.currentBudget)+
        '</strong></div>';

    if(level==="visual"){
        promptArea.classList.add("promptVisual","comparisonBand");
        promptMessage.innerHTML=comparisonHtml;
        groceryScreen.classList.add("promptCompare");
    }

    if(level==="audio"){
        promptArea.classList.add("promptVisual","comparisonBand");
        promptMessage.innerHTML=comparisonHtml;
        groceryScreen.classList.add("promptCompare");
        speakSecondaryPrompt();
    }

    if(level==="gesture"){
        promptArea.classList.add("promptVisual","comparisonBand");
        promptMessage.innerHTML=comparisonHtml;
        groceryScreen.classList.add("promptCompare","promptGesture");
        showGesturePrompt();
    }
}

function speakText(text){
    if(!("speechSynthesis" in window)){
        console.warn("Speech synthesis is not supported in this browser.");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
}

function speakInstructionalCue(){
    if(isCartBuilderLevel()){
        const target=Number(appState.currentStudent.cartTargetCount)||2;
        speakText("Choose "+target+" items that fit in your budget.");
    }else if(isListAffordabilityLevel()){
        speakText("Can I afford everything on my grocery list?");
    }else{
        speakText("Can I afford this item?");
    }
}

function speakSecondaryPrompt(){
    if(isCartBuilderLevel()){
        speakText("Look at your cart total and your budget. Is your cart within budget?");
    }else if(isListAffordabilityLevel()){
        speakText("Look at the total cost and your budget. Do you have enough to buy everything?");
    }else{
        speakText("Look at your budget. Do you have enough to buy this item?");
    }
}


function playReinforcementChime(){
    try{
        const AudioContextClass=
            window.AudioContext || window.webkitAudioContext;

        if(!AudioContextClass){
            return;
        }

        const context=new AudioContextClass();
        const oscillator=context.createOscillator();
        const gain=context.createGain();

        oscillator.type="sine";
        oscillator.frequency.setValueAtTime(659.25,context.currentTime);
        oscillator.frequency.setValueAtTime(783.99,context.currentTime+0.12);

        gain.gain.setValueAtTime(0.0001,context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18,context.currentTime+0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001,context.currentTime+0.35);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime+0.38);
    }catch(error){
        console.warn("Reinforcement chime could not play:",error);
    }
}

function isBaselineSession(){
    return appState.currentStudent &&
        appState.currentStudent.promptStyle==="baseline";
}

function getFeedbackDelayMilliseconds(){
    const seconds=
        Number(appState.currentStudent?.feedbackDurationSeconds)||2;

    return Math.max(1,Math.min(10,seconds))*1000;
}

function deliverCorrectReinforcement(){
    const profile=appState.currentStudent;

    if(!profile || isBaselineSession()){
        return false;
    }

    const type=profile.reinforcementType||"text";

    if(type==="none"){
        return false;
    }

    const praise=profile.praiseText||"Nice job!";

    showFeedback(praise,true);
    feedbackArea.classList.add("reinforcementText");

    if(type==="text-sound"){
        playReinforcementChime();
    }

    return true;
}

async function startSession(){if(!appState.currentStudent)appState.currentStudent=getSelectedStudent();if(!appState.currentStudent)return;disableAnswerButtons();try{if(!appState.items.length)await loadGroceryItems();appState.currentSessionId="session-"+Date.now();appState.sessionStartedAt=new Date().toISOString();appState.currentTrial=0;appState.responses=[];appState.shuffledItems=[];studentGreeting.textContent=appState.currentStudent.name+"'s Shopping Practice";showScreen(groceryScreen);loadNextTrial()}catch(e){console.error(e);alert("The grocery items could not be loaded.")}}
function loadNextTrial(){
    clearPromptTimers();
    hideFeedback();
    resetPromptDisplay();

    if(appState.currentTrial>=appState.currentStudent.totalTrials){
        finishSession();
        return;
    }

    appState.currentTrial+=1;

    if(isCartBuilderLevel()){
        buildCartTrial();
        appState.currentItem=appState.cartChoices[0]||null;
        appState.currentListItems=[];
        appState.currentListTotal=0;
    }else if(isListAffordabilityLevel()){
        buildCurrentListTrial();
        appState.currentItem=appState.currentListItems[0]||null;
        appState.cartChoices=[];
        appState.selectedCartIndexes=[];
    }else{
        appState.currentItem=getNextItem();
        appState.currentListItems=[];
        appState.currentListTotal=0;
        appState.cartChoices=[];
        appState.selectedCartIndexes=[];
    }

    appState.currentBudget=getRandomBudget();

    if(isCartBuilderLevel()){
        const minimumSolvableBudget=
            getMinimumSolvableCartBudget();

        if(appState.currentBudget<minimumSolvableBudget){
            appState.currentBudget=minimumSolvableBudget;
        }
    }
    appState.acceptingResponse=true;

    updateTrialCounter();
    displayCurrentTrial();
    enableAnswerButtons();

    appState.trialStartedAt=performance.now();
    schedulePrompts();

    if(appState.currentStudent.audioSdEnabled!==false){
        window.setTimeout(speakInstructionalCue,150);
    }
}
function updateTrialCounter(){const t=appState.currentStudent.totalTrials;trialCounter.textContent="Trial "+appState.currentTrial+" of "+t;progressBar.style.width=(appState.currentTrial/t*100)+"%"}
function displayCurrentTrial(){
    budgetDisplay.textContent=formatCurrency(appState.currentBudget);

    if(isCartBuilderLevel()){
        singleItemCard.classList.add("hidden");
        groceryListCard.classList.add("hidden");
        cartBuilderCard.classList.remove("hidden");
        yesNoAnswerButtons.classList.add("hidden");
        checkCartButton.classList.remove("hidden");
        affordabilityQuestion.textContent=
            "Choose items that fit in your budget.";
        renderCartBuilder();
        return;
    }

    if(isListAffordabilityLevel()){
        cartBuilderCard.classList.add("hidden");
        yesNoAnswerButtons.classList.remove("hidden");
        checkCartButton.classList.add("hidden");
        singleItemCard.classList.add("hidden");
        groceryListCard.classList.remove("hidden");
        affordabilityQuestion.textContent="Can you afford everything on your grocery list?";
        renderCurrentListTrial();
        return;
    }

    cartBuilderCard.classList.add("hidden");
    yesNoAnswerButtons.classList.remove("hidden");
    checkCartButton.classList.add("hidden");
    groceryListCard.classList.add("hidden");
    singleItemCard.classList.remove("hidden");
    affordabilityQuestion.textContent="Can you afford this item?";
    itemName.textContent=appState.currentItem.name;
    itemCategory.textContent=appState.currentItem.category;
    itemPrice.textContent=formatCurrency(appState.currentItem.price);
    itemImage.onerror=()=>{itemImage.removeAttribute("src");itemImage.alt="Image unavailable for "+appState.currentItem.name};
    itemImage.src="assets/images/grocery/"+appState.currentItem.image;
    itemImage.alt=appState.currentItem.name;
}

function handleCartSubmission(){
    if(!appState.acceptingResponse){
        return;
    }

    const target=
        Number(appState.currentStudent.cartTargetCount)||2;

    if(appState.selectedCartIndexes.length!==target){
        return;
    }

    appState.cartAttempts+=1;

    const total=getCartTotal();
    const withinBudget=total<=Number(appState.currentBudget);

    if(isBaselineSession() || withinBudget){
        const responseTime=performance.now();
        const totalLatencySeconds=Number(
            ((responseTime-appState.trialStartedAt)/1000).toFixed(2)
        );

        const postPromptLatencySeconds=
            appState.firstPromptAt===null
                ? null
                : Number(
                    ((responseTime-appState.firstPromptAt)/1000).toFixed(2)
                );

        appState.acceptingResponse=false;
        clearPromptTimers();
        disableAnswerButtons();
        checkCartButton.disabled=true;

        recordCartTrial(
            withinBudget,
            totalLatencySeconds,
            postPromptLatencySeconds
        );

        if(isBaselineSession()){
            hideFeedback();
            window.setTimeout(loadNextTrial,250);
            return;
        }

        const reinforced=deliverCorrectReinforcement();

        if(!reinforced){
            hideFeedback();
        }

        window.setTimeout(
            loadNextTrial,
            getFeedbackDelayMilliseconds()
        );

        return;
    }

    showFeedback(
        "Your cart is over budget. Try changing an item.",
        false
    );

    window.setTimeout(function(){
        hideFeedback();
        appState.acceptingResponse=true;
        checkCartButton.disabled=false;
    },getFeedbackDelayMilliseconds());
}

function recordCartTrial(ok,latency,postPromptLatency){
    const selectedItems=
        appState.selectedCartIndexes.map(function(index){
            return appState.cartChoices[index];
        });

    appState.responses.push({
        trialNumber:appState.currentTrial,
        item:selectedItems.map(function(item){
            return item.name;
        }).join(" + "),
        category:"Cart Builder",
        price:getCartTotal(),
        listItems:selectedItems.map(function(item){
            return {
                name:item.name,
                price:Number(item.price)
            };
        }),
        budget:Number(appState.currentBudget),
        studentAnswer:"selected cart",
        correctAnswer:"within budget",
        correct:ok,
        latencySeconds:latency,
        postPromptLatencySeconds:postPromptLatency,
        promptLevel:appState.currentPromptLevel,
        independent:appState.currentPromptLevel==="independent",
        rapidResponse:latency<rapidResponseThresholdSeconds,
        cartAttempts:appState.cartAttempts,
        timestamp:new Date().toISOString()
    });
}

function handleAnswer(answer){if(isCartBuilderLevel()||!appState.acceptingResponse)return;const now=performance.now(),lat=Number(((now-appState.trialStartedAt)/1000).toFixed(2)),post=appState.firstPromptAt===null?null:Number(((now-appState.firstPromptAt)/1000).toFixed(2));appState.acceptingResponse=false;clearPromptTimers();disableAnswerButtons();const correct=getCorrectAnswer(),ok=answer===correct;recordTrial(answer,correct,ok,lat,post);showFeedback(ok?"Nice job! You compared the price and your budget.":"Thanks for trying. Let's practice another one.",ok);setTimeout(loadNextTrial,nextTrialDelayMilliseconds)}
function recordTrial(answer,correct,ok,lat,post){appState.responses.push({trialNumber:appState.currentTrial,item:isListAffordabilityLevel()?appState.currentListItems.map(function(item){return item.name}).join(" + "):appState.currentItem.name,category:isListAffordabilityLevel()?"Grocery List":appState.currentItem.category,price:isListAffordabilityLevel()?Number(appState.currentListTotal):Number(appState.currentItem.price),listItems:isListAffordabilityLevel()?appState.currentListItems.map(function(item){return{name:item.name,price:Number(item.price)}}):[],budget:Number(appState.currentBudget),studentAnswer:answer,correctAnswer:correct,correct:ok,latencySeconds:lat,postPromptLatencySeconds:post,promptLevel:appState.currentPromptLevel,independent:appState.currentPromptLevel==="independent",rapidResponse:lat<rapidResponseThresholdSeconds,timestamp:new Date().toISOString()})}
function finishSession(){clearPromptTimers();appState.acceptingResponse=false;disableAnswerButtons();const trials=[...appState.responses],lats=trials.map(r=>r.latencySeconds),correct=trials.filter(r=>r.correct).length,ind=trials.filter(r=>r.independent).length,highest=Math.max(0,...trials.map(r=>PROMPT_LEVELS[r.promptLevel]||0)),highestName=Object.keys(PROMPT_LEVELS).find(k=>PROMPT_LEVELS[k]===highest)||"independent";const rec={id:appState.currentSessionId,studentId:appState.currentStudent.id,studentName:appState.currentStudent.name,startedAt:appState.sessionStartedAt,completedAt:new Date().toISOString(),plannedTrials:appState.currentStudent.totalTrials,completedTrials:trials.length,correctCount:correct,incorrectCount:trials.length-correct,accuracyPercent:trials.length?Number((correct/trials.length*100).toFixed(1)):0,independentCount:ind,independentPercent:trials.length?Number((ind/trials.length*100).toFixed(1)):0,averageLatencySeconds:Number(average(lats).toFixed(2)),medianLatencySeconds:Number(median(lats).toFixed(2)),highestPromptLevel:highestName,promptStyle:appState.currentStudent.promptStyle,waitTimeSeconds:appState.currentStudent.waitTimeSeconds,promptStepTimeSeconds:appState.currentStudent.promptStepTimeSeconds,trials};appState.sessions.unshift(rec);appState.selectedSessionId=rec.id;saveSessions();completionMessage.textContent="Nice work, "+appState.currentStudent.name+"! You completed "+trials.length+" shopping trial"+(trials.length===1?".":"s.");showScreen(completeScreen)}
function showFeedback(msg,ok){promptArea.className="promptArea hidden";promptMessage.textContent="";feedbackArea.textContent=msg;feedbackArea.classList.remove("hidden","feedbackCorrect","feedbackIncorrect");feedbackArea.classList.add(ok?"feedbackCorrect":"feedbackIncorrect");trialContent.style.opacity=".45"}
function hideFeedback(){feedbackArea.textContent="";feedbackArea.classList.add("hidden");feedbackArea.classList.remove("feedbackCorrect","feedbackIncorrect","reinforcementText");trialContent.style.opacity="1"}
function disableAnswerButtons(){yesButton.disabled=true;noButton.disabled=true;if(checkCartButton){checkCartButton.disabled=true}}
function enableAnswerButtons(){
    yesButton.disabled=false;
    noButton.disabled=false;

    if(checkCartButton){
        checkCartButton.disabled=isCartBuilderLevel()
            ? appState.selectedCartIndexes.length!==(
                Number(appState.currentStudent.cartTargetCount)||2
              )
            : false;
    }
}

function updateReportStudentFilter(){const cur=reportStudentFilter.value||"all";reportStudentFilter.innerHTML='<option value="all">All Students</option>';appState.students.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;reportStudentFilter.appendChild(o)});reportStudentFilter.value=[...reportStudentFilter.options].some(o=>o.value===cur)?cur:"all"}
function getFilteredSessions(){const id=reportStudentFilter.value;return!id||id==="all"?[...appState.sessions]:appState.sessions.filter(s=>s.studentId===id)}
function renderReports(){updateReportStudentFilter();const sessions=getFilteredSessions();renderSummaryCards(sessions);renderSessionTable(sessions);const sel=appState.sessions.find(s=>s.id===appState.selectedSessionId)||sessions[0]||null;if(sel){appState.selectedSessionId=sel.id;renderTrialDetails(sel)}else{selectedSessionLabel.textContent="No saved sessions are available.";trialDetailBody.innerHTML=""}}
function renderSummaryCards(sessions){reportSummaryCards.innerHTML="";const trials=sessions.flatMap(s=>s.trials||[]),correct=trials.filter(t=>t.correct).length,ind=trials.filter(t=>t.independent).length,cards=[["Sessions",sessions.length],["Trials",trials.length],["Overall Accuracy",(trials.length?correct/trials.length*100:0).toFixed(1)+"%"],["Independent",(trials.length?ind/trials.length*100:0).toFixed(1)+"%"],["Average Latency",formatSeconds(average(trials.map(t=>t.latencySeconds)))]];cards.forEach(([l,v])=>{const d=document.createElement("div");d.className="summaryCard";d.innerHTML="<span>"+l+"</span><strong>"+v+"</strong>";reportSummaryCards.appendChild(d)})}
function renderSessionTable(sessions){sessionTableBody.innerHTML="";if(!sessions.length){sessionTableBody.innerHTML='<tr><td colspan="7">No sessions have been saved.</td></tr>';return}sessions.forEach(s=>{const r=document.createElement("tr");r.className="sessionRow"+(s.id===appState.selectedSessionId?" selected":"");[new Date(s.completedAt).toLocaleString(),s.studentName,s.completedTrials,s.accuracyPercent+"%",(s.independentPercent??0)+"%",formatSeconds(s.averageLatencySeconds),PROMPT_LABELS[s.highestPromptLevel||"independent"]].forEach(v=>{const c=document.createElement("td");c.textContent=v;r.appendChild(c)});r.onclick=()=>{appState.selectedSessionId=s.id;renderReports()};sessionTableBody.appendChild(r)})}
function renderTrialDetails(s){selectedSessionLabel.textContent=s.studentName+" — "+new Date(s.completedAt).toLocaleString();trialDetailBody.innerHTML="";(s.trials||[]).forEach(t=>{const r=document.createElement("tr");[t.trialNumber,t.item,formatCurrency(t.price),formatCurrency(t.budget),t.studentAnswer.toUpperCase(),t.correct?"Yes":"No",formatSeconds(t.latencySeconds),PROMPT_LABELS[t.promptLevel||"independent"],formatSeconds(t.postPromptLatencySeconds)].forEach(v=>{const c=document.createElement("td");c.textContent=v;r.appendChild(c)});trialDetailBody.appendChild(r)})}
function downloadTextFile(name,content,type){const b=new Blob([content],{type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}
function exportSessionsToCsv(){const sessions=getFilteredSessions();if(!sessions.length){alert("There are no sessions to export.");return}const rows=[["Session ID","Student","Session Completed","Trial","Item","Category","Price","Budget","Student Answer","Correct Answer","Correct","Total Latency Seconds","Prompt Level","Independent","Post-Prompt Latency Seconds"]];sessions.forEach(s=>(s.trials||[]).forEach(t=>rows.push([s.id,s.studentName,s.completedAt,t.trialNumber,t.item,t.category,Number(t.price).toFixed(2),Number(t.budget).toFixed(2),t.studentAnswer,t.correctAnswer,t.correct?"Yes":"No",Number(t.latencySeconds).toFixed(2),t.promptLevel||"independent",t.independent?"Yes":"No",t.postPromptLatencySeconds==null?"":Number(t.postPromptLatencySeconds).toFixed(2)])));downloadTextFile("budget-buddy-session-data.csv",rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n"),"text/csv;charset=utf-8;")}
function clearSavedReports(){if(!confirm("Delete all saved session reports from this browser?"))return;appState.sessions=[];appState.selectedSessionId="";saveSessions();renderReports()}

function exportClassroomBackup(){const backup={app:"Budget Buddy",version:"0.6",exportedAt:new Date().toISOString(),selectedStudentId:appState.selectedStudentId,students:appState.students,sessions:appState.sessions};downloadTextFile("budget-buddy-classroom-backup.json",JSON.stringify(backup,null,2),"application/json;charset=utf-8;");dataMessage.textContent="Classroom backup exported."}
async function importClassroomBackup(e){const file=e.target.files[0];if(!file)return;try{const backup=JSON.parse(await file.text());if(!backup||!Array.isArray(backup.students)||!Array.isArray(backup.sessions))throw new Error("Invalid backup");if(!confirm("Importing will replace the students and reports currently saved on this device. Continue?")){importClassroomInput.value="";return}appState.students=backup.students.map(normalizeStudent);appState.sessions=backup.sessions;appState.selectedStudentId=appState.students.some(s=>s.id===backup.selectedStudentId)?backup.selectedStudentId:(appState.students[0]?.id||"");saveStudents();saveSessions();saveSelectedStudentId();updateHomeStudentSelect();updateReportStudentFilter();renderStudentList();dataMessage.textContent="Classroom backup imported successfully."}catch(err){console.error(err);dataMessage.textContent="The selected file could not be imported."}importClassroomInput.value=""}



function updateActivityLevelDisplay(){
    if(!activityLevelInput){return}

    const level=activityLevelInput.value;

    if(listItemCountGroup){
        listItemCountGroup.classList.toggle(
            "hidden",
            level!=="list-affordability"
        );
    }

    if(cartTargetCountGroup){
        cartTargetCountGroup.classList.toggle(
            "hidden",
            level!=="cart-builder"
        );
    }

    if(cartOptionCountGroup){
        cartOptionCountGroup.classList.toggle(
            "hidden",
            level!=="cart-builder"
        );
    }
}

function isListAffordabilityLevel(){
    return appState.currentStudent &&
        appState.currentStudent.activityLevel==="list-affordability";
}

function buildCurrentListTrial(){
    const count=Math.max(2,Math.min(5,Number(appState.currentStudent.listItemCount)||2));
    appState.currentListItems=shuffleArray(appState.items).slice(0,count);
    appState.currentListTotal=Number(
        appState.currentListItems.reduce(function(total,item){
            return total+Number(item.price);
        },0).toFixed(2)
    );
}

function renderCurrentListTrial(){
    groceryListItems.innerHTML="";
    appState.currentListItems.forEach(function(item){
        const row=document.createElement("div");
        row.className="groceryListRow";

        const image=document.createElement("img");
        image.className="groceryListThumb";
        image.src="assets/images/grocery/"+item.image;
        image.alt="";

        const name=document.createElement("span");
        name.className="groceryListName";
        name.textContent=item.name;

        const price=document.createElement("span");
        price.className="groceryListPrice";
        price.textContent=formatCurrency(item.price);

        row.appendChild(image);
        row.appendChild(name);
        row.appendChild(price);
        groceryListItems.appendChild(row);
    });

    totalCost.textContent=formatCurrency(appState.currentListTotal);
}

function updateBudgetModeDisplay(){
    const fixed=budgetModeInput.value==="fixed";

    maximumBudgetGroup.classList.toggle("hidden",fixed);

    if(fixed){
        maximumBudgetInput.value=minimumBudgetInput.value;
    }
}

if(activityLevelInput){activityLevelInput.addEventListener("change",updateActivityLevelDisplay)}
if(budgetModeInput){budgetModeInput.addEventListener("change",updateBudgetModeDisplay)}
if(minimumBudgetInput){minimumBudgetInput.addEventListener("change",function(){
    if(budgetModeInput.value==="fixed"){
        maximumBudgetInput.value=minimumBudgetInput.value;
    }
})}

homeStudentSelect.onchange=()=>{appState.selectedStudentId=homeStudentSelect.value;saveSelectedStudentId()};
startButton.onclick=openStudentWelcome;
teacherButton.onclick=()=>{renderStudentList();appState.selectedStudentId?selectStudentForEditing(appState.selectedStudentId):beginNewStudent();showTeacherPanel("students");showScreen(teacherScreen)};
teacherBackButton.onclick=()=>{updateHomeStudentSelect();showScreen(homeScreen)};
studentsTabButton.onclick=()=>showTeacherPanel("students");
reportsTabButton.onclick=()=>showTeacherPanel("reports");
dataTabButton.onclick=()=>showTeacherPanel("data");
addStudentButton.onclick=beginNewStudent;
saveStudentButton.onclick=saveStudentProfile;
deleteStudentButton.onclick=deleteSelectedStudent;
reportStudentFilter.onchange=renderReports;
exportCsvButton.onclick=exportSessionsToCsv;
clearReportsButton.onclick=clearSavedReports;
exportClassroomButton.onclick=exportClassroomBackup;
importClassroomInput.onchange=importClassroomBackup;
beginSessionButton.onclick=startSession;
welcomeBackButton.onclick=()=>showScreen(homeScreen);
repeatSdButton.onclick=speakInstructionalCue;
checkCartButton.onclick=handleCartSubmission;
yesButton.onclick=()=>handleAnswer("yes");
noButton.onclick=()=>handleAnswer("no");
endSessionButton.onclick=finishSession;
newSessionButton.onclick=openStudentWelcome;
viewReportButton.onclick=()=>{showTeacherPanel("reports");showScreen(teacherScreen)};
completeHomeButton.onclick=()=>showScreen(homeScreen);

loadStudents();loadSessions();updateHomeStudentSelect();updateReportStudentFilter();disableAnswerButtons();showScreen(homeScreen);console.log("Budget Buddy v0.12.3 loaded successfully");
