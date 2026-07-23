(function () {
  "use strict";

  function normalizeSettings(settings = {}) {
    return {
      enabled: settings.adaptive_teaching_enabled === true,
      threshold: Math.max(0, Math.min(100, Number(settings.mastery_threshold) || 50)),
      lessonType: settings.teaching_lesson_type || "built-in",
      lessonUrl: settings.teaching_lesson_url || "",
      retryTrialCount: settings.retry_trial_count || "same",
      maximumCycles: Math.max(1, Math.min(2, Number(settings.maximum_reteaching_cycles) || 1)),
      rightsConfirmed: settings.lesson_rights_confirmed === true
    };
  }

  function evaluate({ correct, total, cycle = 0, settings = {} }) {
    const config = normalizeSettings(settings);
    const safeTotal = Math.max(0, Number(total) || 0);
    const safeCorrect = Math.max(0, Math.min(safeTotal, Number(correct) || 0));
    const accuracy = safeTotal ? Math.round((safeCorrect / safeTotal) * 1000) / 10 : 0;
    if (!config.enabled || safeTotal === 0 || accuracy > config.threshold) {
      return { action: "continue", accuracy, config };
    }
    if (cycle >= config.maximumCycles) {
      return { action: "staff-review", accuracy, config };
    }
    return { action: "teach-and-retry", accuracy, nextCycle: cycle + 1, config };
  }

  function youtubeEmbedUrl(url) {
    try {
      const parsed = new URL(url);
      let id = "";
      if (parsed.hostname === "youtu.be") id = parsed.pathname.slice(1);
      if (parsed.hostname.endsWith("youtube.com")) {
        id = parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop() || "";
      }
      return /^[A-Za-z0-9_-]{6,20}$/.test(id)
        ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`
        : "";
    } catch (_) {
      return "";
    }
  }

  window.BuddySkillsAdaptiveLearning = { normalizeSettings, evaluate, youtubeEmbedUrl };
})();
