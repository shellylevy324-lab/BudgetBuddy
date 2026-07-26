const SELECTED_STUDENT_KEY = "buddySkillsSelectedStudent";
const STUDENT_MODE_KEY = "buddySkillsStudentMode";

const STUDENT_ACTIVITIES = [
  { id:"shopping-budget", settingKey:"shoppingBudget", title:"Shopping Budget", icon:"🛒", description:"Practice choosing items that fit within a budget.", href:"budget-buddy.html?launch=shopping-budget&v=2.4.4" },
  { id:"community-signs", settingKey:"communitySigns", title:"Community Signs", icon:"🛑", description:"Practice recognizing important safety and community signs.", href:"community-signs.html?v=2.4.4" }
];

function loadStudentHome(){
  const selectedStudent=getSelectedStudent();
  const active=sessionStorage.getItem(STUDENT_MODE_KEY)==="active";
  if(!selectedStudent||!active){ return showLockedStudentView(); }
  const trainee=normalizeSelectedStudent(selectedStudent);
  displayTrainee(trainee);
  const access=selectedStudent.instructionalSettings?.activity_access||{shoppingBudget:true,communitySigns:true};
  displayActivities(STUDENT_ACTIVITIES.filter(activity=>access[activity.settingKey]!==false));
  document.getElementById("statusMessage").textContent="";
}
function showLockedStudentView(){
  setText("welcomeMessage","Student View Locked"); setText("traineeName","Ask your teacher"); setText("jobCoachName","Not signed in");
  const grid=document.getElementById("trainingGrid");
  grid.innerHTML='<p class="empty-message">A teacher must open a student profile from the Teacher Center before activities can begin.</p>';
  document.getElementById("statusMessage").textContent="No student session is active.";
  document.getElementById("exitStudentMode").hidden=true;
}
function getSelectedStudent(){try{return JSON.parse(sessionStorage.getItem(SELECTED_STUDENT_KEY)||"null");}catch(e){return null;}}
function normalizeSelectedStudent(s){const full=[s.firstName||"",s.lastName||""].filter(Boolean).join(" ");return{id:s.id,name:full||s.preferredName||"Student",preferredName:s.preferredName||s.firstName||full||"Student",jobCoach:s.jobCoach||"Not assigned",photo:""};}
function displayTrainee(t){const n=t.preferredName||t.name||"Student";setText("welcomeMessage",`Welcome, ${n}`);setText("traineeName",n);setText("jobCoachName",t.jobCoach||"Not assigned");displayTraineePhoto(t.photo,n);}
function displayTraineePhoto(photo,name){const wrap=document.getElementById("traineePhotoWrap");if(!wrap)return;wrap.innerHTML="";if(photo){const img=document.createElement("img");img.className="trainee-photo";img.src=photo;img.alt=`${name}'s profile photo`;img.addEventListener("error",()=>showPhotoPlaceholder(wrap,name));wrap.appendChild(img);}else showPhotoPlaceholder(wrap,name);}
function showPhotoPlaceholder(wrap,name){wrap.innerHTML="";const span=document.createElement("span");span.className="trainee-photo-placeholder";span.setAttribute("aria-hidden","true");span.textContent=getInitials(name);wrap.appendChild(span);}
function getInitials(name){return String(name).trim().split(/\s+/).slice(0,2).map(p=>p.charAt(0).toUpperCase()).join("")||"BS";}
function displayActivities(activities){const grid=document.getElementById("trainingGrid");grid.innerHTML="";if(!activities.length){grid.innerHTML='<p class="empty-message">No activities are assigned right now. Ask your teacher to choose an activity.</p>';return;}activities.forEach(a=>{const card=document.createElement("a");card.className="training-card";card.href=a.href;card.setAttribute("aria-label",`${a.title}: ${a.description}`);card.innerHTML=`<span class="training-card-icon" aria-hidden="true">${a.icon}</span><span class="training-card-copy"><span class="training-card-title">${a.title}</span><span class="training-card-description">${a.description}</span></span>`;grid.appendChild(card);});}
function endStudentMode(){sessionStorage.removeItem(SELECTED_STUDENT_KEY);sessionStorage.removeItem(STUDENT_MODE_KEY);window.location.replace("training-station.html?v=2.4.4");}
function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value;}
document.addEventListener("DOMContentLoaded",()=>{history.replaceState(null,"",location.href);loadStudentHome();document.getElementById("exitStudentMode")?.addEventListener("click",endStudentMode);});
