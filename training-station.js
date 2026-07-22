const SELECTED_STUDENT_KEY = "buddySkillsSelectedStudent";

const STUDENT_ACTIVITIES = [
    {
        id: "shopping-budget",
        title: "Shopping Budget",
        icon: "🛒",
        description: "Practice choosing items that fit within a budget.",
        available: true,
        href: "index.html?launch=shopping-budget"
    },
    {
        id: "making-change",
        title: "Making Change",
        icon: "💵",
        description: "Practice finding the correct amount of change.",
        available: false
    },
    {
        id: "price-comparison",
        title: "Price Comparison",
        icon: "🏷️",
        description: "Practice comparing prices and choosing between options.",
        available: false
    },
    {
        id: "counting-money",
        title: "Counting Money",
        icon: "🪙",
        description: "Practice identifying and combining bills and coins.",
        available: false
    },
    {
        id: "laundry-steps",
        title: "Laundry Steps",
        icon: "🧺",
        description: "Practice sorting and putting laundry steps in order.",
        available: false
    },
    {
        id: "community-skills",
        title: "Community Skills",
        icon: "🚌",
        description: "Practice community safety and everyday decisions.",
        available: false
    },
    {
        id: "work-skills",
        title: "Work Skills",
        icon: "💼",
        description: "Practice matching, sorting, counting, and stocking tasks.",
        available: false
    }
];

function loadStudentHome() {
    const selectedStudent = getSelectedStudent();
    const trainee = selectedStudent ? normalizeSelectedStudent(selectedStudent) : {
        preferredName: "Student",
        name: "Student",
        jobCoach: "Not assigned",
        photo: ""
    };

    displayTrainee(trainee);
    displayActivities(STUDENT_ACTIVITIES);

    const statusMessage = document.getElementById("statusMessage");
    if (statusMessage) {
        statusMessage.textContent = selectedStudent
            ? ""
            : "No student was selected. Return to the Teacher Center and choose Open Activities for a student.";
    }
}

function getSelectedStudent() {
    try {
        const savedStudent = sessionStorage.getItem(SELECTED_STUDENT_KEY);
        return savedStudent ? JSON.parse(savedStudent) : null;
    } catch (error) {
        console.warn("Selected student could not be read:", error);
        return null;
    }
}

function normalizeSelectedStudent(selectedStudent) {
    const firstName = selectedStudent.firstName || "";
    const lastName = selectedStudent.lastName || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    return {
        id: selectedStudent.id,
        name: fullName || selectedStudent.preferredName || "Student",
        preferredName: selectedStudent.preferredName || firstName || fullName || "Student",
        jobCoach: selectedStudent.jobCoach || "Not assigned",
        photo: ""
    };
}

function displayTrainee(trainee) {
    const displayName = trainee.preferredName || trainee.name || "Student";

    setText("welcomeMessage", `Welcome, ${displayName}`);
    setText("traineeName", displayName);
    setText("jobCoachName", trainee.jobCoach || "Not assigned");
    displayTraineePhoto(trainee.photo, displayName);
}

function displayTraineePhoto(photoPath, displayName) {
    const wrap = document.getElementById("traineePhotoWrap");
    if (!wrap) return;

    wrap.innerHTML = "";

    if (photoPath) {
        const image = document.createElement("img");
        image.className = "trainee-photo";
        image.src = photoPath;
        image.alt = `${displayName}'s profile photo`;
        image.addEventListener("error", () => showPhotoPlaceholder(wrap, displayName));
        wrap.appendChild(image);
        return;
    }

    showPhotoPlaceholder(wrap, displayName);
}

function showPhotoPlaceholder(wrap, displayName) {
    wrap.innerHTML = "";
    const placeholder = document.createElement("span");
    placeholder.className = "trainee-photo-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.textContent = getInitials(displayName);
    wrap.appendChild(placeholder);
}

function getInitials(name) {
    return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "BS";
}

function displayActivities(activities) {
    const trainingGrid = document.getElementById("trainingGrid");
    if (!trainingGrid) return;

    trainingGrid.innerHTML = "";

    activities.forEach((activity) => {
        const card = document.createElement(activity.available ? "a" : "div");
        card.className = `training-card${activity.available ? "" : " coming-soon"}`;

        if (activity.available) {
            card.href = activity.href;
            card.setAttribute("aria-label", `${activity.title}: ${activity.description}`);
        } else {
            card.setAttribute("aria-disabled", "true");
        }

        const icon = document.createElement("span");
        icon.className = "training-card-icon";
        icon.textContent = activity.icon || "⭐";
        icon.setAttribute("aria-hidden", "true");

        const copy = document.createElement("span");
        copy.className = "training-card-copy";

        const title = document.createElement("span");
        title.className = "training-card-title";
        title.textContent = activity.title;

        const description = document.createElement("span");
        description.className = "training-card-description";
        description.textContent = activity.description;

        copy.append(title, description);

        if (!activity.available) {
            const label = document.createElement("span");
            label.className = "coming-soon-label";
            label.textContent = "Coming soon";
            copy.appendChild(label);
        }

        card.append(icon, copy);
        trainingGrid.appendChild(card);
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

document.addEventListener("DOMContentLoaded", loadStudentHome);
