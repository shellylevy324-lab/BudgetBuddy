/* Buddy Skills v3.0.1 - Shared Skill Framework
 * Shared profile normalization, prompting timers, reinforcement, cloud reporting,
 * and completion behavior for every skill activity.
 */
(function () {
  "use strict";

  const DEFAULT_SHARED = Object.freeze({
    promptingMode: "least-to-most",
    waitTimeSeconds: 10,
    reinforcementSystem: "token-board",
    reinforcementPackage: "stars",
    tokenRequirement: 5,
    trialRequirement: 5,
    differentialReinforcement: "all-correct"
  });

  const BUILT_IN_PACKAGES = Object.freeze({
    stars: { token: "⭐", completion: "🌟", praise: "Great work!" },
    rockets: { token: "🚀", completion: "🌌", praise: "You did it!" },
    dinosaurs: { token: "🦕", completion: "🦖", praise: "Dino-mite work!" },
    rainbow: { token: "🌈", completion: "✨", praise: "Wonderful work!" },
    trains: { token: "🚂", completion: "🚆", praise: "Great job staying on track!" },
    music: { token: "🎵", completion: "🎉", praise: "That was music to our ears!" },
    none: { token: "●", completion: "✓", praise: "Activity complete." }
  });

  function selectedStudent() {
    try { return JSON.parse(sessionStorage.getItem("buddySkillsSelectedStudent") || "null"); }
    catch (_) { return null; }
  }

  function settingsFrom(student) {
    return student?.instructionalSettings || student?.instructional_settings || {};
  }

  function normalizeShared(settings) {
    const source = settings || {};
    const system = ["none", "token-board", "trial-reinforcement"].includes(source.reinforcement_system)
      ? source.reinforcement_system
      : DEFAULT_SHARED.reinforcementSystem;
    return {
      promptingMode: ["baseline", "independent", "least-to-most"].includes(source.prompting_mode)
        ? source.prompting_mode : DEFAULT_SHARED.promptingMode,
      waitTimeSeconds: positiveNumber(source.wait_time_seconds, DEFAULT_SHARED.waitTimeSeconds),
      reinforcementSystem: system,
      reinforcementPackage: source.reinforcement_package || DEFAULT_SHARED.reinforcementPackage,
      tokenRequirement: positiveNumber(source.token_requirement, DEFAULT_SHARED.tokenRequirement),
      trialRequirement: positiveNumber(source.trial_requirement, DEFAULT_SHARED.trialRequirement),
      differentialReinforcement: source.differential_reinforcement || DEFAULT_SHARED.differentialReinforcement
    };
  }

  function skillSettings(settings, skillKey) {
    const source = settings || {};
    const teaching = source.activity_teaching_settings?.[skillKey] || {};
    return {
      enabled: source.activity_access?.[skillKey] !== false,
      teaching: {
        enabled: teaching.enabled === true,
        type: teaching.type || "built-in",
        url: teaching.url || null
      }
    };
  }

  function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function createPromptScheduler() {
    let timers = [];
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function schedule(callback, delayMs) {
      const timer = setTimeout(callback, Math.max(0, Number(delayMs) || 0));
      timers.push(timer);
      return timer;
    }
    return Object.freeze({ schedule, clear });
  }

  function createReinforcement(options) {
    const shared = { ...DEFAULT_SHARED, ...(options?.shared || {}) };
    const cloudPackage = options?.cloudPackage || null;
    let earned = 0;

    function packageData() {
      return BUILT_IN_PACKAGES[shared.reinforcementPackage] || BUILT_IN_PACKAGES.stars;
    }

    function shouldAward(independent) {
      if (shared.promptingMode === "baseline" || shared.reinforcementSystem === "none") return false;
      if (shared.differentialReinforcement === "independent-only") return Boolean(independent);
      return true;
    }

    function award(independent) {
      if (!shouldAward(independent)) return { awarded: false, earned, goal: goal() };
      earned = Math.min(goal(), earned + 1);
      return { awarded: true, earned, goal: goal(), complete: earned >= goal() };
    }

    function goal() {
      return shared.reinforcementSystem === "trial-reinforcement"
        ? shared.trialRequirement : shared.tokenRequirement;
    }

    function renderTokenBoard(container) {
      if (!container) return;
      container.hidden = shared.reinforcementSystem !== "token-board" || shared.promptingMode === "baseline";
      if (container.hidden) { container.innerHTML = ""; return; }
      const item = cloudPackage?.token_url
        ? `<img src="${escapeAttribute(cloudPackage.token_url)}" alt="Token">`
        : packageData().token;
      container.innerHTML = `<p class="shared-token-label">Tokens ${earned} of ${goal()}</p><div class="shared-token-row">${Array.from({ length: goal() }, (_, index) => `<span class="shared-token ${index < earned ? "is-earned" : ""}">${index < earned ? item : "○"}</span>`).join("")}</div>`;
    }

    function renderCompletion(container, activityName) {
      if (!container) return;
      const data = packageData();
      const image = cloudPackage?.completion_url;
      const praise = cloudPackage?.praise_text || data.praise;
      container.innerHTML = `<div class="shared-completion-icon">${image ? `<img src="${escapeAttribute(image)}" alt="Completion celebration">` : data.completion}</div><h2>${escapeHtml(activityName || "Activity")} complete!</h2><p>${escapeHtml(praise)}</p>`;
      if (cloudPackage?.audio_url) new Audio(cloudPackage.audio_url).play().catch(() => {});
      else speak(praise);
    }

    return Object.freeze({ award, goal, renderTokenBoard, renderCompletion, get earned() { return earned; } });
  }

  function createSession(options) {
    const startedAt = Date.now();
    const responses = [];
    async function start() {
      return window.BuddySessionEngine?.startSession({
        studentId: options.studentId,
        activityKey: options.activityKey,
        activityName: options.activityName,
        promptingMode: options.promptingMode,
        reinforcementPackageId: options.reinforcementPackageId,
        teachingPhase: options.teachingPhase || "intervention",
        moduleVersion: options.moduleVersion || "3.0.0"
      });
    }
    function record(trial) {
      responses.push({ ...trial });
      return window.BuddySessionEngine?.recordTrial(trial);
    }
    async function end() {
      const total = responses.length;
      const correct = responses.filter(item => item.correct).length;
      const independent = responses.filter(item => item.independent).length;
      const prompted = responses.filter(item => item.correct && !item.independent).length;
      const latencyValues = responses.map(item => Number(item.latencySeconds)).filter(Number.isFinite);
      const averageLatency = latencyValues.length ? latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length : null;
      await window.BuddySessionEngine?.endSession({
        durationSeconds: (Date.now() - startedAt) / 1000,
        totalTrials: total,
        correctTrials: correct,
        independentTrials: independent,
        promptedTrials: prompted,
        incorrectTrials: total - correct,
        averageLatencySeconds: averageLatency
      });
      return { total, correct, independent, prompted, averageLatency };
    }
    return Object.freeze({ start, record, end, responses });
  }

  function speak(text) {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(String(text)));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function escapeAttribute(value) { return escapeHtml(value); }

  window.BuddySkillFramework = Object.freeze({
    version: "3.0.1",
    selectedStudent,
    settingsFrom,
    normalizeShared,
    skillSettings,
    createPromptScheduler,
    createReinforcement,
    createSession,
    speak
  });
})();
