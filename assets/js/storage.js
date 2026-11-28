// ==========================================
// 1. CONSTANTS
// ==========================================

const KEYS = {
    USERS: "campushub_users",
    APPROVED_STUDENTS: "campushub_approved_students",
    RESOURCES: "campushub_resources",
    EVENTS: "campushub_events",
    REGISTRATIONS: "campushub_registrations",
    LOST_FOUND: "campushub_lost_found",
    PROJECTS: "campushub_projects",
    PROJECT_REQUESTS: "campushub_project_requests",
    POSTS: "campushub_posts",
    COMMENTS: "campushub_comments",
    LIKES: "campushub_likes",
    REPORTS: "campushub_reports",
    ACTIVITY_LOGS: "campushub_activity_logs",
    SESSION: "campushub_current_session"
};

// ==========================================
// 2. INITIAL DATA
// ==========================================

function initializeStorage() {

    let dataKeys = [
        KEYS.USERS,
        KEYS.APPROVED_STUDENTS,
        KEYS.RESOURCES,
        KEYS.EVENTS,
        KEYS.REGISTRATIONS,
        KEYS.LOST_FOUND,
        KEYS.PROJECTS,
        KEYS.PROJECT_REQUESTS,
        KEYS.POSTS,
        KEYS.COMMENTS,
        KEYS.LIKES,
        KEYS.REPORTS,
        KEYS.ACTIVITY_LOGS
    ];

    // NOTION NOUVELLE: LocalStorage

    for (let i = 0; i < dataKeys.length; i++) {

        if (localStorage.getItem(dataKeys[i]) === null) {
            localStorage.setItem(dataKeys[i], JSON.stringify([]));
        }

    }


    let demoStudents = [
        { matricule: "2026001", code: "ABC123", firstName: "Ahmed", lastName: "Student", email: "student@example.com" },
        { matricule: "2026002", code: "SAM123", firstName: "Sami", lastName: "Ben Ali", email: "sami@campushub.local" },
        { matricule: "2026003", code: "MAR123", firstName: "Mariam", lastName: "Trabelsi", email: "mariam@campushub.local" },
        { matricule: "2026004", code: "YOU123", firstName: "Youssef", lastName: "Khalil", email: "youssef@campushub.local" },
        { matricule: "2026005", code: "SAL123", firstName: "Salma", lastName: "Haddad", email: "salma@campushub.local" },
        { matricule: "2026006", code: "AMI123", firstName: "Amine", lastName: "Mansour", email: "amine@campushub.local" }
    ];

    let approvedStudents = getData(KEYS.APPROVED_STUDENTS);
    let users = getData(KEYS.USERS);

    for (let i = 0; i < demoStudents.length; i++) {

        let demo = demoStudents[i];
        let account = null;

        for (let j = 0; j < users.length; j++) {
            if (users[j].role === "student" &&
                String(users[j].matricule || "").trim() === demo.matricule) {
                account = users[j];
                break;
            }
        }

        let oldRecord = null;
        for (let j = 0; j < approvedStudents.length; j++) {
            if (String(approvedStudents[j].matricule || "").trim() === demo.matricule) {
                oldRecord = approvedStudents[j];
                break;
            }
        }


        let correctedRecord = {
            id: oldRecord && oldRecord.id ? oldRecord.id : makeId(),
            matricule: demo.matricule,
            code: account ? "" : demo.code,
            firstName: account ? (account.firstName || demo.firstName) : demo.firstName,
            lastName: account ? (account.lastName || demo.lastName) : demo.lastName,
            email: account ? (account.email || demo.email) : demo.email,
            used: account !== null,
            active: account ? account.active !== false : (oldRecord ? oldRecord.active !== false : true),
            createdAt: oldRecord && oldRecord.createdAt ? oldRecord.createdAt : new Date().toISOString()
        };

        let cleanedRecords = [];
        let inserted = false;

        for (let j = 0; j < approvedStudents.length; j++) {
            if (String(approvedStudents[j].matricule || "").trim() === demo.matricule) {
                if (inserted === false) {
                    cleanedRecords.push(correctedRecord);
                    inserted = true;
                }
            } else {
                cleanedRecords.push(approvedStudents[j]);
            }
        }

        if (inserted === false) {
            cleanedRecords.push(correctedRecord);
        }

        approvedStudents = cleanedRecords;
    }

    saveData(KEYS.APPROVED_STUDENTS, approvedStudents);

}

// ==========================================
// 3. GET DATA
// ==========================================

// NOTION NOUVELLE: JSON.parse

function getData(key) {

    try {

        let data = localStorage.getItem(key);

        if (data === null) {
            return [];
        }

        let result = JSON.parse(data);

        if (Array.isArray(result)) {
            return result;
        }

        return [];

    } catch (error) {

        console.log("Storage error:", error);
        return [];

    }

}

// ==========================================
// 4. SAVE DATA
// ==========================================



function saveData(key, data) {

    try {

        if (!Array.isArray(data)) {
            console.log("Save error: data must be an array.");
            return false;
        }

        localStorage.setItem(key, JSON.stringify(data));
        return true;

    } catch (error) {

        console.log("Save error:", error);
        return false;

    }

}

// ==========================================
// 5. GENERATE UNIQUE ID
// ==========================================

function makeId() {

    return Date.now().toString() +
        Math.floor(Math.random() * 100000).toString();

}

// ==========================================
// 6. GET CURRENT DATE
// ==========================================

function today() {

    let date = new Date();

    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, "0");
    let day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;

}

// ==========================================
// 7. SESSION MANAGEMENT
// ==========================================

function currentUser() {

    try {

        let session = localStorage.getItem(KEYS.SESSION);

        if (session === null) {
            return null;
        }

        let user = JSON.parse(session);

        if (user === null || typeof user !== "object") {
            return null;
        }

        return user;

    } catch (error) {

        return null;

    }

}


function setSession(user) {

    try {

        localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
        return true;

    } catch (error) {

        console.log("Session error:", error);
        return false;

    }

}


function logoutUser() {

    localStorage.removeItem(KEYS.SESSION);

    // Le dashboard se trouve dans student/ ou admin/.
    window.location.href = "../login.html";

}


// ==========================================
// 8. ACTIVITY LOGS
// ==========================================

function addLog(action, details) {

    let logs = getData(KEYS.ACTIVITY_LOGS);

    let user = currentUser();

    let log = {
        id: makeId(),
        action: action,
        details: details,
        userId: user === null ? null : user.id,
        matricule: user === null ? null : user.matricule,
        date: new Date().toISOString()
    };

    logs.unshift(log);

    // Garder les 100 activités les plus récentes.
    if (logs.length > 100) {
        logs = logs.slice(0, 100);
    }

    saveData(KEYS.ACTIVITY_LOGS, logs);

}


// ==========================================
// 9. HTML PROTECTION
// ==========================================


function escapeHTML(value) {

    let element = document.createElement("div");

    element.textContent = String(value ?? "");

    return element.innerHTML;

}


// ==========================================
// 10. START STORAGE
// ==========================================

initializeStorage();
