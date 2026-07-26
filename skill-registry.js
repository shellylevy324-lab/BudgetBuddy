/* Buddy Skills v3.0.2 - Skill Registry
 * One source of truth for teacher controls, student cards, and activity metadata.
 */
(function () {
  "use strict";

  const skills = [
    {
      key: "communitySigns",
      activityKey: "community-signs",
      title: "Community Signs",
      shortTitle: "Signs",
      icon: "🛑",
      description: "Practice recognizing important safety and community signs.",
      href: "community-signs.html?v=3.0.0",
      available: true,
      teacherPanelId: "communitySkillPanel",
      accessInputId: "editActivityCommunitySigns",
      teaching: {
        enabledInputId: "editCommunityTeachingEnabled",
        typeInputId: "editCommunityTeachingType",
        urlInputId: "editCommunityTeachingUrl"
      }
    },
    {
      key: "shoppingBudget",
      activityKey: "shopping-budget",
      title: "Shopping Budget",
      shortTitle: "Shopping",
      icon: "🛒",
      description: "Practice choosing items that fit within a budget.",
      href: "budget-buddy.html?launch=shopping-budget&v=3.0.0",
      available: true,
      teacherPanelId: "shoppingSkillPanel",
      accessInputId: "editActivityShoppingBudget",
      teaching: {
        enabledInputId: "editShoppingTeachingEnabled",
        typeInputId: "editShoppingTeachingType",
        urlInputId: "editShoppingTeachingUrl"
      }
    },
    {
      key: "moneyIdentification",
      activityKey: "money-identification",
      title: "Money Identification",
      shortTitle: "Money ID",
      icon: "💵",
      description: "Identify U.S. coins and bills by name and value.",
      href: "money-identification.html?v=3.0.4",
      available: true,
      teacherPanelId: "moneySkillPanel",
      accessInputId: "editActivityMoneyIdentification",
      teaching: {
        enabledInputId: "editMoneyTeachingEnabled",
        typeInputId: "editMoneyTeachingType",
        urlInputId: "editMoneyTeachingUrl"
      }
    }
  ];

  function all() {
    return skills.map(skill => ({ ...skill }));
  }

  function available() {
    return all().filter(skill => skill.available);
  }

  function find(key) {
    return skills.find(skill => skill.key === key || skill.activityKey === key) || null;
  }

  window.BuddySkillRegistry = Object.freeze({ all, available, find, version: "3.0.4" });
})();
