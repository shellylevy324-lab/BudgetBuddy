const CLASSROOM_STORAGE_KEY="budgetBuddyClassroom_v1";
const REINFORCEMENT_LIBRARY_STORAGE_KEY="budgetBuddyReinforcementLibrary_v1";
const STAFF_STORAGE_KEY="budgetBuddyStaff_v1";
const SELECTED_ADMIN_STORAGE_KEY="budgetBuddySelectedAdministrator_v1";
const STUDENT_STORAGE_KEY="budgetBuddyStudents",SELECTED_STUDENT_STORAGE_KEY="budgetBuddySelectedStudent",SESSION_STORAGE_KEY="budgetBuddySessions",nextTrialDelayMilliseconds=1800,rapidResponseThresholdSeconds=1;
const PROMPT_LEVELS={independent:0,visual:1,audio:2,gesture:3},PROMPT_LABELS={independent:"Independent",visual:"Visual price comparison prompt",audio:"Secondary audio prompt",gesture:"Gestural answer prompt"};
const budgetOptions=[2,3,4,5,6,8,10];
const starterStudents=[{id:"shelly-test",name:"Shelly (Test)",totalTrials:10,promptStyle:"baseline",waitTimeSeconds:10,promptStepTimeSeconds:5,audioSdEnabled:true},{id:"student-a",name:"Student A",totalTrials:5,promptStyle:"least-to-most",waitTimeSeconds:10,promptStepTimeSeconds:5,audioSdEnabled:true}];
const appState={classroom:{name:"My Classroom",leadTeacher:""},staff:[],reinforcementLibrary:[],selectedAdministratorId:"",students:[],sessions:[],selectedStudentId:"",selectedSessionId:"",currentStudent:null,currentSessionId:"",sessionStartedAt:null,currentTrial:0,tokensEarned:0,awaitingModelCorrection:false,lastTrialCorrected:false,firstResponseRecorded:false,buttonActivatedAt:null,responses:[],items:[],shuffledItems:[],currentItem:null,currentListItems:[],currentListTotal:0,cartChoices:[],selectedCartIndexes:[],cartAttempts:0,currentBudget:0,trialStartedAt:null,firstPromptAt:null,currentPromptLevel:"independent",promptTimeouts:[],responseUnlockTimeout:null,acceptingResponse:false};
let pendingLibraryTokenData="";
let pendingLibraryTokenFileName="";
let pendingLibraryCompletionData="";
let pendingLibraryCompletionFileName="";
let pendingLibraryAudioData="";
let pendingLibraryAudioFileName="";
let pendingTokenAnimationData="",pendingTokenAnimationFileName="",pendingCompletionAnimationData="",pendingCompletionAnimationFileName="",pendingCompletionAudioData="",pendingCompletionAudioFileName="";


const $=id=>document.getElementById(id);
const homeScreen=$("homeScreen"),teacherScreen=$("teacherScreen"),welcomeScreen=$("welcomeScreen"),groceryScreen=$("groceryScreen"),completeScreen=$("completeScreen");
const homeStudentSelect=$("homeStudentSelect"),startButton=$("startButton"),teacherButton=$("teacherButton"),teacherBackButton=$("teacherBackButton");
const classroomTabButton=$("classroomTabButton"),studentsTabButton=$("studentsTabButton"),reportsTabButton=$("reportsTabButton"),dataTabButton=$("dataTabButton");
const classroomPanel=$("classroomPanel"),studentsPanel=$("studentsPanel"),reportsPanel=$("reportsPanel"),dataPanel=$("dataPanel");
const addStudentButton=$("addStudentButton"),studentList=$("studentList"),profileFormTitle=$("profileFormTitle"),studentIdInput=$("studentId"),studentNameInput=$("studentName"),sessionLengthSelect=$("sessionLength"),promptStyleSelect=$("promptStyle"),tokenPromptSettings=$("tokenPromptSettings"),tokenReinforcementSettings=$("tokenReinforcementSettings"),startingPromptLevelInput=$("startingPromptLevel"),tokenGoalInput=$("tokenGoal"),maximumTokenTrialsInput=$("maximumTokenTrials"),tokenAnimationPathInput=$("tokenAnimationPath"),tokenAnimationUploadInput=$("tokenAnimationUpload"),tokenAnimationUploadStatus=$("tokenAnimationUploadStatus"),clearTokenAnimationUploadButton=$("clearTokenAnimationUpload"),completionAnimationPathInput=$("completionAnimationPath"),completionAnimationUploadInput=$("completionAnimationUpload"),completionAnimationUploadStatus=$("completionAnimationUploadStatus"),clearCompletionAnimationUploadButton=$("clearCompletionAnimationUpload"),completionAudioPathInput=$("completionAudioPath"),completionAudioUploadInput=$("completionAudioUpload"),completionAudioUploadStatus=$("completionAudioUploadStatus"),clearCompletionAudioUploadButton=$("clearCompletionAudioUpload"),waitTimeInput=$("waitTime"),promptStepTimeInput=$("promptStepTime"),audioSdEnabledInput=$("audioSdEnabled"),activityLevelInput=$("activityLevel"),listItemCountInput=$("listItemCount"),listItemCountGroup=$("listItemCountGroup"),cartTargetCountInput=$("cartTargetCount"),cartTargetCountGroup=$("cartTargetCountGroup"),cartOptionCountInput=$("cartOptionCount"),cartOptionCountGroup=$("cartOptionCountGroup"),budgetModeInput=$("budgetMode"),minimumBudgetInput=$("minimumBudget"),maximumBudgetInput=$("maximumBudget"),maximumBudgetGroup=$("maximumBudgetGroup"),useWholeDollarBudgetsInput=$("useWholeDollarBudgets"),reinforcementPackageInput=$("reinforcementPackage"),differentialReinforcementInput=$("differentialReinforcement"),customReinforcementSettings=$("customReinforcementSettings"),previewTokenReinforcementButton=$("previewTokenReinforcement"),previewCompletionReinforcementButton=$("previewCompletionReinforcement"),reinforcementTypeInput=$("reinforcementType"),praiseTextInput=$("praiseText"),feedbackDurationInput=$("feedbackDuration"),responseDelaySecondsInput=$("responseDelaySeconds"),errorModelCorrectResponseInput=$("errorModelCorrectResponse"),errorRequireCorrectionResponseInput=$("errorRequireCorrectionResponse"),errorWithholdTokenInput=$("errorWithholdToken"),errorContinueSessionInput=$("errorContinueSession"),dataAccuracyInput=$("dataAccuracy"),dataLatencyInput=$("dataLatency"),dataPromptLevelInput=$("dataPromptLevel"),dataIndependentInput=$("dataIndependent"),dataTokensInput=$("dataTokens"),dataCorrectionsInput=$("dataCorrections"),dataCartAttemptsInput=$("dataCartAttempts"),dataResponseDistributionInput=$("dataResponseDistribution"),saveStudentButton=$("saveStudent"),deleteStudentButton=$("deleteStudentButton"),settingsMessage=$("settingsMessage");
const reportStudentFilter=$("reportStudentFilter"),reportAdministratorFilter=$("reportAdministratorFilter"),exportCsvButton=$("exportCsvButton"),clearReportsButton=$("clearReportsButton"),reportSummaryCards=$("reportSummaryCards"),sessionTableBody=$("sessionTableBody"),selectedSessionLabel=$("selectedSessionLabel"),trialDetailBody=$("trialDetailBody");
const exportClassroomButton=$("exportClassroomButton"),importClassroomInput=$("importClassroomInput"),dataMessage=$("dataMessage");
const classroomNameInput=$("classroomName"),classroomTeacherNameInput=$("classroomTeacherName"),saveClassroomButton=$("saveClassroomButton"),classroomMessage=$("classroomMessage"),staffList=$("staffList"),addStaffButton=$("addStaffButton"),staffEditor=$("staffEditor"),staffIdInput=$("staffId"),staffNameInput=$("staffName"),staffRoleInput=$("staffRole"),staffActiveInput=$("staffActive"),saveStaffButton=$("saveStaffButton"),cancelStaffButton=$("cancelStaffButton"),staffMessage=$("staffMessage");
const reinforcementLibraryList=$("reinforcementLibraryList"),addLibraryPackageButton=$("addLibraryPackageButton"),libraryPackageEditor=$("libraryPackageEditor"),libraryPackageIdInput=$("libraryPackageId"),libraryPackageNameInput=$("libraryPackageName"),libraryPraiseTextInput=$("libraryPraiseText"),libraryTokenUploadInput=$("libraryTokenUpload"),libraryTokenStatus=$("libraryTokenStatus"),clearLibraryTokenButton=$("clearLibraryTokenButton"),libraryTokenPathInput=$("libraryTokenPath"),libraryCompletionUploadInput=$("libraryCompletionUpload"),libraryCompletionStatus=$("libraryCompletionStatus"),clearLibraryCompletionButton=$("clearLibraryCompletionButton"),libraryCompletionPathInput=$("libraryCompletionPath"),libraryAudioUploadInput=$("libraryAudioUpload"),libraryAudioStatus=$("libraryAudioStatus"),clearLibraryAudioButton=$("clearLibraryAudioButton"),libraryAudioPathInput=$("libraryAudioPath"),previewLibraryTokenButton=$("previewLibraryTokenButton"),previewLibraryCompletionButton=$("previewLibraryCompletionButton"),saveLibraryPackageButton=$("saveLibraryPackageButton"),deactivateLibraryPackageButton=$("deactivateLibraryPackageButton"),cancelLibraryPackageButton=$("cancelLibraryPackageButton"),libraryPackageMessage=$("libraryPackageMessage"),classroomReinforcementOptions=$("classroomReinforcementOptions");
const welcomeStudentName=$("welcomeStudentName"),welcomeSessionDetails=$("welcomeSessionDetails"),sessionAdministratorSelect=$("sessionAdministratorSelect"),beginSessionButton=$("beginSessionButton"),welcomeBackButton=$("welcomeBackButton");
const studentGreeting=$("studentGreeting"),teacherPromptStatus=$("teacherPromptStatus"),tokenBoard=$("tokenBoard"),tokenCountLabel=$("tokenCountLabel"),tokenSlots=$("tokenSlots"),tokenCelebrationOverlay=$("tokenCelebrationOverlay"),tokenCelebrationImage=$("tokenCelebrationImage"),builtInTokenAnimation=$("builtInTokenAnimation"),tokenCelebrationText=$("tokenCelebrationText"),trialCounter=$("trialCounter"),progressBar=$("progressBar"),promptArea=$("promptArea"),promptMessage=$("promptMessage"),singleItemCard=$("singleItemCard"),groceryListCard=$("groceryListCard"),groceryListItems=$("groceryListItems"),totalCostDisplay=$("totalCostDisplay"),totalCost=$("totalCost"),cartBuilderCard=$("cartBuilderCard"),cartChoiceGrid=$("cartChoiceGrid"),cartSelectionCount=$("cartSelectionCount"),cartTotal=$("cartTotal"),remainingBudget=$("remainingBudget"),yesNoAnswerButtons=$("yesNoAnswerButtons"),checkCartButton=$("checkCartButton"),responseDelayMessage=$("responseDelayMessage"),affordabilityQuestion=$("affordabilityQuestion"),itemImage=$("itemImage"),itemName=$("itemName"),itemCategory=$("itemCategory"),itemPrice=$("itemPrice"),budgetDisplay=$("budgetDisplay"),repeatSdButton=$("repeatSdButton"),yesButton=$("yesButton"),noButton=$("noButton"),feedbackArea=$("feedbackArea"),trialContent=$("trialContent"),endSessionButton=$("endSessionButton");
const completionMessage=$("completionMessage"),newSessionButton=$("newSessionButton"),viewReportButton=$("viewReportButton"),completeHomeButton=$("completeHomeButton");
const screens=[homeScreen,teacherScreen,welcomeScreen,groceryScreen,completeScreen];


function openStudentPrograms(){
    try{
        showScreen(teacherScreen);

        classroomPanel.classList.add("hidden");
        reportsPanel.classList.add("hidden");
        dataPanel.classList.add("hidden");
        studentsPanel.classList.remove("hidden");

        classroomTabButton.classList.remove("active");
        reportsTabButton.classList.remove("active");
        dataTabButton.classList.remove("active");
        studentsTabButton.classList.add("active");

        window.setTimeout(function(){
            try{
                renderStudentList();

                if(appState.selectedStudentId){
                    selectStudentForEditing(appState.selectedStudentId);
                }else{
                    beginNewStudent();
                }

                updateAdministratorSelects();
            }catch(error){
                console.error("Student Programs content could not finish loading:",error);
            }
        },0);
    }catch(error){
        console.error("Student Programs could not open:",error);

        document.querySelectorAll(".screen").forEach(function(screen){
            screen.classList.add("hidden");
        });

        const teacher=document.getElementById("teacherScreen");
        if(teacher){
            teacher.classList.remove("hidden");
        }
    }
}

window.openStudentPrograms=openStudentPrograms;

function showScreen(selected){screens.forEach(s=>s.classList.add("hidden"));selected.classList.remove("hidden")}
function showTeacherPanel(name){
    classroomPanel.classList.toggle("hidden",name!=="classroom");
    studentsPanel.classList.toggle("hidden",name!=="students");
    reportsPanel.classList.toggle("hidden",name!=="reports");
    dataPanel.classList.toggle("hidden",name!=="data");

    classroomTabButton.classList.toggle("active",name==="classroom");
    studentsTabButton.classList.toggle("active",name==="students");
    reportsTabButton.classList.toggle("active",name==="reports");
    dataTabButton.classList.toggle("active",name==="data");

    if(name==="classroom"){
        renderClassroom();
        renderStaffList();
        renderReinforcementLibrary();
    }

    if(name==="reports"){
        renderReports();
    }
}



function normalizeLibraryPackage(item){
    return {
        id:item.id||("reinforcement-"+Date.now()),
        name:(item.name||"Classroom Package").slice(0,60),
        praiseText:(item.praiseText||"Nice job!").slice(0,80),
        tokenData:item.tokenData||"",
        tokenFileName:item.tokenFileName||"",
        tokenPath:item.tokenPath||"",
        completionData:item.completionData||"",
        completionFileName:item.completionFileName||"",
        completionPath:item.completionPath||"",
        audioData:item.audioData||"",
        audioFileName:item.audioFileName||"",
        audioPath:item.audioPath||"",
        active:item.active!==false
    };
}

function saveReinforcementLibrary(){
    try{
        localStorage.setItem(
            REINFORCEMENT_LIBRARY_STORAGE_KEY,
            JSON.stringify(appState.reinforcementLibrary)
        );
    }catch(error){
        console.error(error);
        alert(
            "The reinforcement package could not be saved because browser storage is full. Use smaller files or project paths."
        );
        throw error;
    }
}

function loadReinforcementLibrary(){
    const raw=localStorage.getItem(
        REINFORCEMENT_LIBRARY_STORAGE_KEY
    );

    if(!raw){
        appState.reinforcementLibrary=[];
        return;
    }

    try{
        const parsed=JSON.parse(raw);
        appState.reinforcementLibrary=Array.isArray(parsed)
            ? parsed.map(normalizeLibraryPackage)
            : [];
    }catch(error){
        console.error(error);
        appState.reinforcementLibrary=[];
    }
}

function getLibraryPackageByValue(value){
    if(!String(value||"").startsWith("library:")){
        return null;
    }

    const id=String(value).slice("library:".length);

    return appState.reinforcementLibrary.find(function(item){
        return item.id===id;
    })||null;
}

function updateReinforcementPackageOptions(selectedValue=""){
    if(!classroomReinforcementOptions){return}

    classroomReinforcementOptions.innerHTML="";

    appState.reinforcementLibrary
        .filter(function(item){return item.active})
        .forEach(function(item){
            const option=document.createElement("option");
            option.value="library:"+item.id;
            option.textContent="❤️ "+item.name;
            classroomReinforcementOptions.appendChild(option);
        });

    const desired=selectedValue||reinforcementPackageInput.value||"stars";
    const exists=[...reinforcementPackageInput.options].some(function(option){
        return option.value===desired;
    });

    reinforcementPackageInput.value=exists ? desired : "stars";
    updateReinforcementPackageDisplay();
}

function renderReinforcementLibrary(){
    reinforcementLibraryList.innerHTML="";

    if(!appState.reinforcementLibrary.length){
        const empty=document.createElement("p");
        empty.className="fieldHelp";
        empty.textContent="No classroom packages have been created yet.";
        reinforcementLibraryList.appendChild(empty);
        return;
    }

    appState.reinforcementLibrary.forEach(function(item){
        const card=document.createElement("div");
        card.className="libraryPackageCard"+(item.active?"":" inactive");

        const preview=document.createElement("div");
        preview.className="libraryPackagePreview";

        const imageSource=item.tokenData||item.tokenPath;

        if(imageSource){
            const image=document.createElement("img");
            image.src=imageSource;
            image.alt="";
            preview.appendChild(image);
        }else{
            preview.textContent="⭐";
        }

        const title=document.createElement("h4");
        title.textContent=item.name;

        const details=document.createElement("p");
        details.textContent=
            (item.active?"Active":"Inactive")+
            " · "+(item.praiseText||"Nice job!");

        const edit=document.createElement("button");
        edit.type="button";
        edit.className="smallButton";
        edit.textContent="Edit";
        edit.onclick=function(){
            openLibraryPackageEditor(item.id);
        };

        card.appendChild(preview);
        card.appendChild(title);
        card.appendChild(details);
        card.appendChild(edit);
        reinforcementLibraryList.appendChild(card);
    });
}

function setLibraryUploadStatuses(){
    setUploadStatus(
        libraryTokenStatus,
        pendingLibraryTokenFileName,
        pendingLibraryTokenData
    );
    setUploadStatus(
        libraryCompletionStatus,
        pendingLibraryCompletionFileName,
        pendingLibraryCompletionData
    );
    setUploadStatus(
        libraryAudioStatus,
        pendingLibraryAudioFileName,
        pendingLibraryAudioData
    );
}

function openLibraryPackageEditor(id=""){
    const item=appState.reinforcementLibrary.find(function(packageItem){
        return packageItem.id===id;
    });

    libraryPackageEditor.classList.remove("hidden");
    libraryPackageIdInput.value=item?.id||"";
    libraryPackageNameInput.value=item?.name||"";
    libraryPraiseTextInput.value=item?.praiseText||"Nice job!";
    libraryTokenPathInput.value=item?.tokenPath||"";
    libraryCompletionPathInput.value=item?.completionPath||"";
    libraryAudioPathInput.value=item?.audioPath||"";

    pendingLibraryTokenData=item?.tokenData||"";
    pendingLibraryTokenFileName=item?.tokenFileName||"";
    pendingLibraryCompletionData=item?.completionData||"";
    pendingLibraryCompletionFileName=item?.completionFileName||"";
    pendingLibraryAudioData=item?.audioData||"";
    pendingLibraryAudioFileName=item?.audioFileName||"";

    libraryTokenUploadInput.value="";
    libraryCompletionUploadInput.value="";
    libraryAudioUploadInput.value="";
    setLibraryUploadStatuses();

    deactivateLibraryPackageButton.disabled=!item;
    deactivateLibraryPackageButton.textContent=item?.active===false
        ? "Reactivate"
        : "Deactivate";

    libraryPackageMessage.textContent="";
    libraryPackageNameInput.focus();
}

function closeLibraryPackageEditor(){
    libraryPackageEditor.classList.add("hidden");
    libraryPackageIdInput.value="";
    libraryPackageMessage.textContent="";
}

function saveLibraryPackage(){
    const name=libraryPackageNameInput.value.trim();

    if(!name){
        libraryPackageMessage.textContent="Please enter a package name.";
        return;
    }

    const id=libraryPackageIdInput.value||
        ("reinforcement-"+Date.now());

    const existing=appState.reinforcementLibrary.find(function(item){
        return item.id===id;
    });

    const record=normalizeLibraryPackage({
        id:id,
        name:name,
        praiseText:libraryPraiseTextInput.value.trim()||"Nice job!",
        tokenData:pendingLibraryTokenData,
        tokenFileName:pendingLibraryTokenFileName,
        tokenPath:libraryTokenPathInput.value.trim(),
        completionData:pendingLibraryCompletionData,
        completionFileName:pendingLibraryCompletionFileName,
        completionPath:libraryCompletionPathInput.value.trim(),
        audioData:pendingLibraryAudioData,
        audioFileName:pendingLibraryAudioFileName,
        audioPath:libraryAudioPathInput.value.trim(),
        active:existing?.active!==false
    });

    const index=appState.reinforcementLibrary.findIndex(function(item){
        return item.id===id;
    });

    if(index>=0){
        appState.reinforcementLibrary[index]=record;
    }else{
        appState.reinforcementLibrary.push(record);
    }

    saveReinforcementLibrary();
    renderReinforcementLibrary();
    updateReinforcementPackageOptions(
        "library:"+record.id
    );
    closeLibraryPackageEditor();
}

function toggleLibraryPackageActive(){
    const id=libraryPackageIdInput.value;

    if(!id){return}

    const item=appState.reinforcementLibrary.find(function(packageItem){
        return packageItem.id===id;
    });

    if(!item){return}

    item.active=!item.active;
    saveReinforcementLibrary();
    renderReinforcementLibrary();
    updateReinforcementPackageOptions();
    closeLibraryPackageEditor();
}

function buildLibraryPreviewProfile(){
    return {
        reinforcementPackage:"library:"+(
            libraryPackageIdInput.value||"preview"
        ),
        reinforcementType:"text-sound",
        praiseText:libraryPraiseTextInput.value.trim()||"Nice job!",
        libraryPreviewPackage:normalizeLibraryPackage({
            id:libraryPackageIdInput.value||"preview",
            name:libraryPackageNameInput.value.trim()||"Preview",
            praiseText:libraryPraiseTextInput.value.trim()||"Nice job!",
            tokenData:pendingLibraryTokenData,
            tokenPath:libraryTokenPathInput.value.trim(),
            completionData:pendingLibraryCompletionData,
            completionPath:libraryCompletionPathInput.value.trim(),
            audioData:pendingLibraryAudioData,
            audioPath:libraryAudioPathInput.value.trim()
        })
    };
}

function normalizeStaff(staff){
    return {
        id:staff.id||("staff-"+Date.now()),
        name:(staff.name||"Staff").slice(0,80),
        role:["teacher","paraprofessional","related-service","substitute","other"].includes(staff.role)
            ? staff.role
            : "other",
        active:staff.active!==false
    };
}

function saveClassroomProfile(){
    localStorage.setItem(
        CLASSROOM_STORAGE_KEY,
        JSON.stringify(appState.classroom)
    );
}

function saveStaffDirectory(){
    localStorage.setItem(
        STAFF_STORAGE_KEY,
        JSON.stringify(appState.staff)
    );
}

function saveSelectedAdministrator(){
    localStorage.setItem(
        SELECTED_ADMIN_STORAGE_KEY,
        appState.selectedAdministratorId||""
    );
}

function loadClassroomProfile(){
    try{
        const raw=localStorage.getItem(CLASSROOM_STORAGE_KEY);
        if(raw){
            const parsed=JSON.parse(raw);
            appState.classroom={
                name:(parsed.name||"My Classroom").slice(0,80),
                leadTeacher:(parsed.leadTeacher||"").slice(0,80)
            };
        }
    }catch(error){
        console.error(error);
    }

    try{
        const raw=localStorage.getItem(STAFF_STORAGE_KEY);
        if(raw){
            const parsed=JSON.parse(raw);
            appState.staff=Array.isArray(parsed)
                ? parsed.map(normalizeStaff)
                : [];
        }
    }catch(error){
        console.error(error);
        appState.staff=[];
    }

    if(!appState.staff.length){
        appState.staff=[
            normalizeStaff({
                id:"lead-teacher",
                name:appState.classroom.leadTeacher||"Teacher",
                role:"teacher",
                active:true
            })
        ];
    }

    const selected=localStorage.getItem(SELECTED_ADMIN_STORAGE_KEY);
    appState.selectedAdministratorId=appState.staff.some(function(staff){
        return staff.id===selected && staff.active;
    })
        ? selected
        : (appState.staff.find(function(staff){return staff.active})?.id||"");

    saveClassroomProfile();
    saveStaffDirectory();
}

function renderClassroom(){
    classroomNameInput.value=appState.classroom.name||"";
    classroomTeacherNameInput.value=appState.classroom.leadTeacher||"";
}

function renderStaffList(){
    staffList.innerHTML="";

    appState.staff.forEach(function(staff){
        const card=document.createElement("div");
        card.className="staffCard"+(staff.active?"":" inactive");

        const main=document.createElement("div");
        main.className="staffCardMain";

        const name=document.createElement("strong");
        name.textContent=staff.name;

        const role=document.createElement("span");
        role.textContent=
            staff.role.split("-").join(" ")+
            (staff.active?"":" · inactive");

        main.appendChild(name);
        main.appendChild(role);

        const edit=document.createElement("button");
        edit.type="button";
        edit.className="smallButton";
        edit.textContent="Edit";
        edit.onclick=function(){
            openStaffEditor(staff.id);
        };

        card.appendChild(main);
        card.appendChild(edit);
        staffList.appendChild(card);
    });
}

function openStaffEditor(id=""){
    const staff=appState.staff.find(function(item){
        return item.id===id;
    });

    staffEditor.classList.remove("hidden");
    staffIdInput.value=staff?.id||"";
    staffNameInput.value=staff?.name||"";
    staffRoleInput.value=staff?.role||"paraprofessional";
    staffActiveInput.checked=staff?.active!==false;
    staffMessage.textContent="";
    staffNameInput.focus();
}

function closeStaffEditor(){
    staffEditor.classList.add("hidden");
    staffIdInput.value="";
    staffNameInput.value="";
    staffMessage.textContent="";
}

function saveStaffMember(){
    const name=staffNameInput.value.trim();

    if(!name){
        staffMessage.textContent="Please enter a staff name or initials.";
        return;
    }

    const id=staffIdInput.value||("staff-"+Date.now());
    const record=normalizeStaff({
        id:id,
        name:name,
        role:staffRoleInput.value,
        active:staffActiveInput.checked
    });

    const index=appState.staff.findIndex(function(item){
        return item.id===id;
    });

    if(index>=0){
        appState.staff[index]=record;
    }else{
        appState.staff.push(record);
    }

    if(!appState.staff.some(function(item){
        return item.id===appState.selectedAdministratorId && item.active;
    })){
        appState.selectedAdministratorId=
            appState.staff.find(function(item){return item.active})?.id||"";
    }

    saveStaffDirectory();
    saveSelectedAdministrator();
    updateAdministratorSelects();
    renderStaffList();
    closeStaffEditor();
}

function updateAdministratorSelects(){
    const active=appState.staff.filter(function(staff){
        return staff.active;
    });

    function fill(select,includeAll){
        if(!select){return}

        const previous=select.value;
        select.innerHTML="";

        if(includeAll){
            const all=document.createElement("option");
            all.value="all";
            all.textContent="All Administrators";
            select.appendChild(all);
        }

        active.forEach(function(staff){
            const option=document.createElement("option");
            option.value=staff.id;
            option.textContent=
                staff.name+" · "+staff.role.split("-").join(" ");
            select.appendChild(option);
        });

        if(includeAll){
            select.value=[...select.options].some(function(option){
                return option.value===previous;
            }) ? previous : "all";
        }else{
            const preferred=active.some(function(staff){
                return staff.id===appState.selectedAdministratorId;
            }) ? appState.selectedAdministratorId : (active[0]?.id||"");

            select.value=[...select.options].some(function(option){
                return option.value===previous;
            }) ? previous : preferred;
        }
    }

    fill(sessionAdministratorSelect,false);
    fill(reportAdministratorFilter,true);
}

function getSelectedAdministrator(){
    const id=sessionAdministratorSelect?.value||
        appState.selectedAdministratorId;

    return appState.staff.find(function(staff){
        return staff.id===id;
    })||null;
}

function normalizeStudent(s){return{id:s.id,name:s.name,totalTrials:Number(s.totalTrials)||10,promptStyle:["baseline","prompt-fading-token"].includes(s.promptStyle)?s.promptStyle:"least-to-most",startingPromptLevel:["visual-audio","visual","audio","sd","independent"].includes(s.startingPromptLevel)?s.startingPromptLevel:"visual-audio",tokenGoal:Math.max(1,Math.min(20,Number(s.tokenGoal)||5)),maximumTokenTrials:Math.max(1,Math.min(50,Number(s.maximumTokenTrials)||10)),reinforcementPackage:(
    ["stars","rockets","dinosaurs","rainbow","trains","music","custom","none"].includes(s.reinforcementPackage) ||
    String(s.reinforcementPackage||"").startsWith("library:")
) ? s.reinforcementPackage : "stars",tokenAnimationData:s.tokenAnimationData||"",tokenAnimationFileName:s.tokenAnimationFileName||"",completionAnimationData:s.completionAnimationData||"",completionAnimationFileName:s.completionAnimationFileName||"",completionAudioData:s.completionAudioData||"",completionAudioFileName:s.completionAudioFileName||"",differentialReinforcement:["all-correct","independent-only","independent-bonus"].includes(s.differentialReinforcement)?s.differentialReinforcement:"all-correct",tokenAnimationPath:s.tokenAnimationPath||"",completionAnimationPath:s.completionAnimationPath||"",completionAudioPath:s.completionAudioPath||"",waitTimeSeconds:Number(s.waitTimeSeconds)||10,promptStepTimeSeconds:Number(s.promptStepTimeSeconds)||5,audioSdEnabled:s.audioSdEnabled!==false,activityLevel:["list-affordability","cart-builder"].includes(s.activityLevel)?s.activityLevel:"single-item",cartTargetCount:Math.max(2,Math.min(4,Number(s.cartTargetCount)||2)),cartOptionCount:Math.max(4,Math.min(5,Number(s.cartOptionCount)||4)),listItemCount:Math.max(2,Math.min(5,Number(s.listItemCount)||2)),budgetMode:s.budgetMode==="fixed"?"fixed":"range",minimumBudget:Number(s.minimumBudget)||2,maximumBudget:Number(s.maximumBudget)||10,useWholeDollarBudgets:s.useWholeDollarBudgets!==false,reinforcementType:s.reinforcementType||"text",praiseText:(s.praiseText||"Nice job!").slice(0,80),feedbackDurationSeconds:Number(s.feedbackDurationSeconds)||2,responseDelaySeconds:Number.isFinite(Number(s.responseDelaySeconds))?Math.max(0,Math.min(10,Number(s.responseDelaySeconds))):2,
errorCorrection:{
 modelCorrectResponse:s.errorCorrection?.modelCorrectResponse!==false,
 requireCorrectionResponse:s.errorCorrection?.requireCorrectionResponse!==false,
 withholdToken:s.errorCorrection?.withholdToken!==false,
 continueSession:s.errorCorrection?.continueSession!==false
},
dataCollection:{
 accuracy:s.dataCollection?.accuracy!==false,
 latency:s.dataCollection?.latency!==false,
 promptLevel:s.dataCollection?.promptLevel!==false,
 independent:s.dataCollection?.independent!==false,
 tokens:s.dataCollection?.tokens!==false,
 corrections:s.dataCollection?.corrections!==false,
 cartAttempts:s.dataCollection?.cartAttempts!==false,
 responseDistribution:s.dataCollection?.responseDistribution!==false
}}}
function loadStudents(){
    const raw=localStorage.getItem(STUDENT_STORAGE_KEY);

    if(raw){
        try{
            const parsed=JSON.parse(raw);
            appState.students=Array.isArray(parsed)
                ? parsed.map(normalizeStudent)
                : [];
        }catch(error){
            console.error(error);
            appState.students=[];
        }
    }

    starterStudents.forEach(function(starter){
        if(!appState.students.some(function(student){return student.id===starter.id})){
            appState.students.push(normalizeStudent(starter));
        }
    });

    saveStudents();

    const stored=localStorage.getItem(SELECTED_STUDENT_STORAGE_KEY);
    appState.selectedStudentId=appState.students.some(function(student){
        return student.id===stored;
    }) ? stored : (appState.students[0]?.id||"");
}
function saveStudents(){try{localStorage.setItem(STUDENT_STORAGE_KEY,JSON.stringify(appState.students))}catch(error){console.error(error);alert("The student program could not be saved because browser storage is full. Try a smaller media file or use a project path instead.");throw error}}
function saveSelectedStudentId(){localStorage.setItem(SELECTED_STUDENT_STORAGE_KEY,appState.selectedStudentId)}
function loadSessions(){const raw=localStorage.getItem(SESSION_STORAGE_KEY);if(!raw){appState.sessions=[];return}try{appState.sessions=JSON.parse(raw)}catch(e){console.error(e);appState.sessions=[]}}
function saveSessions(){localStorage.setItem(SESSION_STORAGE_KEY,JSON.stringify(appState.sessions))}
function getSelectedStudent(){return appState.students.find(s=>s.id===appState.selectedStudentId)||null}
function updateHomeStudentSelect(){homeStudentSelect.innerHTML="";appState.students.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;o.selected=s.id===appState.selectedStudentId;homeStudentSelect.appendChild(o)});startButton.disabled=appState.students.length===0}
function renderStudentList(){
    studentList.innerHTML="";
    if(!appState.students.length){studentList.textContent="No student programs have been added.";return}
    const procedureLabels={baseline:"Baseline","least-to-most":"Least-to-Most","prompt-fading-token":"Prompt Fading + Tokens"};
    const levelLabels={"single-item":"Level 1 · One Item","list-affordability":"Level 2 · Grocery List","cart-builder":"Level 3 · Choose Items"};
    appState.students.forEach(function(student){
        const button=document.createElement("button");
        button.type="button";
        button.className="studentListButton"+(student.id===appState.selectedStudentId?" selected":"");
        const name=document.createElement("span");name.className="studentCardName";name.textContent="👤 "+student.name;
        const meta=document.createElement("span");meta.className="studentCardMeta";meta.textContent=levelLabels[student.activityLevel]||"Level 1 · One Item";
        const procedure=document.createElement("span");procedure.className="studentCardProcedure";procedure.textContent=procedureLabels[student.promptStyle]||"Least-to-Most";
        button.appendChild(name);button.appendChild(meta);button.appendChild(procedure);
        button.onclick=function(){selectStudentForEditing(student.id)};
        studentList.appendChild(button);
    });
}

function selectStudentForEditing(id){const s=appState.students.find(x=>x.id===id);if(!s)return;appState.selectedStudentId=s.id;saveSelectedStudentId();studentIdInput.value=s.id;studentNameInput.value=s.name;sessionLengthSelect.value=String(s.totalTrials);promptStyleSelect.value=s.promptStyle;startingPromptLevelInput.value=s.startingPromptLevel||"visual-audio";tokenGoalInput.value=String(s.tokenGoal||5);maximumTokenTrialsInput.value=String(s.maximumTokenTrials||10);updateReinforcementPackageOptions(s.reinforcementPackage||"stars");reinforcementPackageInput.value=s.reinforcementPackage||"stars";differentialReinforcementInput.value=s.differentialReinforcement||"all-correct";tokenAnimationPathInput.value=s.tokenAnimationPath||"";completionAnimationPathInput.value=s.completionAnimationPath||"";completionAudioPathInput.value=s.completionAudioPath||"";loadPendingUploadsFromStudent(s);updatePromptStyleDisplay();updateReinforcementPackageDisplay();waitTimeInput.value=String(s.waitTimeSeconds);promptStepTimeInput.value=String(s.promptStepTimeSeconds);audioSdEnabledInput.checked=s.audioSdEnabled!==false;activityLevelInput.value=s.activityLevel||"single-item";listItemCountInput.value=String(s.listItemCount||2);cartTargetCountInput.value=String(s.cartTargetCount||2);cartOptionCountInput.value=String(s.cartOptionCount||4);updateActivityLevelDisplay();budgetModeInput.value=s.budgetMode||"range";minimumBudgetInput.value=Number(s.minimumBudget||2).toFixed(2);maximumBudgetInput.value=Number(s.maximumBudget||10).toFixed(2);useWholeDollarBudgetsInput.checked=s.useWholeDollarBudgets!==false;updateBudgetModeDisplay();reinforcementTypeInput.value=s.reinforcementType||"text";praiseTextInput.value=s.praiseText||"Nice job!";feedbackDurationInput.value=String(s.feedbackDurationSeconds||2);responseDelaySecondsInput.value=String(Number.isFinite(Number(s.responseDelaySeconds))?s.responseDelaySeconds:2);
errorModelCorrectResponseInput.checked=s.errorCorrection?.modelCorrectResponse!==false;
errorRequireCorrectionResponseInput.checked=s.errorCorrection?.requireCorrectionResponse!==false;
errorWithholdTokenInput.checked=s.errorCorrection?.withholdToken!==false;
errorContinueSessionInput.checked=s.errorCorrection?.continueSession!==false;
dataAccuracyInput.checked=s.dataCollection?.accuracy!==false;
dataLatencyInput.checked=s.dataCollection?.latency!==false;
dataPromptLevelInput.checked=s.dataCollection?.promptLevel!==false;
dataIndependentInput.checked=s.dataCollection?.independent!==false;
dataTokensInput.checked=s.dataCollection?.tokens!==false;
dataCorrectionsInput.checked=s.dataCollection?.corrections!==false;
dataCartAttemptsInput.checked=s.dataCollection?.cartAttempts!==false;
dataResponseDistributionInput.checked=s.dataCollection?.responseDistribution!==false;profileFormTitle.textContent="Edit "+s.name;deleteStudentButton.disabled=false;settingsMessage.textContent="";updateHomeStudentSelect();renderStudentList()}
function beginNewStudent(){studentIdInput.value="";studentNameInput.value="";sessionLengthSelect.value="10";promptStyleSelect.value="least-to-most";startingPromptLevelInput.value="visual-audio";tokenGoalInput.value="5";maximumTokenTrialsInput.value="10";updateReinforcementPackageOptions("stars");reinforcementPackageInput.value="stars";differentialReinforcementInput.value="all-correct";tokenAnimationPathInput.value="";completionAnimationPathInput.value="";completionAudioPathInput.value="";clearPendingUploads();updatePromptStyleDisplay();updateReinforcementPackageDisplay();waitTimeInput.value="10";promptStepTimeInput.value="5";audioSdEnabledInput.checked=true;activityLevelInput.value="single-item";listItemCountInput.value="2";cartTargetCountInput.value="2";cartOptionCountInput.value="4";updateActivityLevelDisplay();budgetModeInput.value="range";minimumBudgetInput.value="2.00";maximumBudgetInput.value="10.00";useWholeDollarBudgetsInput.checked=true;updateBudgetModeDisplay();reinforcementTypeInput.value="text";praiseTextInput.value="Nice job!";feedbackDurationInput.value="2";responseDelaySecondsInput.value="2";
errorModelCorrectResponseInput.checked=true;
errorRequireCorrectionResponseInput.checked=true;
errorWithholdTokenInput.checked=true;
errorContinueSessionInput.checked=true;
dataAccuracyInput.checked=true;
dataLatencyInput.checked=true;
dataPromptLevelInput.checked=true;
dataIndependentInput.checked=true;
dataTokensInput.checked=true;
dataCorrectionsInput.checked=true;
dataCartAttemptsInput.checked=true;
dataResponseDistributionInput.checked=true;profileFormTitle.textContent="Add Student";deleteStudentButton.disabled=true;settingsMessage.textContent="";studentNameInput.focus()}
function createStudentId(name){const safe=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");return(safe||"student")+"-"+Date.now()}
function saveStudentProfile(){const name=studentNameInput.value.trim();if(!name){settingsMessage.textContent="Please enter a student name.";studentNameInput.focus();return}const id=studentIdInput.value;const p=normalizeStudent({id:id||createStudentId(name),name,totalTrials:Number(sessionLengthSelect.value),promptStyle:promptStyleSelect.value,startingPromptLevel:startingPromptLevelInput.value,tokenGoal:Number(tokenGoalInput.value)||5,maximumTokenTrials:Number(maximumTokenTrialsInput.value)||10,reinforcementPackage:reinforcementPackageInput.value,tokenAnimationData:pendingTokenAnimationData,tokenAnimationFileName:pendingTokenAnimationFileName,completionAnimationData:pendingCompletionAnimationData,completionAnimationFileName:pendingCompletionAnimationFileName,completionAudioData:pendingCompletionAudioData,completionAudioFileName:pendingCompletionAudioFileName,differentialReinforcement:differentialReinforcementInput.value,tokenAnimationData:pendingTokenAnimationData,tokenAnimationPath:tokenAnimationPathInput.value.trim(),completionAnimationPath:completionAnimationPathInput.value.trim(),completionAudioPath:completionAudioPathInput.value.trim(),waitTimeSeconds:Number(waitTimeInput.value)||10,promptStepTimeSeconds:Number(promptStepTimeInput.value)||5,audioSdEnabled:audioSdEnabledInput.checked,activityLevel:activityLevelInput.value,listItemCount:Number(listItemCountInput.value)||2,cartTargetCount:Number(cartTargetCountInput.value)||2,cartOptionCount:Number(cartOptionCountInput.value)||4,budgetMode:budgetModeInput.value,minimumBudget:Number(minimumBudgetInput.value)||2,maximumBudget:Number(maximumBudgetInput.value)||10,useWholeDollarBudgets:useWholeDollarBudgetsInput.checked,reinforcementType:reinforcementTypeInput.value,praiseText:(praiseTextInput.value.trim()||"Nice job!").slice(0,80),feedbackDurationSeconds:Number(feedbackDurationInput.value)||2,responseDelaySeconds:Math.max(0,Math.min(10,Number(responseDelaySecondsInput.value)||0)),
errorCorrection:{
 modelCorrectResponse:errorModelCorrectResponseInput.checked,
 requireCorrectionResponse:errorRequireCorrectionResponseInput.checked,
 withholdToken:errorWithholdTokenInput.checked,
 continueSession:errorContinueSessionInput.checked
},
dataCollection:{
 accuracy:dataAccuracyInput.checked,
 latency:dataLatencyInput.checked,
 promptLevel:dataPromptLevelInput.checked,
 independent:dataIndependentInput.checked,
 tokens:dataTokensInput.checked,
 corrections:dataCorrectionsInput.checked,
 cartAttempts:dataCartAttemptsInput.checked,
 responseDistribution:dataResponseDistributionInput.checked
}});const i=appState.students.findIndex(s=>s.id===id);if(i>=0)appState.students[i]=p;else appState.students.push(p);appState.selectedStudentId=p.id;saveStudents();saveSelectedStudentId();updateHomeStudentSelect();renderStudentList();selectStudentForEditing(p.id);updateReportStudentFilter();updateAdministratorSelects();settingsMessage.textContent=p.name+"'s profile was saved."}
function deleteSelectedStudent(){const id=studentIdInput.value;if(!id)return;const s=appState.students.find(x=>x.id===id);if(!s||!confirm("Delete "+s.name+"'s profile?"))return;appState.students=appState.students.filter(x=>x.id!==id);appState.selectedStudentId=appState.students[0]?.id||"";saveStudents();saveSelectedStudentId();updateHomeStudentSelect();renderStudentList();updateReportStudentFilter();appState.selectedStudentId?selectStudentForEditing(appState.selectedStudentId):beginNewStudent()}

function openStudentWelcome(){const s=getSelectedStudent();if(!s)return;updateAdministratorSelects();appState.currentStudent=s;welcomeStudentName.textContent="Welcome, "+s.name+"!";if(s.activityLevel==="cart-builder"){
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


function updatePromptStyleDisplay(){
    if(!promptStyleSelect){return}
    const showToken=promptStyleSelect.value==="prompt-fading-token";
    if(tokenPromptSettings){tokenPromptSettings.classList.toggle("hidden",!showToken)}
    if(tokenReinforcementSettings){tokenReinforcementSettings.classList.toggle("hidden",!showToken)}
}

function isTokenTeachingSession(){
    return appState.currentStudent &&
        appState.currentStudent.promptStyle==="prompt-fading-token";
}

function renderTokenBoard(){
    if(!isTokenTeachingSession()){
        tokenBoard.classList.add("hidden");
        return;
    }
    tokenBoard.classList.remove("hidden");
    const goal=Number(appState.currentStudent.tokenGoal)||5;
    tokenCountLabel.textContent=appState.tokensEarned+" of "+goal+" earned";
    tokenSlots.innerHTML="";
    for(let i=0;i<goal;i+=1){
        const slot=document.createElement("span");
        slot.className="tokenSlot"+(i<appState.tokensEarned?" earned":"");
        slot.textContent=i<appState.tokensEarned?"★":"";
        tokenSlots.appendChild(slot);
    }
}

function setResponsesLocked(locked){
    yesNoAnswerButtons.classList.toggle("answerButtonsLocked",locked);
    yesButton.disabled=locked;
    noButton.disabled=locked;
    if(checkCartButton && isCartBuilderLevel()){
        checkCartButton.disabled=locked || appState.selectedCartIndexes.length!==(Number(appState.currentStudent.cartTargetCount)||2);
    }
    if(!locked){appState.buttonActivatedAt=performance.now()}
}

function waitForSpeechToFinish(callback){
    if(!("speechSynthesis" in window) || !window.speechSynthesis.speaking){
        window.setTimeout(callback,250);return;
    }
    const started=Date.now();
    const poll=window.setInterval(function(){
        if(!window.speechSynthesis.speaking || Date.now()-started>8000){
            window.clearInterval(poll);callback();
        }
    },100);
}


const REINFORCEMENT_PACKAGES={
    stars:{token:"★",completion:["✨","⭐","✨"],tokenText:"Star earned!",praise:"Super work!",tones:[659.25,783.99]},
    rockets:{token:"🚀",completion:["✨","🚀","✨"],tokenText:"Rocket earned!",praise:"Blast off!",tones:[523.25,783.99]},
    dinosaurs:{token:"🦕",completion:["🌿","🦖","🌿"],tokenText:"Dino token earned!",praise:"Dino-mite work!",tones:[392,523.25]},
    rainbow:{token:"🌈",completion:["✨","🌈","✨"],tokenText:"Rainbow earned!",praise:"Wonderful work!",tones:[587.33,880]},
    trains:{token:"🚂",completion:["🚦","🚂","🚦"],tokenText:"Train token earned!",praise:"All aboard!",tones:[440,659.25]},
    music:{token:"🎵",completion:["🎶","🎉","🎶"],tokenText:"Music token earned!",praise:"Great rhythm!",tones:[523.25,659.25,783.99]}
};

function getReinforcementPackage(profile=appState.currentStudent){
    const key=profile?.reinforcementPackage||"stars";

    if(String(key).startsWith("library:")){
        const libraryItem=
            profile?.libraryPreviewPackage ||
            getLibraryPackageByValue(key);

        if(libraryItem){
            return {
                token:"⭐",
                completion:["✨","🎉","✨"],
                tokenText:libraryItem.name+" token earned!",
                praise:libraryItem.praiseText||"Nice job!",
                tones:[659.25,783.99],
                libraryItem:libraryItem
            };
        }
    }

    return REINFORCEMENT_PACKAGES[key]||REINFORCEMENT_PACKAGES.stars;
}

function updateReinforcementPackageDisplay(){
    if(!reinforcementPackageInput || !customReinforcementSettings){
        return;
    }

    customReinforcementSettings.classList.toggle(
        "hidden",
        reinforcementPackageInput.value!=="custom"
    );
}

function playPackageSound(completion=false){
    const profile=appState.currentStudent||getSelectedStudent();
    const pack=getReinforcementPackage(profile);
    const tones=completion
        ? [...pack.tones,pack.tones[pack.tones.length-1]*1.25]
        : pack.tones;

    try{
        const AudioContextClass=window.AudioContext||window.webkitAudioContext;
        if(!AudioContextClass){return}

        const context=new AudioContextClass();

        tones.forEach(function(frequency,index){
            const oscillator=context.createOscillator();
            const gain=context.createGain();
            const start=context.currentTime+index*0.11;

            oscillator.type="sine";
            oscillator.frequency.setValueAtTime(frequency,start);
            gain.gain.setValueAtTime(0.0001,start);
            gain.gain.exponentialRampToValueAtTime(0.16,start+0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001,start+0.18);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(start);
            oscillator.stop(start+0.2);
        });
    }catch(error){
        console.warn("Package sound could not play:",error);
    }
}

function shouldEarnToken(ok,promptLevel){
    if(!ok){return false}

    const mode=appState.currentStudent?.differentialReinforcement||"all-correct";

    if(mode==="independent-only"){
        return promptLevel==="independent";
    }

    return true;
}

function showTokenCelebration(options={}){
    const profile=appState.currentStudent||getSelectedStudent();
    const packageKey=profile?.reinforcementPackage||"stars";
    const pack=getReinforcementPackage(profile);
    const path=String(packageKey).startsWith("library:")
        ? (pack.libraryItem?.tokenData||pack.libraryItem?.tokenPath||"")
        : packageKey==="custom"
            ? (profile?.tokenAnimationData||profile?.tokenAnimationPath||"")
            : "";
    const card=tokenCelebrationOverlay.querySelector(".tokenCelebrationCard");

    tokenCelebrationOverlay.className=
        "tokenCelebrationOverlay tokenTheme-"+(String(packageKey).startsWith("library:")?"library":packageKey);

    tokenCelebrationText.textContent=
        options.preview
            ? "Token preview"
            : (pack.tokenText||"Token earned!");

    card.classList.toggle(
        "independentBonus",
        Boolean(options.independentBonus)
    );

    if(path){
        tokenCelebrationImage.src=path.startsWith("data:")?path:path+"?t="+Date.now();
        tokenCelebrationImage.classList.remove("hidden");
        builtInTokenAnimation.classList.add("hidden");
    }else{
        tokenCelebrationImage.classList.add("hidden");
        builtInTokenAnimation.classList.remove("hidden");
        tokenThemeIcon.textContent=pack.token;
    }

    tokenCelebrationOverlay.classList.remove("hidden");

    if(profile?.reinforcementType==="text-sound"){
        playPackageSound(false);
    }

    window.setTimeout(function(){
        tokenCelebrationOverlay.classList.add("hidden");
        card.classList.remove("independentBonus");
    },Math.min(2200,getFeedbackDelayMilliseconds()));
}

function playCompletionMedia(options={}){
    const profile=appState.currentStudent||getSelectedStudent();
    const packageKey=profile?.reinforcementPackage||"stars";
    const pack=getReinforcementPackage(profile);
    const imagePath=String(packageKey).startsWith("library:")
        ? (pack.libraryItem?.completionData||pack.libraryItem?.completionPath||"")
        : packageKey==="custom"
            ? (profile?.completionAnimationData||profile?.completionAnimationPath||"")
            : "";
    const audioPath=String(packageKey).startsWith("library:")
        ? (pack.libraryItem?.audioData||pack.libraryItem?.audioPath||"")
        : packageKey==="custom"
            ? (profile?.completionAudioData||profile?.completionAudioPath||"")
            : "";

    completionIconLeft.textContent=pack.completion[0];
    completionIconMain.textContent=pack.completion[1];
    completionIconRight.textContent=pack.completion[2];

    if(imagePath){
        const img=document.createElement("img");
        img.src=imagePath.startsWith("data:")?imagePath:imagePath+"?t="+Date.now();
        img.alt="Completion celebration";
        img.className="completionMediaImage";
        const card=completeScreen.querySelector(".completeCard");
        const old=card.querySelector(".completionMediaImage");
        if(old)old.remove();
        card.insertBefore(img,card.children[2]||null);
    }

    if(audioPath){
        try{
            const audio=new Audio(audioPath);
            audio.volume=.7;
            audio.play().catch(()=>{});
        }catch(error){
            console.warn(error);
        }
    }else if(profile?.reinforcementType==="text-sound" || options.preview){
        playPackageSound(true);
    }
}

function clearPromptTimers(){appState.promptTimeouts.forEach(clearTimeout);appState.promptTimeouts=[];clearResponseUnlockTimer()}
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


function buildComparisonPrompt(){
    let label="Price";
    let value=Number(appState.currentItem?.price)||0;

    if(isCartBuilderLevel()){
        label="Cart Total";
        value=getCartTotal();
    }else if(isListAffordabilityLevel()){
        label="Total Cost";
        value=Number(appState.currentListTotal)||0;
    }

    return '<div class="comparisonValue">'+
        '<span>'+label+'</span>'+
        '<strong>'+formatCurrency(value)+'</strong>'+
        '</div>'+
        '<div class="comparisonArrow">↔</div>'+
        '<div class="comparisonValue">'+
        '<span>Your Budget</span>'+
        '<strong>'+formatCurrency(appState.currentBudget)+'</strong>'+
        '</div>';
}

function getCorrectAnswer(){
    const cost=isCartBuilderLevel()
        ? getCartTotal()
        : isListAffordabilityLevel()
            ? Number(appState.currentListTotal)
            : Number(appState.currentItem?.price);

    return Number(appState.currentBudget)>=Number(cost)
        ? "yes"
        : "no";
}
function getCorrectButton(){return getCorrectAnswer()==="yes"?yesButton:noButton}
function schedulePrompts(){
    clearPromptTimers();
    resetPromptDisplay();
    appState.currentPromptLevel="independent";
    appState.firstPromptAt=null;

    if(appState.currentStudent.promptStyle==="baseline"){
        teacherPromptStatus.textContent="Baseline — no prompts";
        return;
    }

    if(isTokenTeachingSession()){
        runTokenStartingPrompt();
        return;
    }

    const first=appState.currentStudent.waitTimeSeconds*1000;
    const step=appState.currentStudent.promptStepTimeSeconds*1000;
    appState.promptTimeouts.push(setTimeout(()=>deliverPrompt("visual"),first));
    appState.promptTimeouts.push(setTimeout(()=>deliverPrompt("audio"),first+step));
    appState.promptTimeouts.push(setTimeout(()=>deliverPrompt("gesture"),first+step*2));
}

function runTokenStartingPrompt(){
    const level=appState.currentStudent.startingPromptLevel||"visual-audio";
    appState.currentPromptLevel=level;
    teacherPromptStatus.textContent="Programmed prompt: "+level.split("-").join(" + ");

    if(level==="visual-audio"){
        promptArea.className="promptArea promptVisual comparisonBand";
        promptMessage.innerHTML=buildComparisonPrompt();
        groceryScreen.classList.add("promptCompare");
        speakSecondaryPrompt();
    }else if(level==="visual"){
        promptArea.className="promptArea promptVisual comparisonBand";
        promptMessage.innerHTML=buildComparisonPrompt();
        groceryScreen.classList.add("promptCompare");
    }else if(level==="audio"){
        speakSecondaryPrompt();
    }else if(level==="sd"){
        speakInstructionalCue();
    }
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

    const praise=profile.praiseText||getReinforcementPackage(profile).praise||"Nice job!";

    showFeedback(praise,true);
    feedbackArea.classList.add("reinforcementText");

    if(type==="text-sound"){
        playPackageSound(false);
    }

    return true;
}


function clearResponseUnlockTimer(){
    if(appState.responseUnlockTimeout!==null){
        window.clearTimeout(appState.responseUnlockTimeout);
        appState.responseUnlockTimeout=null;
    }
}

function lockResponseControls(){
    clearResponseUnlockTimer();

    appState.acceptingResponse=false;
    setResponsesLocked(true);
    disableAnswerButtons();

    groceryScreen.classList.add("responseLocked");
    groceryScreen.classList.remove("responseReady");

    if(responseDelayMessage){
        responseDelayMessage.classList.remove("hidden");
        responseDelayMessage.textContent="Please look carefully...";
    }
}

function unlockResponseControls(){
    appState.acceptingResponse=true;

    groceryScreen.classList.remove("responseLocked");
    groceryScreen.classList.add("responseReady");

    if(responseDelayMessage){
        responseDelayMessage.classList.add("hidden");
    }

    setResponsesLocked(false);
    enableAnswerButtons();
    appState.buttonActivatedAt=performance.now();
    appState.trialStartedAt=appState.buttonActivatedAt;
}


function getPromptAudioDelayMilliseconds(){
    if(!isTokenTeachingSession()){
        return 0;
    }

    const level=appState.currentStudent.startingPromptLevel||"visual-audio";

    if(level==="visual-audio" || level==="audio" || level==="sd"){
        return 3000;
    }

    return 0;
}

function beginUniversalResponseDelay(){
    lockResponseControls();

    const profileDelayMilliseconds=
        Math.max(
            0,
            Math.min(
                10,
                Number(appState.currentStudent?.responseDelaySeconds ?? 2)
            )
        )*1000;

    const delayMilliseconds=Math.max(
        profileDelayMilliseconds,
        getPromptAudioDelayMilliseconds()
    );

    if(delayMilliseconds===0){
        unlockResponseControls();
        return;
    }

    appState.responseUnlockTimeout=window.setTimeout(
        unlockResponseControls,
        delayMilliseconds
    );
}

async function startSession(){
    const administrator=getSelectedAdministrator();

    if(!administrator){
        alert("Please select who is running this session.");
        return;
    }

    appState.selectedAdministratorId=administrator.id;
    saveSelectedAdministrator();
appState.currentStudent=getSelectedStudent();if(!appState.currentStudent){alert("Please select a student first.");return;}disableAnswerButtons();try{if(!appState.items.length)await loadGroceryItems();appState.currentSessionId="session-"+Date.now();appState.sessionStartedAt=new Date().toISOString();appState.currentTrial=0;appState.tokensEarned=0;appState.responses=[];appState.shuffledItems=[];studentGreeting.textContent=appState.currentStudent.name+"'s Shopping Practice";showScreen(groceryScreen);renderTokenBoard();loadNextTrial()}catch(e){
        console.error("Session could not start:",e);
        alert("The session could not start. Please refresh and try again.");
    }}
function loadNextTrial(){
    clearPromptTimers();
    hideFeedback();
    resetPromptDisplay();

    const tokenGoalReached=isTokenTeachingSession() &&
        appState.tokensEarned>=(Number(appState.currentStudent.tokenGoal)||5);
    const maximumTrialsReached=isTokenTeachingSession()
        ? appState.currentTrial>=(Number(appState.currentStudent.maximumTokenTrials)||10)
        : appState.currentTrial>=appState.currentStudent.totalTrials;

    if(tokenGoalReached || maximumTrialsReached){
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
    appState.acceptingResponse=false;
    appState.awaitingModelCorrection=false;
    appState.firstResponseRecorded=false;

    updateTrialCounter();
    displayCurrentTrial();
    lockResponseControls();
    schedulePrompts();
    beginUniversalResponseDelay();

    if(
        appState.currentStudent.audioSdEnabled!==false &&
        !isTokenTeachingSession()
    ){
        window.setTimeout(speakInstructionalCue,150);
    }
}
function updateTrialCounter(){
    const total=isTokenTeachingSession()
        ? Number(appState.currentStudent.maximumTokenTrials)||10
        : appState.currentStudent.totalTrials;
    trialCounter.textContent="Trial "+appState.currentTrial+" of up to "+total;
    if(!isTokenTeachingSession())trialCounter.textContent="Trial "+appState.currentTrial+" of "+total;
    progressBar.style.width=(appState.currentTrial/total*100)+"%";
    renderTokenBoard();
}


function displayCurrentTrial(){
    budgetDisplay.textContent=formatCurrency(appState.currentBudget);

    if(isCartBuilderLevel()){
        singleItemCard.classList.add("hidden");
        groceryListCard.classList.add("hidden");
        cartBuilderCard.classList.remove("hidden");
        yesNoAnswerButtons.classList.add("hidden");
        checkCartButton.classList.remove("hidden");
        affordabilityQuestion.textContent="Choose items that fit in your budget.";
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
    itemImage.onerror=function(){
        itemImage.removeAttribute("src");
        itemImage.alt="Image unavailable for "+appState.currentItem.name;
    };
    itemImage.src="assets/images/grocery/"+appState.currentItem.image;
    itemImage.alt=appState.currentItem.name;
}

function recordTrial(answer,correct,ok,latency,postPromptLatency){
    appState.responses.push({
        trialNumber:appState.currentTrial,
        item:isListAffordabilityLevel()
            ? appState.currentListItems.map(function(item){return item.name}).join(" + ")
            : appState.currentItem.name,
        category:isListAffordabilityLevel()?"Grocery List":appState.currentItem.category,
        price:isListAffordabilityLevel()?Number(appState.currentListTotal):Number(appState.currentItem.price),
        listItems:isListAffordabilityLevel()
            ? appState.currentListItems.map(function(item){return {name:item.name,price:Number(item.price)}})
            : [],
        budget:Number(appState.currentBudget),
        studentAnswer:answer,
        correctAnswer:correct,
        correct:ok,
        tokenEarned:isTokenTeachingSession()&&ok,correctedResponse:false,
        latencySeconds:latency,
        postPromptLatencySeconds:postPromptLatency,
        promptLevel:appState.currentPromptLevel,
        independent:appState.currentPromptLevel==="independent",
        rapidResponse:latency<rapidResponseThresholdSeconds,
        timestamp:new Date().toISOString()
    });
}

function finishSession(){
    clearPromptTimers();
    appState.acceptingResponse=false;
    disableAnswerButtons();

    const trials=[...appState.responses];
    const latencies=trials.map(function(record){return record.latencySeconds});
    const correctCount=trials.filter(function(record){return record.correct}).length;
    const independentCount=trials.filter(function(record){return record.independent}).length;
    const highest=Math.max(0,...trials.map(function(record){return PROMPT_LEVELS[record.promptLevel]||0}));
    const highestName=Object.keys(PROMPT_LEVELS).find(function(level){return PROMPT_LEVELS[level]===highest})||"independent";
    const planned=isTokenTeachingSession()
        ? Number(appState.currentStudent.maximumTokenTrials)||10
        : appState.currentStudent.totalTrials;

    const sessionRecord={
        id:appState.currentSessionId,
        studentId:appState.currentStudent.id,
        studentName:appState.currentStudent.name,
        administratorId:appState.selectedAdministratorId,
        administratorName:(appState.staff.find(function(staff){return staff.id===appState.selectedAdministratorId})?.name||"Unknown"),
        administratorRole:(appState.staff.find(function(staff){return staff.id===appState.selectedAdministratorId})?.role||"other"),
        startedAt:appState.sessionStartedAt,
        completedAt:new Date().toISOString(),
        plannedTrials:planned,
        completedTrials:trials.length,
        correctCount:correctCount,
        incorrectCount:trials.length-correctCount,
        accuracyPercent:trials.length?Number((correctCount/trials.length*100).toFixed(1)):0,
        independentCount:independentCount,
        independentPercent:trials.length?Number((independentCount/trials.length*100).toFixed(1)):0,
        averageLatencySeconds:Number(average(latencies).toFixed(2)),
        medianLatencySeconds:Number(median(latencies).toFixed(2)),
        highestPromptLevel:highestName,
        promptStyle:appState.currentStudent.promptStyle,
        tokenGoal:isTokenTeachingSession()?Number(appState.currentStudent.tokenGoal)||5:null,
        tokensEarned:isTokenTeachingSession()?appState.tokensEarned:null,
        tokenGoalMet:isTokenTeachingSession()?appState.tokensEarned>=(Number(appState.currentStudent.tokenGoal)||5):null,
        waitTimeSeconds:appState.currentStudent.waitTimeSeconds,
        promptStepTimeSeconds:appState.currentStudent.promptStepTimeSeconds,
        errorCorrection:{...appState.currentStudent.errorCorrection},
        dataCollection:{...appState.currentStudent.dataCollection},
        trials:trials
    };

    appState.sessions.unshift(sessionRecord);
    appState.selectedSessionId=sessionRecord.id;
    saveSessions();

    completionMessage.textContent=isTokenTeachingSession()
        ? "Shopping finished! You earned "+appState.tokensEarned+" token"+(appState.tokensEarned===1?".":"s.")
        : "Nice work, "+appState.currentStudent.name+"! You completed "+trials.length+" shopping trial"+(trials.length===1?".":"s.");

    showScreen(completeScreen);
    playCompletionMedia();
}

function showFeedback(message,isCorrect){
    promptArea.className="promptArea hidden";
    promptMessage.textContent="";
    feedbackArea.textContent=message;
    feedbackArea.classList.remove("hidden","feedbackCorrect","feedbackIncorrect");
    feedbackArea.classList.add(isCorrect?"feedbackCorrect":"feedbackIncorrect");
    trialContent.style.opacity="0.45";
}

function hideFeedback(){
    feedbackArea.textContent="";
    feedbackArea.classList.add("hidden");
    feedbackArea.classList.remove("feedbackCorrect","feedbackIncorrect","reinforcementText","modelCorrectionNotice");
    trialContent.style.opacity="1";
}

function disableAnswerButtons(){
    yesButton.disabled=true;
    noButton.disabled=true;
    if(checkCartButton){checkCartButton.disabled=true}
}

function enableAnswerButtons(){
    yesButton.disabled=false;
    noButton.disabled=false;
    if(checkCartButton){
        checkCartButton.disabled=isCartBuilderLevel()
            ? appState.selectedCartIndexes.length!==(Number(appState.currentStudent.cartTargetCount)||2)
            : false;
    }
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
        groceryScreen.classList.remove("responseLocked");
        if(responseDelayMessage){responseDelayMessage.classList.add("hidden")}
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


function finishAfterCorrection(){
    appState.awaitingModelCorrection=false;
    appState.acceptingResponse=false;
    disableAnswerButtons();
    hideFeedback();

    const settings=appState.currentStudent?.errorCorrection||{};

    if(settings.continueSession===false){
        window.setTimeout(finishSession,500);
    }else{
        window.setTimeout(loadNextTrial,700);
    }
}

function beginModelCorrection(){
    const settings=appState.currentStudent?.errorCorrection||{};

    appState.lastTrialCorrected=true;

    if(settings.modelCorrectResponse===false){
        feedbackArea.textContent="Let's try another one.";
        feedbackArea.className="feedbackArea feedbackIncorrect modelCorrectionNotice";

        if(settings.continueSession===false){
            window.setTimeout(finishSession,700);
        }else{
            window.setTimeout(loadNextTrial,700);
        }
        return;
    }

    appState.awaitingModelCorrection=true;
    resetPromptDisplay();
    appState.currentPromptLevel="gesture";
    promptArea.className="promptArea promptGesture";
    promptMessage.textContent="Now choose the highlighted answer.";
    feedbackArea.textContent=settings.withholdToken===false
        ? "Correct the response to earn the token."
        : "No token this time. Let's correct it together.";
    feedbackArea.className="feedbackArea feedbackIncorrect modelCorrectionNotice";
    groceryScreen.classList.add("promptGesture");
    getCorrectButton().classList.add("correctChoice");
    showGesturePrompt();

    if(settings.requireCorrectionResponse===false){
        appState.acceptingResponse=false;
        disableAnswerButtons();
        window.setTimeout(finishAfterCorrection,1100);
        return;
    }

    appState.acceptingResponse=true;
    setResponsesLocked(false);
}

function completeModeledCorrection(answer){
    if(answer!==getCorrectAnswer())return;

    const settings=appState.currentStudent?.errorCorrection||{};

    if(settings.withholdToken===false && isTokenTeachingSession()){
        appState.tokensEarned+=1;
        renderTokenBoard();
        showTokenCelebration();
    }

    finishAfterCorrection();
}

function handleAnswer(answer){
    if(isCartBuilderLevel() || !appState.acceptingResponse)return;
    if(appState.awaitingModelCorrection){completeModeledCorrection(answer);return}

    const now=performance.now();
    const start=appState.buttonActivatedAt||appState.trialStartedAt;
    const lat=Number(((now-start)/1000).toFixed(2));
    const post=appState.firstPromptAt===null?null:Number(((now-appState.firstPromptAt)/1000).toFixed(2));
    appState.acceptingResponse=false;
    clearPromptTimers();
    disableAnswerButtons();
    const correct=getCorrectAnswer();
    const ok=answer===correct;

    if(isTokenTeachingSession()){
        recordTrial(answer,correct,ok,lat,post);
        if(ok){
            const tokenEarned=shouldEarnToken(
                ok,
                appState.currentPromptLevel
            );

            if(appState.responses.length){
                appState.responses[
                    appState.responses.length-1
                ].tokenEarned=tokenEarned;
            }

            if(tokenEarned){
                appState.tokensEarned+=1;
                renderTokenBoard();
                showTokenCelebration({
                    independentBonus:
                        appState.currentStudent.differentialReinforcement==="independent-bonus" &&
                        appState.currentPromptLevel==="independent"
                });
                window.setTimeout(loadNextTrial,1600);
            }else{
                showFeedback(
                    "Correct response. Keep working toward your token.",
                    true
                );
                window.setTimeout(
                    loadNextTrial,
                    getFeedbackDelayMilliseconds()
                );
            }
        }else{
            if(appState.responses.length){
                appState.responses[appState.responses.length-1].correctedResponse=true;
            }
            window.setTimeout(beginModelCorrection,350);
        }
        return;
    }

    recordTrial(answer,correct,ok,lat,post);
    showFeedback(ok?"Nice job! You compared the price and your budget.":"Thanks for trying. Let's practice another one.",ok);
    setTimeout(loadNextTrial,nextTrialDelayMilliseconds);
}


function updateReportStudentFilter(){const cur=reportStudentFilter.value||"all";reportStudentFilter.innerHTML='<option value="all">All Students</option>';appState.students.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;reportStudentFilter.appendChild(o)});reportStudentFilter.value=[...reportStudentFilter.options].some(o=>o.value===cur)?cur:"all"}
function getFilteredSessions(){
    const studentId=reportStudentFilter.value;
    const administratorId=reportAdministratorFilter?.value||"all";

    return appState.sessions.filter(function(session){
        const studentMatch=
            !studentId ||
            studentId==="all" ||
            session.studentId===studentId;

        const administratorMatch=
            administratorId==="all" ||
            session.administratorId===administratorId;

        return studentMatch && administratorMatch;
    });
}

function renderReports(){updateReportStudentFilter();const sessions=getFilteredSessions();renderSummaryCards(sessions);renderSessionTable(sessions);const sel=appState.sessions.find(s=>s.id===appState.selectedSessionId)||sessions[0]||null;if(sel){appState.selectedSessionId=sel.id;renderTrialDetails(sel)}else{selectedSessionLabel.textContent="No saved sessions are available.";trialDetailBody.innerHTML=""}}
function renderSummaryCards(sessions){reportSummaryCards.innerHTML="";const trials=sessions.flatMap(s=>s.trials||[]),correct=trials.filter(t=>t.correct).length,ind=trials.filter(t=>t.independent).length,cards=[["Sessions",sessions.length],["Trials",trials.length],["Overall Accuracy",(trials.length?correct/trials.length*100:0).toFixed(1)+"%"],["Independent",(trials.length?ind/trials.length*100:0).toFixed(1)+"%"],["Average Latency",formatSeconds(average(trials.map(t=>t.latencySeconds)))]];cards.forEach(([l,v])=>{const d=document.createElement("div");d.className="summaryCard";d.innerHTML="<span>"+l+"</span><strong>"+v+"</strong>";reportSummaryCards.appendChild(d)})}
function renderSessionTable(sessions){sessionTableBody.innerHTML="";if(!sessions.length){sessionTableBody.innerHTML='<tr><td colspan="7">No sessions have been saved.</td></tr>';return}sessions.forEach(s=>{const r=document.createElement("tr");r.className="sessionRow"+(s.id===appState.selectedSessionId?" selected":"");[
 new Date(s.completedAt).toLocaleString(),
 s.studentName,
 s.completedTrials,
 displayMetric(s,"accuracy",s.accuracyPercent+"%"),
 displayMetric(s,"independent",(s.independentPercent??0)+"%"),
 displayMetric(s,"latency",formatSeconds(s.averageLatencySeconds)),
 displayMetric(s,"promptLevel",PROMPT_LABELS[s.highestPromptLevel||"independent"])
].forEach(v=>{const c=document.createElement("td");c.textContent=v;r.appendChild(c)});r.onclick=()=>{appState.selectedSessionId=s.id;renderReports()};sessionTableBody.appendChild(r)})}
function renderTrialDetails(s){selectedSessionLabel.textContent=s.studentName+" — "+new Date(s.completedAt).toLocaleString();trialDetailBody.innerHTML="";(s.trials||[]).forEach(t=>{const r=document.createElement("tr");[
 t.trialNumber,
 t.item,
 formatCurrency(t.price),
 formatCurrency(t.budget),
 t.studentAnswer.toUpperCase(),
 displayMetric(s,"accuracy",t.correct?"Yes":"No"),
 displayMetric(s,"latency",formatSeconds(t.latencySeconds)),
 displayMetric(s,"promptLevel",PROMPT_LABELS[t.promptLevel||"independent"]),
 displayMetric(s,"latency",formatSeconds(t.postPromptLatencySeconds))
].forEach(v=>{const c=document.createElement("td");c.textContent=v;r.appendChild(c)});trialDetailBody.appendChild(r)})}
function downloadTextFile(name,content,type){const b=new Blob([content],{type}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(u)}
function exportSessionsToCsv(){const sessions=getFilteredSessions();if(!sessions.length){alert("There are no sessions to export.");return}const rows=[["Session ID","Student","Session Completed","Trial","Item","Category","Price","Budget","Student Answer","Correct Answer","Correct","Total Latency Seconds","Prompt Level","Independent","Post-Prompt Latency Seconds"]];sessions.forEach(s=>(s.trials||[]).forEach(t=>rows.push([s.id,s.studentName,s.completedAt,t.trialNumber,t.item,t.category,Number(t.price).toFixed(2),Number(t.budget).toFixed(2),t.studentAnswer,t.correctAnswer,t.correct?"Yes":"No",Number(t.latencySeconds).toFixed(2),t.promptLevel||"independent",t.independent?"Yes":"No",t.postPromptLatencySeconds==null?"":Number(t.postPromptLatencySeconds).toFixed(2)])));downloadTextFile("budget-buddy-session-data.csv",rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\n"),"text/csv;charset=utf-8;")}
function clearSavedReports(){if(!confirm("Delete all saved session reports from this browser?"))return;appState.sessions=[];appState.selectedSessionId="";saveSessions();renderReports()}

function exportClassroomBackup(){
    const backup={
        app:"Budget Buddy",
        version:"0.16",
        exportedAt:new Date().toISOString(),
        classroom:appState.classroom,
        staff:appState.staff,
        reinforcementLibrary:appState.reinforcementLibrary,
        selectedAdministratorId:appState.selectedAdministratorId,
        selectedStudentId:appState.selectedStudentId,
        students:appState.students,
        sessions:appState.sessions
    };

    downloadTextFile(
        "budget-buddy-classroom-backup.json",
        JSON.stringify(backup,null,2),
        "application/json;charset=utf-8;"
    );

    dataMessage.textContent="Classroom backup exported.";
}

async function importClassroomBackup(event){
    const file=event.target.files[0];
    if(!file){return}

    try{
        const backup=JSON.parse(await file.text());

        if(
            !backup ||
            !Array.isArray(backup.students) ||
            !Array.isArray(backup.sessions)
        ){
            throw new Error("Invalid backup");
        }

        if(!confirm(
            "Importing will replace the classroom data currently saved on this device. Continue?"
        )){
            importClassroomInput.value="";
            return;
        }

        if(backup.classroom){
            appState.classroom={
                name:(backup.classroom.name||"My Classroom").slice(0,80),
                leadTeacher:(backup.classroom.leadTeacher||"").slice(0,80)
            };
        }

        appState.staff=Array.isArray(backup.staff)
            ? backup.staff.map(normalizeStaff)
            : appState.staff;

        appState.reinforcementLibrary=
            Array.isArray(backup.reinforcementLibrary)
                ? backup.reinforcementLibrary.map(normalizeLibraryPackage)
                : [];

        appState.students=backup.students.map(normalizeStudent);
        appState.sessions=backup.sessions;

        appState.selectedStudentId=appState.students.some(function(student){
            return student.id===backup.selectedStudentId;
        }) ? backup.selectedStudentId : (appState.students[0]?.id||"");

        appState.selectedAdministratorId=appState.staff.some(function(staff){
            return staff.id===backup.selectedAdministratorId && staff.active;
        }) ? backup.selectedAdministratorId : (
            appState.staff.find(function(staff){return staff.active})?.id||""
        );

        saveClassroomProfile();
        saveStaffDirectory();
        saveReinforcementLibrary();
        saveStudents();
        saveSessions();
        saveSelectedStudentId();
        saveSelectedAdministrator();

        updateHomeStudentSelect();
        updateReportStudentFilter();
        updateAdministratorSelects();
        updateReinforcementPackageOptions();
        renderStudentList();
        renderStaffList();
        renderReinforcementLibrary();

        dataMessage.textContent="Classroom backup imported successfully.";
    }catch(error){
        console.error(error);
        dataMessage.textContent="The selected file could not be imported.";
    }

    importClassroomInput.value="";
}




function updateSdPreview(){
    const preview=document.getElementById("sdPreviewText");
    if(!preview||!activityLevelInput){return}
    const text=activityLevelInput.value==="list-affordability"
        ? "“Can I afford everything on my grocery list?”"
        : activityLevelInput.value==="cart-builder"
            ? "“Choose items that fit in your budget.”"
            : "“Can I afford this item?”";
    preview.textContent=text;
}

function updateActivityLevelDisplay(){
    if(!activityLevelInput){return}
    updateSdPreview();

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


function previewTokenReinforcement(){
    const previous=appState.currentStudent;
    appState.currentStudent={
        ...(getSelectedStudent()||{}),
        reinforcementPackage:reinforcementPackageInput.value,
        reinforcementType:reinforcementTypeInput.value,
        tokenAnimationData:pendingTokenAnimationData,tokenAnimationPath:tokenAnimationPathInput.value.trim()
    };

    showTokenCelebration({preview:true,independentBonus:true});
    appState.currentStudent=previous;
}

function previewCompletionReinforcement(){
    const previous=appState.currentStudent;
    appState.currentStudent={
        ...(getSelectedStudent()||{}),
        reinforcementPackage:reinforcementPackageInput.value,
        reinforcementType:reinforcementTypeInput.value,
        completionAnimationData:pendingCompletionAnimationData,completionAnimationPath:completionAnimationPathInput.value.trim(),
        completionAudioData:pendingCompletionAudioData,completionAudioPath:completionAudioPathInput.value.trim()
    };

    playCompletionMedia({preview:true});
    appState.currentStudent=previous;
}


async function handleUpload(input,status,max,prefix,setData,setName){const file=input.files?.[0];try{const r=await readUploadedFile(file,max,prefix);setData(r.data);setName(r.name);setUploadStatus(status,r.name,r.data)}catch(e){input.value="";setUploadStatus(status,"","",e.message)}}
tokenAnimationUploadInput.addEventListener("change",()=>handleUpload(tokenAnimationUploadInput,tokenAnimationUploadStatus,MAX_IMAGE_UPLOAD_BYTES,"image/",v=>pendingTokenAnimationData=v,v=>pendingTokenAnimationFileName=v));
completionAnimationUploadInput.addEventListener("change",()=>handleUpload(completionAnimationUploadInput,completionAnimationUploadStatus,MAX_IMAGE_UPLOAD_BYTES,"image/",v=>pendingCompletionAnimationData=v,v=>pendingCompletionAnimationFileName=v));
completionAudioUploadInput.addEventListener("change",()=>handleUpload(completionAudioUploadInput,completionAudioUploadStatus,MAX_AUDIO_UPLOAD_BYTES,"audio/",v=>pendingCompletionAudioData=v,v=>pendingCompletionAudioFileName=v));
clearTokenAnimationUploadButton.addEventListener("click",()=>{pendingTokenAnimationData="";pendingTokenAnimationFileName="";tokenAnimationUploadInput.value="";setUploadStatus(tokenAnimationUploadStatus,"","")});
clearCompletionAnimationUploadButton.addEventListener("click",()=>{pendingCompletionAnimationData="";pendingCompletionAnimationFileName="";completionAnimationUploadInput.value="";setUploadStatus(completionAnimationUploadStatus,"","")});
clearCompletionAudioUploadButton.addEventListener("click",()=>{pendingCompletionAudioData="";pendingCompletionAudioFileName="";completionAudioUploadInput.value="";setUploadStatus(completionAudioUploadStatus,"","")});
reinforcementPackageInput.addEventListener(
    "change",
    updateReinforcementPackageDisplay
);
previewTokenReinforcementButton.addEventListener(
    "click",
    previewTokenReinforcement
);
previewCompletionReinforcementButton.addEventListener(
    "click",
    previewCompletionReinforcement
);



addLibraryPackageButton.onclick=function(){
    openLibraryPackageEditor();
};

saveLibraryPackageButton.onclick=saveLibraryPackage;
cancelLibraryPackageButton.onclick=closeLibraryPackageEditor;
deactivateLibraryPackageButton.onclick=toggleLibraryPackageActive;

libraryTokenUploadInput.onchange=async function(){
    try{
        const result=await readUploadedFile(
            libraryTokenUploadInput.files?.[0],
            MAX_IMAGE_UPLOAD_BYTES,
            "image/"
        );
        pendingLibraryTokenData=result.data;
        pendingLibraryTokenFileName=result.name;
        setLibraryUploadStatuses();
    }catch(error){
        libraryTokenUploadInput.value="";
        setUploadStatus(libraryTokenStatus,"","",error.message);
    }
};

libraryCompletionUploadInput.onchange=async function(){
    try{
        const result=await readUploadedFile(
            libraryCompletionUploadInput.files?.[0],
            MAX_IMAGE_UPLOAD_BYTES,
            "image/"
        );
        pendingLibraryCompletionData=result.data;
        pendingLibraryCompletionFileName=result.name;
        setLibraryUploadStatuses();
    }catch(error){
        libraryCompletionUploadInput.value="";
        setUploadStatus(libraryCompletionStatus,"","",error.message);
    }
};

libraryAudioUploadInput.onchange=async function(){
    try{
        const result=await readUploadedFile(
            libraryAudioUploadInput.files?.[0],
            MAX_AUDIO_UPLOAD_BYTES,
            "audio/"
        );
        pendingLibraryAudioData=result.data;
        pendingLibraryAudioFileName=result.name;
        setLibraryUploadStatuses();
    }catch(error){
        libraryAudioUploadInput.value="";
        setUploadStatus(libraryAudioStatus,"","",error.message);
    }
};

clearLibraryTokenButton.onclick=function(){
    pendingLibraryTokenData="";
    pendingLibraryTokenFileName="";
    libraryTokenUploadInput.value="";
    setLibraryUploadStatuses();
};

clearLibraryCompletionButton.onclick=function(){
    pendingLibraryCompletionData="";
    pendingLibraryCompletionFileName="";
    libraryCompletionUploadInput.value="";
    setLibraryUploadStatuses();
};

clearLibraryAudioButton.onclick=function(){
    pendingLibraryAudioData="";
    pendingLibraryAudioFileName="";
    libraryAudioUploadInput.value="";
    setLibraryUploadStatuses();
};

previewLibraryTokenButton.onclick=function(){
    const previous=appState.currentStudent;
    appState.currentStudent=buildLibraryPreviewProfile();
    showTokenCelebration({preview:true});
    appState.currentStudent=previous;
};

previewLibraryCompletionButton.onclick=function(){
    const previous=appState.currentStudent;
    appState.currentStudent=buildLibraryPreviewProfile();
    playCompletionMedia({preview:true});
    appState.currentStudent=previous;
};

classroomTabButton.onclick=function(){
    showTeacherPanel("classroom");
};

saveClassroomButton.onclick=function(){
    appState.classroom={
        name:(classroomNameInput.value.trim()||"My Classroom").slice(0,80),
        leadTeacher:classroomTeacherNameInput.value.trim().slice(0,80)
    };

    saveClassroomProfile();
    classroomMessage.textContent="Classroom profile saved.";
};

addStaffButton.onclick=function(){
    openStaffEditor();
};

saveStaffButton.onclick=saveStaffMember;
cancelStaffButton.onclick=closeStaffEditor;

sessionAdministratorSelect.onchange=function(){
    appState.selectedAdministratorId=sessionAdministratorSelect.value;
    saveSelectedAdministrator();
};

reportAdministratorFilter.onchange=renderReports;

homeStudentSelect.onchange=()=>{appState.selectedStudentId=homeStudentSelect.value;saveSelectedStudentId()};
startButton.onclick=openStudentWelcome;
teacherButton.onclick=openStudentPrograms;
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

loadClassroomProfile();
loadReinforcementLibrary();
loadStudents();
loadSessions();
updatePromptStyleDisplay();
updateHomeStudentSelect();
updateReportStudentFilter();
updateAdministratorSelects();
updateReinforcementPackageOptions();
disableAnswerButtons();
showScreen(homeScreen);
console.log("Budget Buddy v0.16 loaded successfully");
