/* Buddy Skills v3.1.2 - Shared Session Engine
 * Authenticated teachers write through the reporting tables.
 * QR-launched student sessions write through access-code-scoped RPC functions.
 */
(function () {
  "use strict";

  const SESSION_TABLE = "student_sessions";
  const TRIAL_TABLE = "student_trials";
  const ACCESS_CODE_KEY = "buddySkillsStudentAccessCode";
  const SELECTED_STUDENT_KEY = "buddySkillsSelectedStudent";
  const MODULE_VERSION = "3.1.2";
  let client = null;
  let active = null;
  let writeQueue = Promise.resolve();

  function configuredClient() {
    if (client) return client;
    const config = window.BUDDY_SUPABASE_CONFIG || window.BUDDY_SKILLS_SUPABASE;
    if (!window.supabase?.createClient || !config?.url || !config?.publishableKey) return null;
    client = window.supabase.createClient(config.url.trim(), config.publishableKey.trim());
    return client;
  }

  function uuidOrNull(value) {
    const text = String(value || "").replace(/^library:/, "");
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
      ? text
      : null;
  }

  function normalizePhase(value) {
    const allowed = new Set(["baseline", "intervention", "prompt-fading", "maintenance", "generalization", "other"]);
    return allowed.has(value) ? value : "other";
  }

  function studentAccessCode() {
    const stored = sessionStorage.getItem(ACCESS_CODE_KEY);
    if (stored) return String(stored).trim().toUpperCase();
    try {
      const student = JSON.parse(sessionStorage.getItem(SELECTED_STUDENT_KEY) || "null");
      return student?.studentAccessCode ? String(student.studentAccessCode).trim().toUpperCase() : null;
    } catch (error) {
      return null;
    }
  }

  function enqueue(operation) {
    writeQueue = writeQueue.then(operation, operation);
    return writeQueue;
  }

  async function startSession(options) {
    const supabase = configuredClient();
    active = null;
    if (!supabase) {
      console.info("Buddy Skills reporting is unavailable; the session will remain in the browser backup.");
      return null;
    }

    const payload = {
      student_id: options.studentId,
      activity_key: options.activityKey,
      activity_name: options.activityName,
      teaching_phase: normalizePhase(options.teachingPhase),
      session_type: options.sessionType || null,
      prompting_mode: options.promptingMode || null,
      reinforcement_package_id: uuidOrNull(options.reinforcementPackageId),
      staff_name: options.staffName || null,
      started_at: options.startedAt || new Date().toISOString(),
      module_version: options.moduleVersion || MODULE_VERSION
    };

    const { data: authData } = await supabase.auth.getSession();
    if (authData?.session?.user) {
      const { data, error } = await supabase.from(SESSION_TABLE).insert({
        student_id: payload.student_id,
        activity_key: payload.activity_key,
        activity_name: payload.activity_name,
        teaching_phase: payload.teaching_phase,
        session_type: payload.session_type,
        prompting_mode: payload.prompting_mode,
        reinforcement_package_id: payload.reinforcement_package_id,
        staff_name: payload.staff_name,
        started_at: payload.started_at,
        module_version: payload.module_version
      }).select("id").single();
      if (error) throw error;
      active = { id: data.id, studentId: options.studentId, teachingPhase: payload.teaching_phase, mode: "teacher" };
      return active.id;
    }

    const accessCode = studentAccessCode();
    if (!accessCode) {
      console.info("No teacher session or student access code was found; cloud reporting was skipped.");
      return null;
    }

    const { data: sessionId, error } = await supabase.rpc("start_student_access_session", {
      p_access_code: accessCode,
      p_payload: payload
    });
    if (error) throw error;
    if (!sessionId) throw new Error("Supabase did not return a reporting session id.");
    active = { id: sessionId, studentId: options.studentId, teachingPhase: payload.teaching_phase, mode: "student-access", accessCode };
    return active.id;
  }

  function trialPayload(snapshot) {
    const result = snapshot.correct
      ? (snapshot.independent ? "independent" : "prompted")
      : (snapshot.noResponse ? "no-response" : "incorrect");
    return {
      trial_number: Number(snapshot.trialNumber),
      target: snapshot.target || snapshot.item || null,
      student_response: snapshot.studentResponse || snapshot.studentAnswer || null,
      result,
      correct: Boolean(snapshot.correct),
      independent: Boolean(snapshot.independent),
      prompt_level: snapshot.promptLevel || null,
      latency_seconds: Number.isFinite(Number(snapshot.latencySeconds)) ? Number(snapshot.latencySeconds) : null,
      token_earned: Boolean(snapshot.tokenEarned),
      error_correction: snapshot.correctedResponse ? "modeled-correction" : null,
      rapid_response: Boolean(snapshot.rapidResponse),
      recorded_at: snapshot.timestamp || new Date().toISOString(),
      task_data: snapshot.taskData || {}
    };
  }

  function recordTrial(trial) {
    if (!active) return Promise.resolve(null);
    const snapshot = { ...trial };
    return enqueue(async function () {
      const supabase = configuredClient();
      if (!supabase || !active) return null;
      const payload = trialPayload(snapshot);

      if (active.mode === "student-access") {
        const { error } = await supabase.rpc("record_student_access_trial", {
          p_access_code: active.accessCode,
          p_session_id: active.id,
          p_payload: payload
        });
        if (error) throw error;
        return true;
      }

      const { error } = await supabase.from(TRIAL_TABLE).upsert({
        session_id: active.id,
        student_id: active.studentId,
        trial_number: payload.trial_number,
        target: payload.target,
        student_response: payload.student_response,
        result: payload.result,
        correct: payload.correct,
        independent: payload.independent,
        prompt_level: payload.prompt_level,
        latency_seconds: payload.latency_seconds,
        token_earned: payload.token_earned,
        error_correction: payload.error_correction,
        rapid_response: payload.rapid_response,
        teaching_phase: active.teachingPhase,
        recorded_at: payload.recorded_at,
        task_data: payload.task_data
      }, { onConflict: "session_id,trial_number" });
      if (error) throw error;
      return true;
    }).catch(function (error) {
      console.error("Buddy Skills could not save a trial to cloud reporting:", error);
      return null;
    });
  }

  async function endSession(summary) {
    if (!active) return null;
    const closing = { ...active };
    await writeQueue;
    const supabase = configuredClient();
    if (!supabase) return null;
    const payload = {
      ended_at: summary.endedAt || new Date().toISOString(),
      duration_seconds: Math.max(0, Number(summary.durationSeconds) || 0),
      total_trials: Math.max(0, Number(summary.totalTrials) || 0),
      correct_trials: Math.max(0, Number(summary.correctTrials) || 0),
      independent_trials: Math.max(0, Number(summary.independentTrials) || 0),
      prompted_trials: Math.max(0, Number(summary.promptedTrials) || 0),
      incorrect_trials: Math.max(0, Number(summary.incorrectTrials) || 0),
      average_latency_seconds: Number.isFinite(Number(summary.averageLatencySeconds)) ? Number(summary.averageLatencySeconds) : null,
      notes: summary.notes || null
    };

    if (closing.mode === "student-access") {
      const { error } = await supabase.rpc("end_student_access_session", {
        p_access_code: closing.accessCode,
        p_session_id: closing.id,
        p_payload: payload
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.from(SESSION_TABLE).update({
        ended_at: payload.ended_at,
        duration_seconds: payload.duration_seconds,
        total_trials: payload.total_trials,
        correct_trials: payload.correct_trials,
        independent_trials: payload.independent_trials,
        prompted_trials: payload.prompted_trials,
        incorrect_trials: payload.incorrect_trials,
        average_latency_seconds: payload.average_latency_seconds,
        notes: payload.notes
      }).eq("id", closing.id);
      if (error) throw error;
    }

    active = null;
    return closing.id;
  }

  function getActiveSessionId() {
    return active?.id || null;
  }

  window.BuddySessionEngine = Object.freeze({
    startSession,
    recordTrial,
    endSession,
    getActiveSessionId
  });
})();
