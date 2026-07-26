/* Buddy Skills v2.2.0 - Shared Session Engine
 * Shared cloud reporting adapter for every Buddy Skills activity.
 */
(function () {
  "use strict";

  const SESSION_TABLE = "student_sessions";
  const TRIAL_TABLE = "student_trials";
  const MODULE_VERSION = "2.2.0";
  let client = null;
  let active = null;
  let writeQueue = Promise.resolve();

  function configuredClient() {
    if (client) return client;
    const config = window.BUDDY_SUPABASE_CONFIG;
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

    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session?.user) {
      console.info("No signed-in teacher session was found; cloud reporting was skipped.");
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

    const { data, error } = await supabase.from(SESSION_TABLE).insert(payload).select("id").single();
    if (error) throw error;

    active = {
      id: data.id,
      studentId: options.studentId,
      teachingPhase: payload.teaching_phase
    };
    return active.id;
  }

  function recordTrial(trial) {
    if (!active) return Promise.resolve(null);
    const snapshot = { ...trial };
    return enqueue(async function () {
      const supabase = configuredClient();
      if (!supabase || !active) return null;
      const result = snapshot.correct
        ? (snapshot.independent ? "independent" : "prompted")
        : (snapshot.noResponse ? "no-response" : "incorrect");
      const payload = {
        session_id: active.id,
        student_id: active.studentId,
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
        teaching_phase: active.teachingPhase,
        recorded_at: snapshot.timestamp || new Date().toISOString(),
        task_data: snapshot.taskData || {}
      };
      const { error } = await supabase.from(TRIAL_TABLE).upsert(payload, { onConflict: "session_id,trial_number" });
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
    const { error } = await supabase.from(SESSION_TABLE).update(payload).eq("id", closing.id);
    if (error) throw error;
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
