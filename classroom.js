(() => {
    "use strict";

    const TABLE_NAME = "students";
    const SELECTED_STUDENT_KEY = "buddySkillsSelectedStudent";

    let supabaseClient = null;

    document.addEventListener("DOMContentLoaded", initializeClassroom);

    async function initializeClassroom() {
        bindEvents();

        try {
            supabaseClient = createSupabaseClient();
            await loadStudents();
        } catch (error) {
            console.error("Buddy Skills classroom setup error:", error);
            showStatus(error.message, "error");
            showDirectoryMessage("Buddy Skills could not connect to Supabase. Check supabase-config.js and refresh the page.");
            setFormEnabled(false);
        }
    }

    function bindEvents() {
        const form = document.getElementById("addStudentForm");
        const refreshButton = document.getElementById("refreshStudentsButton");

        form?.addEventListener("submit", addStudent);
        refreshButton?.addEventListener("click", loadStudents);
    }

    function createSupabaseClient() {
        const config = window.BUDDY_SKILLS_SUPABASE;

        if (!window.supabase?.createClient) {
            throw new Error("The Supabase browser library did not load. Check the internet connection and refresh.");
        }

        if (!config || !isConfigured(config.url) || !isConfigured(config.publishableKey)) {
            throw new Error("Supabase is not configured yet. Paste the Project URL and publishable key into supabase-config.js.");
        }

        return window.supabase.createClient(config.url.trim(), config.publishableKey.trim());
    }

    function isConfigured(value) {
        return typeof value === "string" && value.trim() !== "" && !value.includes("PASTE_");
    }

    async function loadStudents() {
        if (!supabaseClient) return;

        showStatus("Loading students...", "info");
        showDirectoryMessage("Loading students...");
        setRefreshEnabled(false);

        try {
            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .select("id, first_name, last_name, preferred_name, grade_level, job_coach, active, created_at")
                .eq("active", true)
                .order("preferred_name", { ascending: true, nullsFirst: false })
                .order("first_name", { ascending: true });

            if (error) throw error;

            renderStudents(data || []);
            showStatus("Student list is connected to the development database.", "success");
        } catch (error) {
            console.error("Could not load students:", error);
            showStatus(`Students could not be loaded: ${friendlyError(error)}`, "error");
            showDirectoryMessage("No students could be loaded. Check the database connection and security policy.");
        } finally {
            setRefreshEnabled(true);
        }
    }

    async function addStudent(event) {
        event.preventDefault();
        if (!supabaseClient) return;

        const form = event.currentTarget;
        const formData = new FormData(form);
        const student = {
            first_name: cleanRequired(formData.get("first_name")),
            last_name: cleanOptional(formData.get("last_name")),
            preferred_name: cleanOptional(formData.get("preferred_name")),
            grade_level: cleanOptional(formData.get("grade_level")),
            job_coach: cleanOptional(formData.get("job_coach")),
            active: true
        };

        if (!student.first_name) {
            showStatus("Enter a fictional first name before saving.", "error");
            document.getElementById("firstName")?.focus();
            return;
        }

        setFormEnabled(false);
        showStatus("Saving the fictional student...", "info");

        try {
            const { data, error } = await supabaseClient
                .from(TABLE_NAME)
                .insert(student)
                .select("id, first_name, last_name, preferred_name, grade_level, job_coach, active, created_at")
                .single();

            if (error) throw error;

            form.reset();
            showStatus(`${displayName(data)} was added to the development database.`, "success");
            await loadStudents();
        } catch (error) {
            console.error("Could not add student:", error);
            showStatus(`The student could not be added: ${friendlyError(error)}`, "error");
        } finally {
            setFormEnabled(true);
        }
    }

    function renderStudents(students) {
        const directory = document.getElementById("studentDirectory");
        const count = document.getElementById("studentCount");
        if (!directory || !count) return;

        directory.innerHTML = "";
        count.textContent = `${students.length} ${students.length === 1 ? "student" : "students"}`;

        if (students.length === 0) {
            showDirectoryMessage("No fictional students have been added yet. Use the form to create the first test profile.");
            return;
        }

        students.forEach((student) => {
            const card = document.createElement("article");
            card.className = "student-profile-card";

            const avatar = document.createElement("div");
            avatar.className = "student-avatar";
            avatar.setAttribute("aria-hidden", "true");
            avatar.textContent = initials(displayName(student));

            const details = document.createElement("div");
            details.className = "student-profile-details";

            const name = document.createElement("h3");
            name.textContent = displayName(student);

            const legalName = document.createElement("p");
            legalName.className = "student-secondary-name";
            legalName.textContent = fullName(student);

            const metadata = document.createElement("div");
            metadata.className = "student-metadata";
            appendMetadata(metadata, "Program", student.grade_level || "Not entered");
            appendMetadata(metadata, "Job Coach", student.job_coach || "Not assigned");

            const button = document.createElement("button");
            button.className = "platform-button select-student-button";
            button.type = "button";
            button.textContent = "Open Student Activities";
            button.addEventListener("click", () => selectStudent(student));

            details.append(name);
            if (legalName.textContent && legalName.textContent !== name.textContent) {
                details.append(legalName);
            }
            details.append(metadata);
            card.append(avatar, details, button);
            directory.appendChild(card);
        });
    }

    function appendMetadata(container, labelText, valueText) {
        const item = document.createElement("p");
        const label = document.createElement("span");
        label.textContent = `${labelText}: `;
        item.append(label, document.createTextNode(valueText));
        container.appendChild(item);
    }

    function selectStudent(student) {
        const selectedStudent = {
            id: student.id,
            firstName: student.first_name || "",
            lastName: student.last_name || "",
            preferredName: student.preferred_name || "",
            gradeLevel: student.grade_level || "",
            jobCoach: student.job_coach || ""
        };

        sessionStorage.setItem(SELECTED_STUDENT_KEY, JSON.stringify(selectedStudent));
        window.location.href = "training-station.html";
    }

    function displayName(student) {
        return student?.preferred_name?.trim() || student?.first_name?.trim() || "Student";
    }

    function fullName(student) {
        return [student?.first_name, student?.last_name]
            .map((part) => String(part || "").trim())
            .filter(Boolean)
            .join(" ");
    }

    function initials(name) {
        return String(name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("") || "BS";
    }

    function cleanRequired(value) {
        return String(value || "").trim();
    }

    function cleanOptional(value) {
        const cleaned = String(value || "").trim();
        return cleaned || null;
    }

    function showDirectoryMessage(message) {
        const directory = document.getElementById("studentDirectory");
        const count = document.getElementById("studentCount");
        if (!directory) return;

        directory.innerHTML = "";
        const paragraph = document.createElement("p");
        paragraph.className = "empty-message";
        paragraph.textContent = message;
        directory.appendChild(paragraph);
        if (count) count.textContent = "0 students";
    }

    function showStatus(message, type) {
        const status = document.getElementById("classroomStatus");
        if (!status) return;

        status.textContent = message;
        status.className = `classroom-status classroom-status-${type}`;
    }

    function setFormEnabled(enabled) {
        const controls = document.querySelectorAll("#addStudentForm input, #addStudentForm button");
        controls.forEach((control) => {
            control.disabled = !enabled;
        });
    }

    function setRefreshEnabled(enabled) {
        const button = document.getElementById("refreshStudentsButton");
        if (button) button.disabled = !enabled;
    }

    function friendlyError(error) {
        const message = String(error?.message || error || "Unknown database error");
        if (message.toLowerCase().includes("failed to fetch")) {
            return "the browser could not reach Supabase";
        }
        return message;
    }
})();
