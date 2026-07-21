const SELECTED_STUDENT_KEY = "buddySkillsSelectedStudent";

async function loadTrainingStation() {
    try {
        const response = await fetch("data/training-station-data.json");

        if (!response.ok) {
            throw new Error(`Could not load training data: ${response.status}`);
        }

        const data = await response.json();
        const selectedStudent = getSelectedStudent();
        const trainee = selectedStudent
            ? mergeSelectedStudent(data.trainee || {}, selectedStudent)
            : data.trainee || {};

        displayTrainee(trainee);
        displayTrainingAreas(data.trainingAreas || []);
        displayRecentTraining(data.recentTraining || {});

        const statusMessage = document.getElementById("statusMessage");
        if (statusMessage) {
            statusMessage.textContent = selectedStudent
                ? ""
                : "No classroom student was selected. Showing the sample Training Station profile.";
        }
    } catch (error) {
        console.error("Training Station error:", error);
        const statusMessage = document.getElementById("statusMessage");
        if (statusMessage) {
            statusMessage.textContent =
                "Training information could not be loaded. Please ask your Job Coach for help.";
        }
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

function mergeSelectedStudent(defaultTrainee, selectedStudent) {
    const firstName = selectedStudent.firstName || "";
    const lastName = selectedStudent.lastName || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    return {
        ...defaultTrainee,
        id: selectedStudent.id || defaultTrainee.id,
        name: fullName || selectedStudent.preferredName || "Student",
        preferredName: selectedStudent.preferredName || firstName || fullName || "Student",
        jobCoach: selectedStudent.jobCoach || "Not assigned",
        photo: ""
    };
}

function displayTrainee(trainee) {
    const displayName = trainee.preferredName || trainee.name || "Trainee";

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

function displayTrainingAreas(trainingAreas) {
    const trainingGrid = document.getElementById("trainingGrid");
    if (!trainingGrid) return;

    trainingGrid.innerHTML = "";
    const availableAreas = trainingAreas.filter((area) => area.available === true);

    if (availableAreas.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-message";
        message.textContent =
            "No training areas are currently available. Please ask your Job Coach for help.";
        trainingGrid.appendChild(message);
        return;
    }

    availableAreas.forEach((area) => {
        const card = document.createElement("a");
        card.className = "training-card";
        card.href = area.href || "#";
        card.setAttribute("aria-label", `${area.title}: ${area.description}`);

        const icon = document.createElement("span");
        icon.className = "training-card-icon";
        icon.textContent = area.icon || "⭐";
        icon.setAttribute("aria-hidden", "true");

        const copy = document.createElement("span");
        copy.className = "training-card-copy";

        const title = document.createElement("span");
        title.className = "training-card-title";
        title.textContent = area.title;

        const description = document.createElement("span");
        description.className = "training-card-description";
        description.textContent = area.description;

        copy.append(title, description);
        card.append(icon, copy);
        trainingGrid.appendChild(card);
    });
}

function displayRecentTraining(recentTraining) {
    setText("recentArea", recentTraining.area || "No previous training");
    setText("recentActivity", recentTraining.activity || "");
    setText("recentCompleted", recentTraining.completed || "");

    const independence = Number(recentTraining.independence);
    setText(
        "recentIndependence",
        Number.isFinite(independence) ? `${independence}% Independent` : ""
    );
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

document.addEventListener("DOMContentLoaded", loadTrainingStation);
