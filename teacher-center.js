(() => {
  "use strict";

  const STUDENTS_TABLE = "students";
  const SETTINGS_TABLE = "student_instructional_settings";
  const AUTH_KEY = "buddySkillsTeacherUnlocked";
  const REINFORCEMENT_LIBRARY_STORAGE_KEY = "budgetBuddyReinforcementLibrary_v1";
  const SELECTED_STUDENT_KEY = "buddySkillsSelectedStudent";
  const BUILT_IN_PACKAGES = ["stars", "rockets", "dinosaurs", "rainbow", "trains", "music", "none"];
  const REINFORCEMENT_TABLE = "reinforcement_packages";
  const REINFORCEMENT_BUCKET = "reinforcement-library";

  let supabaseClient = null;
  let students = [];
  let cloudReinforcementPackages = [];
  let editingReinforcementPackage = null;

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
    document.getElementById("newReinforcementPackageButton")?.addEventListener("click", () => openReinforcementEditor());
    document.getElementById("closeReinforcementEditorButton")?.addEventListener("click", closeReinforcementEditor);
    document.getElementById("reinforcementPackageForm")?.addEventListener("submit", saveCloudReinforcementPackage);
    document.getElementById("deleteReinforcementPackageButton")?.addEventListener("click", deleteCloudReinforcementPackage);
    document.getElementById("reinforcementTokenFile")?.addEventListener("change", event => previewSelectedFile(event.target.files?.[0], "reinforcementTokenPreview", "image"));
    document.getElementById("reinforcementCompletionFile")?.addEventListener("change", event => previewSelectedFile(event.target.files?.[0], "reinforcementCompletionPreview", "image"));
    document.getElementById("reinforcementAudioFile")?.addEventListener("change", event => previewSelectedFile(event.target.files?.[0], "reinforcementAudioPreview", "audio"));
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
      await Promise.all([loadStudents(), loadCloudReinforcementPackages()]);
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
      const row = document.createElement("article");
      row.className = `teacher-student-row teacher-student-row-with-actions${student.active ? "" : " is-inactive"}`;
      row.innerHTML = `
        <span class="teacher-student-avatar">${escapeHtml(initials(displayName(student)))}</span>
        <span class="teacher-student-summary"><strong>${escapeHtml(displayName(student))}</strong><small>${escapeHtml(student.grade_level || "Program not entered")}</small></span>
        <span class="teacher-student-status">${student.active ? "Active" : "Inactive"}</span>
        <span class="teacher-student-actions">
          <button class="teacher-row-button teacher-row-button-secondary" type="button" data-action="edit">Edit Profile</button>
          <button class="teacher-row-button" type="button" data-action="launch" ${student.active ? "" : "disabled"}>Open Activities</button>
        </span>`;
      row.querySelector('[data-action="edit"]').addEventListener("click", () => editStudent(student));
      row.querySelector('[data-action="launch"]').addEventListener("click", () => launchStudentActivities(student));
      directory.appendChild(row);
    });
  }

  async function launchStudentActivities(student) {
    if (!student?.active) {
      showStatus("Inactive students cannot be launched. Edit the profile to make the student active.", "error");
      return;
    }
    try {
      showStatus("Preparing the student profile...", "info");
      const { data: settings, error: settingsError } = await supabaseClient.from(SETTINGS_TABLE)
        .select("*").eq("student_id", student.id).maybeSingle();
      if (settingsError) throw settingsError;
      let reinforcementPackage = null;
      const packageValue = settings?.reinforcement_package || "";
      if (packageValue.startsWith("library:")) {
        const packageId = packageValue.slice("library:".length);
        const { data, error } = await supabaseClient.from(REINFORCEMENT_TABLE)
          .select("id, name, praise_text, token_url, completion_url, audio_url, active")
          .eq("id", packageId).maybeSingle();
        if (error) throw error;
        reinforcementPackage = data || null;
      }
      const selectedStudent = {
        id: student.id,
        firstName: student.first_name || "",
        lastName: student.last_name || "",
        preferredName: student.preferred_name || student.first_name || "Student",
        gradeLevel: student.grade_level || "",
        jobCoach: student.job_coach || "",
        instructionalSettings: settings || null,
        cloudReinforcementPackage: reinforcementPackage
      };
      sessionStorage.setItem(SELECTED_STUDENT_KEY, JSON.stringify(selectedStudent));
      window.location.href = "training-station.html";
    } catch (error) {
      console.error(error);
      showStatus(`Could not prepare student activities: ${friendlyError(error)}`, "error");
    }
  }

  function populateReinforcementPackages(selectedValue = "") {
    const group = document.getElementById("teacherClassroomReinforcementOptions");
    const select = document.getElementById("editReinforcementPackage");
    if (!group || !select) return;
    group.innerHTML = "";
    const localLibrary = readLocalReinforcementLibrary();
    const combined = [
      ...cloudReinforcementPackages.map(item => ({ ...item, source: "cloud" })),
      ...localLibrary.filter(local => !cloudReinforcementPackages.some(cloud => String(cloud.id) === String(local.id))).map(item => ({ ...item, source: "browser" }))
    ];
    combined.filter(item => item.active !== false).forEach(item => {
      const option = document.createElement("option");
      option.value = `library:${item.id}`;
      option.textContent = `${item.source === "cloud" ? "☁️" : "❤️"} ${item.name || "Teacher Package"}`;
      group.appendChild(option);
    });
    const note = document.getElementById("reinforcementLibraryNote");
    if (note) note.textContent = cloudReinforcementPackages.length
      ? "Cloud packages are available on every connected device. Browser-only legacy packages are also shown when present."
      : (localLibrary.length ? "Legacy browser packages are shown. Run the v1.4.0 Supabase setup to enable cross-device uploads." : "No teacher-created packages have been saved yet.");
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
      option.textContent = "❤️ Saved teacher package";
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
      await Promise.all([loadStudents(), loadCloudReinforcementPackages()]);
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
    document.getElementById("editorHelp").textContent = "Choose Edit Profile to manage settings, or Open Activities to launch student mode.";
  }

  function showSection(name) {
    document.querySelectorAll(".teacher-section").forEach(section => section.hidden = true);
    document.getElementById(`${name}Section`).hidden = false;
    document.querySelectorAll(".teacher-nav-button").forEach(button => button.classList.toggle("is-active", button.dataset.section === name));
    document.getElementById("sectionTitle").textContent = name.charAt(0).toUpperCase() + name.slice(1);
    if (name === "reinforcement" && supabaseClient) loadCloudReinforcementPackages();
  }


  async function loadCloudReinforcementPackages() {
    const list = document.getElementById("reinforcementPackageList");
    if (!supabaseClient) return;
    if (list) list.innerHTML = '<p class="empty-message">Loading reinforcement packages...</p>';
    const { data, error } = await supabaseClient.from(REINFORCEMENT_TABLE)
      .select("id, name, praise_text, token_url, completion_url, audio_url, active, created_at, updated_at")
      .order("active", { ascending: false })
      .order("name", { ascending: true });
    if (error) {
      if (list) list.innerHTML = '<p class="empty-message">Cloud library setup is not complete. Run SUPABASE-v1.4.0-REINFORCEMENT-LIBRARY.sql.</p>';
      showReinforcementStatus(friendlyError(error), "error");
      cloudReinforcementPackages = [];
      populateReinforcementPackages();
      return;
    }
    cloudReinforcementPackages = data || [];
    renderCloudReinforcementPackages();
    populateReinforcementPackages();
  }

  function renderCloudReinforcementPackages() {
    const list = document.getElementById("reinforcementPackageList");
    if (!list) return;
    list.innerHTML = "";
    if (!cloudReinforcementPackages.length) {
      list.innerHTML = '<p class="empty-message">No cloud packages yet. Select Upload New Package to create one.</p>';
      return;
    }
    cloudReinforcementPackages.forEach(item => {
      const card = document.createElement("article");
      card.className = `reinforcement-package-card${item.active === false ? " is-inactive" : ""}`;
      const preview = item.completion_url || item.token_url;
      card.innerHTML = `
        <div class="reinforcement-package-preview">${preview ? `<img src="${escapeHtml(preview)}" alt="">` : "<span>🎁</span>"}</div>
        <div><h4>${escapeHtml(item.name || "Teacher Package")}</h4><p>${escapeHtml(item.praise_text || "Nice job!")}</p></div>
        <p class="reinforcement-package-meta">${item.active === false ? "Inactive" : "Available"} · ${[item.token_url, item.completion_url, item.audio_url].filter(Boolean).length} uploaded media file(s)</p>
        <button class="teacher-row-button teacher-row-button-secondary" type="button">Edit Package</button>`;
      card.querySelector("button").addEventListener("click", () => openReinforcementEditor(item));
      list.appendChild(card);
    });
  }

  function openReinforcementEditor(item = null) {
    editingReinforcementPackage = item;
    document.getElementById("reinforcementPackageEditor").hidden = false;
    document.getElementById("reinforcementEditorHeading").textContent = item ? `Edit ${item.name}` : "New Package";
    document.getElementById("reinforcementPackageId").value = item?.id || "";
    document.getElementById("reinforcementPackageName").value = item?.name || "";
    document.getElementById("reinforcementPraiseText").value = item?.praise_text || "Nice job!";
    document.getElementById("reinforcementPackageActive").checked = item?.active !== false;
    document.getElementById("reinforcementTokenFile").value = "";
    document.getElementById("reinforcementCompletionFile").value = "";
    document.getElementById("reinforcementAudioFile").value = "";
    showExistingPreview("reinforcementTokenPreview", item?.token_url, "image");
    showExistingPreview("reinforcementCompletionPreview", item?.completion_url, "image");
    showExistingPreview("reinforcementAudioPreview", item?.audio_url, "audio");
    document.getElementById("deleteReinforcementPackageButton").hidden = !item;
    showReinforcementStatus("", "info");
    document.getElementById("reinforcementPackageName").focus();
  }

  function closeReinforcementEditor() {
    document.getElementById("reinforcementPackageEditor").hidden = true;
    editingReinforcementPackage = null;
  }

  function showExistingPreview(id, url, type) {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = url
      ? (type === "audio" ? `<audio controls src="${escapeHtml(url)}"></audio>` : `<img src="${escapeHtml(url)}" alt="Current uploaded media">`)
      : "<span>No file selected</span>";
  }

  function previewSelectedFile(file, previewId, type) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    showExistingPreview(previewId, url, type);
  }

  async function saveCloudReinforcementPackage(event) {
    event.preventDefault();
    if (!supabaseClient) return;
    const name = clean(document.getElementById("reinforcementPackageName").value);
    if (!name) return showReinforcementStatus("Enter a package name.", "error");
    const packageId = document.getElementById("reinforcementPackageId").value || crypto.randomUUID();
    const saveButton = document.getElementById("saveReinforcementPackageButton");
    saveButton.disabled = true;
    showReinforcementStatus("Uploading and saving package...", "info");
    try {
      const tokenFile = document.getElementById("reinforcementTokenFile").files?.[0];
      const completionFile = document.getElementById("reinforcementCompletionFile").files?.[0];
      const audioFile = document.getElementById("reinforcementAudioFile").files?.[0];
      validateUpload(tokenFile, "image", 8);
      validateUpload(completionFile, "image", 12);
      validateUpload(audioFile, "audio", 8);
      const tokenUrl = tokenFile ? await uploadReinforcementFile(packageId, "token", tokenFile) : (editingReinforcementPackage?.token_url || null);
      const completionUrl = completionFile ? await uploadReinforcementFile(packageId, "completion", completionFile) : (editingReinforcementPackage?.completion_url || null);
      const audioUrl = audioFile ? await uploadReinforcementFile(packageId, "audio", audioFile) : (editingReinforcementPackage?.audio_url || null);
      const payload = {
        id: packageId,
        name,
        praise_text: clean(document.getElementById("reinforcementPraiseText").value) || "Nice job!",
        token_url: tokenUrl,
        completion_url: completionUrl,
        audio_url: audioUrl,
        active: document.getElementById("reinforcementPackageActive").checked,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabaseClient.from(REINFORCEMENT_TABLE).upsert(payload, { onConflict: "id" });
      if (error) throw error;
      await loadCloudReinforcementPackages();
      showStatus(`Reinforcement package “${name}” is available across connected devices.`, "success");
      closeReinforcementEditor();
    } catch (error) {
      console.error(error);
      showReinforcementStatus(friendlyError(error), "error");
    } finally {
      saveButton.disabled = false;
    }
  }

  function validateUpload(file, expectedType, maxMb) {
    if (!file) return;
    if (!file.type.startsWith(`${expectedType}/`)) throw new Error(`Choose a valid ${expectedType} file.`);
    if (file.size > maxMb * 1024 * 1024) throw new Error(`${file.name} is larger than ${maxMb} MB.`);
  }

  async function uploadReinforcementFile(packageId, role, file) {
    const extension = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${packageId}/${role}.${extension}`;
    const { error } = await supabaseClient.storage.from(REINFORCEMENT_BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true
    });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(REINFORCEMENT_BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function deleteCloudReinforcementPackage() {
    if (!editingReinforcementPackage) return;
    if (!window.confirm(`Delete “${editingReinforcementPackage.name}” from the reinforcement library?`)) return;
    showReinforcementStatus("Deleting package...", "info");
    try {
      const { data: files } = await supabaseClient.storage.from(REINFORCEMENT_BUCKET).list(String(editingReinforcementPackage.id));
      if (files?.length) {
        await supabaseClient.storage.from(REINFORCEMENT_BUCKET).remove(files.map(file => `${editingReinforcementPackage.id}/${file.name}`));
      }
      const { error } = await supabaseClient.from(REINFORCEMENT_TABLE).delete().eq("id", editingReinforcementPackage.id);
      if (error) throw error;
      closeReinforcementEditor();
      await loadCloudReinforcementPackages();
      showStatus("Reinforcement package deleted.", "success");
    } catch (error) {
      console.error(error);
      showReinforcementStatus(friendlyError(error), "error");
    }
  }

  function showReinforcementStatus(message, type) {
    const status = document.getElementById("reinforcementUploadStatus");
    if (!status) return;
    status.textContent = message;
    status.className = `classroom-status classroom-status-${type}`;
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
