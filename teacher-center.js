(() => {
  "use strict";

  const STUDENTS_TABLE = "students";
  const SETTINGS_TABLE = "student_instructional_settings";
  const AUTH_KEY = "buddySkillsTeacherUnlocked";
  const REINFORCEMENT_LIBRARY_STORAGE_KEY = "budgetBuddyReinforcementLibrary_v1";
  const BUILT_IN_PACKAGES = ["stars", "rockets", "dinosaurs", "rainbow", "trains", "music", "none"];

  let supabaseClient = null;
  let students = [];

  document.addEventListener("DOMContentLoaded", initialize);

  function initialize() {
    bindEvents();
    populateReinforcementPackages();
    if (sessionStorage.getItem(AUTH_KEY) === "true") openTeacherCenter();
  }

  function bindEvents() {
    document.getElementById("teacherLoginForm")?.addEventListener("submit", login);
    document.getElementById("teacherLogoutButton")?.addEventListener("click", logout);
    document.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", () => showSection(button.dataset.section)));
    document.querySelectorAll("[data-open-section]").forEach(button => button.addEventListener("click", () => showSection(button.dataset.openSection)));
    document.getElementById("newStudentButton")?.addEventListener("click", startNewStudent);
    document.getElementById("studentEditorForm")?.addEventListener("submit", saveStudent);
    document.getElementById("cancelStudentEditButton")?.addEventListener("click", clearEditor);
    document.getElementById("editPromptingMode")?.addEventListener("change", updateControlledSettingsDisplay);
    document.getElementById("editReinforcementSystem")?.addEventListener("change", updateControlledSettingsDisplay);
  }

  function login(event) {
    event.preventDefault();
    const entered = document.getElementById("teacherPassword").value;
    const expected = window.BUDDY_SKILLS_TEACHER?.pilotPassword;
    if (!expected || entered !== expected) return showLoginStatus("The password was not accepted.", "error");
    sessionStorage.setItem(AUTH_KEY, "true");
    document.getElementById("teacherPassword").value = "";
    openTeacherCenter();
  }

  async function openTeacherCenter() {
    document.getElementById("teacherLogin").hidden = true;
    document.getElementById("teacherApp").hidden = false;
    try {
      supabaseClient = createSupabaseClient();
      populateReinforcementPackages();
      await loadStudents();
    } catch (error) {
      console.error(error);
      showStatus(error.message, "error");
    }
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    document.getElementById("teacherApp").hidden = true;
    document.getElementById("teacherLogin").hidden = false;
    showLoginStatus("Teacher Center locked.", "success");
  }

  function createSupabaseClient() {
    const config = window.BUDDY_SKILLS_SUPABASE;
    if (!window.supabase?.createClient) throw new Error("The Supabase browser library did not load.");
    if (!config?.url || !config?.publishableKey || config.url.includes("PASTE_") || config.publishableKey.includes("PASTE_")) {
      throw new Error("Supabase is not configured. Check supabase-config.js.");
    }
    return window.supabase.createClient(config.url.trim(), config.publishableKey.trim());
  }

  async function loadStudents() {
    showStatus("Loading student profiles...", "info");
    const { data, error } = await supabaseClient.from(STUDENTS_TABLE)
      .select("id, first_name, last_name, preferred_name, grade_level, job_coach, active, created_at")
      .order("active", { ascending: false })
      .order("preferred_name", { ascending: true, nullsFirst: false })
      .order("first_name", { ascending: true });
    if (error) throw error;
    students = data || [];
    renderStudents();
    document.getElementById("activeStudentCount").textContent = students.filter(student => student.active).length;
    showStatus("Student profiles and shared settings are connected to Supabase.", "success");
  }

  function renderStudents() {
    const directory = document.getElementById("teacherStudentDirectory");
    directory.innerHTML = "";
    if (!students.length) {
      directory.innerHTML = '<p class="empty-message">No student profiles have been created.</p>';
      return;
    }
    students.forEach(student => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `teacher-student-row${student.active ? "" : " is-inactive"}`;
      button.innerHTML = `<span class="teacher-student-avatar">${escapeHtml(initials(displayName(student)))}</span><span><strong>${escapeHtml(displayName(student))}</strong><small>${escapeHtml(student.grade_level || "Program not entered")}</small></span><span class="teacher-student-status">${student.active ? "Active" : "Inactive"}</span>`;
      button.addEventListener("click", () => editStudent(student));
      directory.appendChild(button);
    });
  }

  function populateReinforcementPackages(selectedValue = "") {
    const group = document.getElementById("teacherClassroomReinforcementOptions");
    const select = document.getElementById("editReinforcementPackage");
    if (!group || !select) return;
    group.innerHTML = "";
    const library = readLocalReinforcementLibrary();
    library.filter(item => item.active !== false).forEach(item => {
      const option = document.createElement("option");
      option.value = `library:${item.id}`;
      option.textContent = `❤️ ${item.name || "Classroom Package"}`;
      group.appendChild(option);
    });
    const note = document.getElementById("reinforcementLibraryNote");
    if (note) note.textContent = library.length
      ? "Budget Buddy classroom packages found on this browser. The saved package identifier is shared through Supabase."
      : "No browser-created classroom packages were found. Built-in packages remain available.";
    const desired = selectedValue || select.value || "stars";
    ensureStoredPackageOption(desired);
    select.value = [...select.options].some(option => option.value === desired) ? desired : "stars";
  }

  function readLocalReinforcementLibrary() {
    try {
      const parsed = JSON.parse(localStorage.getItem(REINFORCEMENT_LIBRARY_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Could not read the Budget Buddy reinforcement library.", error);
      return [];
    }
  }

  function ensureStoredPackageOption(value) {
    const select = document.getElementById("editReinforcementPackage");
    const group = document.getElementById("teacherClassroomReinforcementOptions");
    if (!select || !group || !value || [...select.options].some(option => option.value === value)) return;
    if (String(value).startsWith("library:")) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = "❤️ Saved classroom package";
      group.appendChild(option);
    }
  }

  function startNewStudent() {
    showSection("students");
    document.getElementById("studentEditorForm").reset();
    document.getElementById("studentId").value = "";
    document.getElementById("editActive").checked = true;
    populateReinforcementPackages();
    applySettingsToForm(defaultSettings());
    document.getElementById("studentEditorHeading").textContent = "Add Student";
    document.getElementById("editorHelp").textContent = "Create a de-identified cloud profile and shared instructional defaults.";
    document.getElementById("studentEditorForm").hidden = false;
    document.getElementById("editFirstName").focus();
  }

  async function editStudent(student) {
    document.getElementById("studentId").value = student.id;
    document.getElementById("editFirstName").value = student.first_name || "";
    document.getElementById("editLastName").value = student.last_name || "";
    document.getElementById("editPreferredName").value = student.preferred_name || "";
    document.getElementById("editGradeLevel").value = student.grade_level || "";
    document.getElementById("editJobCoach").value = student.job_coach || "";
    document.getElementById("editActive").checked = Boolean(student.active);
    document.getElementById("studentEditorHeading").textContent = displayName(student);
    document.getElementById("editorHelp").textContent = "Edit the profile and shared defaults used across Buddy Skills activities.";
    document.getElementById("studentEditorForm").hidden = false;
    populateReinforcementPackages();
    applySettingsToForm(defaultSettings());
    try {
      showStatus("Loading instructional settings...", "info");
      const { data, error } = await supabaseClient.from(SETTINGS_TABLE).select("*").eq("student_id", student.id).maybeSingle();
      if (error) throw error;
      populateReinforcementPackages(data?.reinforcement_package || "");
      applySettingsToForm(data || defaultSettings());
      showStatus("Student profile ready.", "success");
    } catch (error) {
      console.error(error);
      showStatus(`Instructional settings could not be loaded: ${friendlyError(error)}`, "error");
    }
  }

  async function saveStudent(event) {
    event.preventDefault();
    const id = document.getElementById("studentId").value;
    const profile = {
      first_name: clean(document.getElementById("editFirstName").value),
      last_name: optional(document.getElementById("editLastName").value),
      preferred_name: optional(document.getElementById("editPreferredName").value),
      grade_level: optional(document.getElementById("editGradeLevel").value),
      job_coach: optional(document.getElementById("editJobCoach").value),
      active: document.getElementById("editActive").checked,
      updated_at: new Date().toISOString()
    };
    if (!profile.first_name) return showStatus("First name is required.", "error");
    setEditorEnabled(false);
    showStatus(id ? "Saving profile and shared settings..." : "Creating student profile...", "info");
    try {
      let studentId = id;
      if (id) {
        const { error } = await supabaseClient.from(STUDENTS_TABLE).update(profile).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabaseClient.from(STUDENTS_TABLE).insert(profile).select("id").single();
        if (error) throw error;
        studentId = data.id;
      }
      const { error: settingsError } = await supabaseClient.from(SETTINGS_TABLE)
        .upsert(collectSettings(studentId), { onConflict: "student_id" });
      if (settingsError) throw settingsError;
      await loadStudents();
      clearEditor();
      showStatus(id ? "Student profile and shared settings updated." : "Student profile and shared settings created.", "success");
    } catch (error) {
      console.error(error);
      showStatus(`Changes could not be saved: ${friendlyError(error)}`, "error");
    } finally {
      setEditorEnabled(true);
    }
  }

  function collectSettings(studentId) {
    const promptingMode = document.getElementById("editPromptingMode").value;
    const reinforcementSystem = document.getElementById("editReinforcementSystem").value;
    return {
      student_id: studentId,
      prompting_mode: promptingMode,
      wait_time_seconds: numberValue("editWaitTime", 10),
      reinforcement_system: reinforcementSystem,
      reinforcement_type: reinforcementSystem === "token-board" ? "token" : "none",
      reinforcement_package: document.getElementById("editReinforcementPackage").value,
      token_requirement: numberValue("editTokenRequirement", 5),
      differential_reinforcement: document.getElementById("editDifferentialReinforcement").value,
      staff_notes: optional(document.getElementById("editInstructionNotes").value),
      updated_at: new Date().toISOString()
    };
  }

  function defaultSettings() {
    return {
      prompting_mode: "least-to-most",
      wait_time_seconds: 10,
      reinforcement_system: "token-board",
      reinforcement_type: "token",
      reinforcement_package: "stars",
      token_requirement: 5,
      differential_reinforcement: "all-correct",
      staff_notes: null
    };
  }

  function applySettingsToForm(settings) {
    const merged = { ...defaultSettings(), ...(settings || {}) };
    const promptingMode = ["baseline", "independent", "least-to-most"].includes(merged.prompting_mode)
      ? merged.prompting_mode
      : legacyPromptingMode(merged);
    document.getElementById("editPromptingMode").value = promptingMode;
    document.getElementById("editWaitTime").value = String(merged.wait_time_seconds ?? 10);
    const system = ["none", "token-board"].includes(merged.reinforcement_system)
      ? merged.reinforcement_system
      : (merged.reinforcement_type === "token" ? "token-board" : "none");
    document.getElementById("editReinforcementSystem").value = system;
    document.getElementById("editTokenRequirement").value = String(merged.token_requirement ?? 5);
    populateReinforcementPackages(merged.reinforcement_package || "stars");
    document.getElementById("editReinforcementPackage").value = merged.reinforcement_package || "stars";
    document.getElementById("editDifferentialReinforcement").value = merged.differential_reinforcement || "all-correct";
    document.getElementById("editInstructionNotes").value = merged.staff_notes || "";
    updateControlledSettingsDisplay();
  }

  function legacyPromptingMode(settings) {
    const first = Array.isArray(settings.prompt_hierarchy) ? String(settings.prompt_hierarchy[0] || "").toLowerCase() : "";
    return first.includes("independent") && (!settings.initial_prompt_level || String(settings.initial_prompt_level).toLowerCase().includes("independent"))
      ? "least-to-most" : "least-to-most";
  }

  function updateControlledSettingsDisplay() {
    const baseline = document.getElementById("editPromptingMode").value === "baseline";
    const tokenBoard = document.getElementById("editReinforcementSystem").value === "token-board" && !baseline;
    ["editTokenRequirement", "editReinforcementPackage", "editDifferentialReinforcement"].forEach(id => {
      document.getElementById(id).disabled = !tokenBoard;
    });
  }

  function clearEditor() {
    document.getElementById("studentEditorForm").hidden = true;
    document.getElementById("studentEditorHeading").textContent = "Select a student";
    document.getElementById("editorHelp").textContent = "Choose a student from the list or add a new de-identified profile.";
  }

  function showSection(name) {
    document.querySelectorAll(".teacher-section").forEach(section => section.hidden = true);
    document.getElementById(`${name}Section`).hidden = false;
    document.querySelectorAll(".teacher-nav-button").forEach(button => button.classList.toggle("is-active", button.dataset.section === name));
    document.getElementById("sectionTitle").textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }

  function setEditorEnabled(enabled) {
    document.querySelectorAll("#studentEditorForm input, #studentEditorForm textarea, #studentEditorForm select, #studentEditorForm button").forEach(control => control.disabled = !enabled);
    if (enabled) updateControlledSettingsDisplay();
  }

  function displayName(student) { return student.preferred_name?.trim() || student.first_name?.trim() || "Student"; }
  function initials(name) { return name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "BS"; }
  function clean(value) { return String(value || "").trim(); }
  function optional(value) { const result = clean(value); return result || null; }
  function numberValue(id, fallback) { const value = Number(document.getElementById(id).value); return Number.isFinite(value) ? value : fallback; }
  function friendlyError(error) {
    const message = String(error?.message || error || "Unknown error");
    const lower = message.toLowerCase();
    if (lower.includes("row-level security")) return "Supabase permission is not enabled. Run the included SQL file.";
    if (lower.includes("schema cache") || (lower.includes("column") && lower.includes("does not exist"))) return "Run SUPABASE-v1.2.3-REINFORCEMENT-UPDATE.sql, then refresh the Teacher Center.";
    return message;
  }
  function showStatus(message, type) {
    const status = document.getElementById("teacherStatus");
    status.textContent = message;
    status.className = `classroom-status classroom-status-${type}`;
  }
  function showLoginStatus(message, type) {
    const status = document.getElementById("loginStatus");
    status.textContent = message;
    status.className = `classroom-status classroom-status-${type}`;
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]));
  }
})();
