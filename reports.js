(() => {
  "use strict";

  const SESSION_TABLE = "student_sessions";
  const TRIAL_TABLE = "student_trials";
  const LOCAL_SESSION_KEY = "budgetBuddySessions";
  let getClient = () => null;
  let getStudents = () => [];
  let showStatus = () => {};
  let filteredSessions = [];
  let sessionTrials = new Map();

  function initialize(options = {}) {
    if (typeof options.getClient === "function") getClient = options.getClient;
    if (typeof options.getStudents === "function") getStudents = options.getStudents;
    if (typeof options.showStatus === "function") showStatus = options.showStatus;
  }

  function studentName(student) {
    return student?.preferred_name || student?.first_name || "Student";
  }

  function populateStudentFilter() {
    const select = document.getElementById("reportStudentFilter");
    if (!select) return;
    const previous = select.value || "all";
    select.innerHTML = '<option value="all">All students</option>';
    const choices = new Map();
    getStudents().forEach(student => choices.set(student.id, studentName(student)));
    getLocalSessions().forEach(session => {
      if (session.student_id && !choices.has(session.student_id)) choices.set(session.student_id, session.student_name || "Student");
    });
    choices.forEach((name, id) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    });
    select.value = [...select.options].some(option => option.value === previous) ? previous : "all";
  }

  function dateStart(days) {
    if (days === "all") return null;
    const value = Number(days);
    if (!Number.isFinite(value)) return null;
    const start = new Date();
    start.setDate(start.getDate() - value);
    return start.toISOString();
  }

  function getLocalSessions() {
    try {
      const raw = JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.map(row => ({
        id: row.id,
        student_id: row.studentId || null,
        student_name: row.studentName || "Student",
        activity_key: "budget-buddy",
        activity_name: "Budget Buddy",
        teaching_phase: row.promptStyle === "baseline" ? "baseline" : (row.promptStyle === "prompt-fading-token" ? "prompt-fading" : "intervention"),
        session_type: row.promptStyle || "standard",
        staff_name: row.administratorName || null,
        started_at: row.startedAt,
        ended_at: row.completedAt,
        duration_seconds: row.startedAt && row.completedAt ? Math.max(0, Math.round((new Date(row.completedAt) - new Date(row.startedAt)) / 1000)) : null,
        total_trials: Number(row.completedTrials || row.trials?.length || 0),
        correct_trials: Number(row.correctCount || 0),
        independent_trials: Number(row.independentCount || 0),
        prompted_trials: Array.isArray(row.trials) ? row.trials.filter(trial => trial.correct && !trial.independent).length : 0,
        incorrect_trials: Number(row.incorrectCount || 0),
        average_latency_seconds: Number.isFinite(Number(row.averageLatencySeconds)) ? Number(row.averageLatencySeconds) : null,
        module_version: "2.4.1-local",
        _source: "local",
        _trials: Array.isArray(row.trials) ? row.trials : []
      }));
    } catch (error) {
      console.warn("Could not read the browser report backup:", error);
      return [];
    }
  }

  function applyLocalFilters(rows) {
    const studentId = document.getElementById("reportStudentFilter")?.value || "all";
    const activity = document.getElementById("reportActivityFilter")?.value || "all";
    const dateRange = document.getElementById("reportDateRangeFilter")?.value || "30";
    const phase = document.getElementById("reportPhaseFilter")?.value || "all";
    const fromDate = dateStart(dateRange);
    return rows.filter(row =>
      (studentId === "all" || row.student_id === studentId) &&
      (activity === "all" || row.activity_key === activity) &&
      (phase === "all" || row.teaching_phase === phase) &&
      (!fromDate || new Date(row.started_at) >= new Date(fromDate))
    );
  }

  async function render() {
    populateStudentFilter();
    resetDetail();
    const client = getClient();
    const localRows = applyLocalFilters(getLocalSessions());

    const studentId = document.getElementById("reportStudentFilter")?.value || "all";
    const activity = document.getElementById("reportActivityFilter")?.value || "all";
    const dateRange = document.getElementById("reportDateRangeFilter")?.value || "30";
    const phase = document.getElementById("reportPhaseFilter")?.value || "all";

    setLoading();
    let cloudRows = [];
    let cloudError = null;
    if (client) {
      let query = client.from(SESSION_TABLE)
        .select("id, student_id, activity_key, activity_name, teaching_phase, session_type, staff_name, started_at, ended_at, duration_seconds, total_trials, correct_trials, independent_trials, prompted_trials, incorrect_trials, average_latency_seconds, module_version")
        .order("started_at", { ascending: false });
      if (studentId !== "all") query = query.eq("student_id", studentId);
      if (activity !== "all") query = query.eq("activity_key", activity);
      if (phase !== "all") query = query.eq("teaching_phase", phase);
      const fromDate = dateStart(dateRange);
      if (fromDate) query = query.gte("started_at", fromDate);
      const result = await query;
      cloudRows = Array.isArray(result.data) ? result.data.map(row => ({ ...row, _source: "cloud" })) : [];
      cloudError = result.error || null;
    }

    filteredSessions = cloudRows.length ? cloudRows : localRows;
    sessionTrials.clear();
    updateSummary(filteredSessions);
    renderSessions(filteredSessions);
    const exportButton = document.getElementById("exportReportCsvButton");
    if (exportButton) exportButton.disabled = filteredSessions.length === 0;

    if (cloudRows.length) {
      showStatus(`Loaded ${cloudRows.length} cloud session${cloudRows.length === 1 ? "" : "s"}.`, "success");
    } else if (localRows.length) {
      showStatus(cloudError
        ? `Cloud reports could not load. Showing ${localRows.length} browser-backup session${localRows.length === 1 ? "" : "s"}. ${friendlyError(cloudError)}`
        : `Showing ${localRows.length} browser-backup session${localRows.length === 1 ? "" : "s"}.`, cloudError ? "warning" : "info");
    } else if (cloudError) {
      setEmpty("No reports could be loaded. Check the reporting SQL and teacher sign-in.");
      showStatus("Could not load reports: " + friendlyError(cloudError), "error");
    } else if (!client) {
      setEmpty("Sign in to load cloud reports. No browser-backup sessions were found on this device.");
    }
  }

  function setLoading() {
    const body = document.getElementById("reportSessionTableBody");
    if (body) body.innerHTML = '<tr><td colspan="9" class="reports-empty-cell">Loading saved sessions...</td></tr>';
  }

  function setEmpty(message) {
    filteredSessions = [];
    updateSummary([]);
    const body = document.getElementById("reportSessionTableBody");
    if (body) body.innerHTML = `<tr><td colspan="9" class="reports-empty-cell">${escapeHtml(message)}</td></tr>`;
    const exportButton = document.getElementById("exportReportCsvButton");
    if (exportButton) exportButton.disabled = true;
  }

  function updateSummary(sessions) {
    const totalTrials = sessions.reduce((sum, row) => sum + Number(row.total_trials || 0), 0);
    const independent = sessions.reduce((sum, row) => sum + Number(row.independent_trials || 0), 0);
    const prompted = sessions.reduce((sum, row) => sum + Number(row.prompted_trials || 0), 0);
    const incorrect = sessions.reduce((sum, row) => sum + Number(row.incorrect_trials || 0), 0);
    const latencyRows = sessions.filter(row => row.average_latency_seconds !== null && Number.isFinite(Number(row.average_latency_seconds)));
    const weightedLatencyTrials = latencyRows.reduce((sum, row) => sum + Math.max(1, Number(row.total_trials || 0)), 0);
    const weightedLatency = latencyRows.reduce((sum, row) => sum + Number(row.average_latency_seconds) * Math.max(1, Number(row.total_trials || 0)), 0);

    setText("reportSessionsCount", String(sessions.length));
    setText("reportTrialsCount", String(totalTrials));
    setText("reportIndependentPercent", percent(independent, totalTrials));
    setText("reportPromptedPercent", percent(prompted, totalTrials));
    setText("reportIncorrectPercent", percent(incorrect, totalTrials));
    setText("reportAverageLatency", weightedLatencyTrials ? `${(weightedLatency / weightedLatencyTrials).toFixed(2)} s` : "—");
  }

  function renderSessions(sessions) {
    const body = document.getElementById("reportSessionTableBody");
    if (!body) return;
    if (!sessions.length) {
      body.innerHTML = '<tr><td colspan="9" class="reports-empty-cell">No saved sessions match these filters.</td></tr>';
      return;
    }
    const students = new Map(getStudents().map(student => [student.id, student]));
    body.innerHTML = sessions.map(row => {
      const trials = Number(row.total_trials || 0);
      return `<tr>
        <td>${escapeHtml(formatDate(row.started_at))}</td>
        <td>${escapeHtml(row.student_name || studentName(students.get(row.student_id)))}</td>
        <td>${escapeHtml(row.activity_name || row.activity_key || "Activity")}</td>
        <td>${escapeHtml(formatPhase(row.teaching_phase))}</td>
        <td>${trials}</td>
        <td>${percent(Number(row.independent_trials || 0), trials)}</td>
        <td>${percent(Number(row.prompted_trials || 0), trials)}</td>
        <td>${row.average_latency_seconds === null ? "—" : `${Number(row.average_latency_seconds).toFixed(2)} s`}</td>
        <td><button class="teacher-secondary-button report-view-button" type="button" data-session-id="${row.id}">View</button></td>
      </tr>`;
    }).join("");
    body.querySelectorAll("[data-session-id]").forEach(button => {
      button.addEventListener("click", () => loadSessionDetails(button.dataset.sessionId));
    });
  }

  async function loadSessionDetails(sessionId) {
    const client = getClient();
    const session = filteredSessions.find(row => row.id === sessionId);
    if (!session) return;
    const detail = document.getElementById("reportSessionDetailCard");
    const body = document.getElementById("reportTrialTableBody");
    if (detail) detail.hidden = false;
    if (body) body.innerHTML = '<tr><td colspan="7" class="reports-empty-cell">Loading trial details...</td></tr>';
    setText("reportSessionDetailTitle", `${session.activity_name || "Session"} · ${formatDate(session.started_at)}`);

    let trials = sessionTrials.get(sessionId);
    if (!trials && session._source === "local") {
      trials = (session._trials || []).map(trial => ({
        trial_number: trial.trialNumber,
        target: trial.item,
        student_response: trial.studentAnswer,
        result: trial.correct ? (trial.independent ? "independent" : "prompted") : "incorrect",
        correct: Boolean(trial.correct),
        independent: Boolean(trial.independent),
        prompt_level: trial.promptLevel,
        latency_seconds: trial.latencySeconds,
        token_earned: Boolean(trial.tokenEarned),
        error_correction: trial.correctedResponse ? "modeled-correction" : null,
        rapid_response: Boolean(trial.rapidResponse),
        teaching_phase: session.teaching_phase,
        recorded_at: trial.timestamp
      }));
      sessionTrials.set(sessionId, trials);
    }
    if (!trials && client) {
      const { data, error } = await client.from(TRIAL_TABLE)
        .select("trial_number, target, student_response, result, correct, independent, prompt_level, latency_seconds, token_earned, error_correction, rapid_response, teaching_phase, recorded_at")
        .eq("session_id", sessionId)
        .order("trial_number", { ascending: true });
      if (error) {
        if (body) body.innerHTML = `<tr><td colspan="7" class="reports-empty-cell">${escapeHtml(friendlyError(error))}</td></tr>`;
        return;
      }
      trials = Array.isArray(data) ? data : [];
      sessionTrials.set(sessionId, trials);
    }
    renderTrials(trials);
    detail?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderTrials(trials) {
    const body = document.getElementById("reportTrialTableBody");
    if (!body) return;
    if (!trials.length) {
      body.innerHTML = '<tr><td colspan="7" class="reports-empty-cell">No individual trial rows were saved for this session.</td></tr>';
      return;
    }
    body.innerHTML = trials.map(row => `<tr>
      <td>${Number(row.trial_number || 0)}</td>
      <td>${escapeHtml(row.target || "—")}</td>
      <td>${escapeHtml(formatPhase(row.result || (row.correct ? "correct" : "incorrect")))}</td>
      <td>${escapeHtml(row.independent ? "Independent" : (row.prompt_level || "—"))}</td>
      <td>${row.latency_seconds === null ? "—" : `${Number(row.latency_seconds).toFixed(2)} s`}</td>
      <td>${row.token_earned ? "Yes" : "No"}</td>
      <td>${escapeHtml(row.error_correction || "—")}</td>
    </tr>`).join("");
  }

  function resetDetail() {
    const detail = document.getElementById("reportSessionDetailCard");
    if (detail) detail.hidden = true;
  }

  async function exportCsv() {
    if (!filteredSessions.length) return;
    const client = getClient();
    const students = new Map(getStudents().map(student => [student.id, student]));
    const headers = ["Student","Activity","Session Date","Session ID","Session Type","Teaching Phase","Staff","Trial Number","Target","Student Response","Result","Correct","Independent","Prompt Level","Latency Seconds","Token Earned","Error Correction","Rapid Response","Recorded At","Module Version"];
    const rows = [];

    for (const session of filteredSessions) {
      let trials = sessionTrials.get(session.id);
      if (!trials && session._source === "local") trials = session._trials || [];
      if (!trials && client) {
        const result = await client.from(TRIAL_TABLE)
          .select("session_id, trial_number, target, student_response, result, correct, independent, prompt_level, latency_seconds, token_earned, error_correction, rapid_response, teaching_phase, recorded_at")
          .eq("session_id", session.id)
          .order("trial_number", { ascending: true });
        if (result.error) return showStatus("Could not export report: " + friendlyError(result.error), "error");
        trials = result.data || [];
      }
      (trials || []).forEach(trial => {
        const local = session._source === "local";
        rows.push([
          session.student_name || studentName(students.get(session.student_id)), session.activity_name || session.activity_key || "", isoDate(session.started_at), session.id,
          session.session_type || "", trial.teaching_phase || session.teaching_phase || "", session.staff_name || "", local ? trial.trialNumber : trial.trial_number,
          local ? trial.item : (trial.target || ""), local ? trial.studentAnswer : (trial.student_response || ""), local ? (trial.correct ? (trial.independent ? "independent" : "prompted") : "incorrect") : (trial.result || ""),
          Boolean(trial.correct), Boolean(trial.independent), local ? (trial.promptLevel || "") : (trial.prompt_level || ""), local ? (trial.latencySeconds ?? "") : (trial.latency_seconds ?? ""),
          Boolean(trial.tokenEarned ?? trial.token_earned), local ? (trial.correctedResponse ? "modeled-correction" : "") : (trial.error_correction || ""), Boolean(trial.rapidResponse ?? trial.rapid_response),
          local ? (trial.timestamp || "") : (trial.recorded_at || ""), session.module_version || ""
        ]);
      });
    }
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `buddy-skills-report-${isoDate(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showStatus(`Exported ${rows.length} trial rows.`, "success");
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }
  function percent(value, total) { return total ? `${Math.round((value / total) * 100)}%` : "—"; }
  function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
  function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"; }
  function isoDate(value) { const date = value instanceof Date ? value : new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10); }
  function formatPhase(value) { return String(value || "").replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase()); }
  function friendlyError(error) { return error?.message || "An unexpected reporting error occurred."; }
  function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }

  window.BuddyReports = { initialize, render, exportCsv };
})();
