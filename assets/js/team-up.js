if (document.getElementById('createProject')) {
(function () {
const PROJECT_KEYS = {
    PROJECTS: "campushub_projects",
    REQUESTS: "campushub_project_requests",
    USERS: "campushub_users",
    SESSION: "campushub_current_session"
};

function readProjectData(key) {
    try {
        let data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function saveProjectData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function projectId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function projectEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

function showProjectMessage(message, type) {
    let box = document.getElementById("serviceMessage");
    box.innerHTML = '<div class="alert alert-' + (type || "success") + ' alert-dismissible fade show" role="alert">' +
        projectEscape(message) + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
}

let student = typeof currentUser === "function" ? currentUser() : null;

if (!student || student.role !== "student") {
    window.location.href = "../login.html";
}

if (student) {
    document.getElementById("studentName").textContent =
        ((student.firstName || "") + " " + (student.lastName || "")).trim() || student.matricule || "Student";
}

document.getElementById("logoutBtn").addEventListener("click", function() {
    if (confirm("Are you sure you want to logout?")) {
        logoutUser();
    }
});

function getStudentName(userId) {
    let users = readProjectData(PROJECT_KEYS.USERS);
    let user = users.find(function(item) {
        return item.id === userId;
    });
    if (!user) return "Student";
    return ((user.firstName || "") + " " + (user.lastName || "")).trim() || user.matricule || "Student";
}

function getProjectMembers(project) {
    return Array.isArray(project.members) ? project.members : [];
}

function getProjectPlaces(project) {
    let places = Number(project.positions);
    return Number.isFinite(places) && places > 0 ? places : 0;
}

function migrateProjectPlaces(projects) {
    let changed = false;
    projects.forEach(function(project) {
        if (project.placesCounted === true) return;
        let members = Array.isArray(project.members) ? project.members : [];
        let acceptedMembers = Math.max(0, members.length - 1);
        let oldPlaces = Number(project.positions);
        if (!Number.isFinite(oldPlaces)) oldPlaces = 0;
        project.positions = Math.max(0, oldPlaces - acceptedMembers);
        project.status = project.positions > 0 ? "Open" : "Full";
        project.placesCounted = true;
        changed = true;
    });
    if (changed) saveProjectData(PROJECT_KEYS.PROJECTS, projects);
}

// ==========================================
// TASK MANAGEMENT
// ==========================================

function getProjectTasks(project) {
    return Array.isArray(project.tasks) ? project.tasks : [];
}

function renderProjectTasks(project) {
    let members = getProjectMembers(project);
    let isOwner = project.userId === student.id;
    let isMember = members.includes(student.id);

    if (!isMember) return "";

    let tasks = getProjectTasks(project);
    let taskRows = "";

    tasks.forEach(function(task) {
        let assignedName = getStudentName(task.assignedTo);
        let status = task.status || "To Do";
        let statusHTML = "";

        if (task.assignedTo === student.id) {
            statusHTML = '<select class="form-select form-select-sm" data-task-status="' +
                projectEscape(task.id) + '">' +
                '<option value="To Do"' + (status === "To Do" ? " selected" : "") + '>To Do</option>' +
                '<option value="In Progress"' + (status === "In Progress" ? " selected" : "") + '>In Progress</option>' +
                '<option value="Completed"' + (status === "Completed" ? " selected" : "") + '>Completed</option>' +
                '</select>';
        } else {
            statusHTML = '<span class="team-task-status">' + projectEscape(status) + '</span>';
        }

        taskRows += '<div class="team-task-item">' +
            '<div class="team-task-details"><strong>' + projectEscape(task.title || "Untitled task") + '</strong>' +
            (task.description ? '<small>' + projectEscape(task.description) + '</small>' : '') +
            '<small>Assigned to: ' + projectEscape(assignedName) + '</small></div>' +
            '<div class="team-task-state">' + statusHTML + '</div></div>';
    });

    let createTaskHTML = "";
    if (isOwner) {
        let memberOptions = members.map(function(userId) {
            return '<option value="' + projectEscape(userId) + '">' +
                projectEscape(getStudentName(userId)) + '</option>';
        }).join("");

        createTaskHTML = '<form class="team-task-form" data-create-task="' + projectEscape(project.id) + '">' +
            '<input type="text" class="form-control form-control-sm" name="taskTitle" maxlength="100" required placeholder="Task title">' +
            '<input type="text" class="form-control form-control-sm" name="taskDescription" maxlength="240" placeholder="Short description (optional)">' +
            '<select class="form-select form-select-sm" name="assignedTo" required>' + memberOptions + '</select>' +
            '<button type="submit" class="btn btn-sm btn-primary">Add Task</button></form>';
    }

    return '<section class="team-task-workspace"><div class="team-task-heading"><h6>Team Tasks</h6>' +
        '<span>' + tasks.length + ' task(s)</span></div>' +
        (taskRows || '<p class="team-task-empty">No tasks have been created yet.</p>') +
        createTaskHTML + '</section>';
}

let openedProjectId = null;

function renderProjectRoom() {
    let room = document.getElementById("projectRoom");
    let content = document.getElementById("projectRoomContent");
    if (!openedProjectId) {
        room.hidden = true;
        content.innerHTML = "";
        return;
    }

    let projects = readProjectData(PROJECT_KEYS.PROJECTS);
    let project = projects.find(function(item) { return item.id === openedProjectId; });
    if (!project || !getProjectMembers(project).includes(student.id)) {
        openedProjectId = null;
        room.hidden = true;
        content.innerHTML = "";
        return;
    }

    let members = getProjectMembers(project);
    let tasks = getProjectTasks(project);
    let messages = Array.isArray(project.discussion) ? project.discussion : [];
    let isOwner = project.userId === student.id;

    let memberHTML = members.map(function(userId) {
        return '<span class="project-room-member"><i class="bi bi-person-circle me-1"></i>' +
            projectEscape(getStudentName(userId)) + '</span>';
    }).join("");

    let taskHTML = tasks.map(function(task) {
        let assignedName = getStudentName(task.assignedTo);
        let status = task.status || "To Do";
        let statusControl = task.assignedTo === student.id
            ? '<select class="form-select form-select-sm project-task-status" data-room-task-status="' + projectEscape(task.id) + '">' +
                '<option value="To Do"' + (status === "To Do" ? " selected" : "") + '>To Do</option>' +
                '<option value="In Progress"' + (status === "In Progress" ? " selected" : "") + '>In Progress</option>' +
                '<option value="Completed"' + (status === "Completed" ? " selected" : "") + '>Completed</option></select>'
            : '<span class="team-task-status">' + projectEscape(status) + '</span>';

        return '<div class="team-task-item"><div class="team-task-details"><strong>' +
            projectEscape(task.title || "Untitled task") + '</strong>' +
            (task.description ? '<small>' + projectEscape(task.description) + '</small>' : '') +
            '<small>Assigned to: ' + projectEscape(assignedName) + '</small></div>' +
            '<div class="team-task-state">' + statusControl + '</div></div>';
    }).join("");

    let taskForm = "";
    if (isOwner) {
        let options = members.map(function(userId) {
            return '<option value="' + projectEscape(userId) + '">' + projectEscape(getStudentName(userId)) + '</option>';
        }).join("");
        taskForm = '<form class="team-task-form project-room-task-form" id="projectRoomTaskForm">' +
            '<input type="text" class="form-control" name="taskTitle" maxlength="100" required placeholder="Task title">' +
            '<input type="text" class="form-control" name="taskDescription" maxlength="240" placeholder="Short description (optional)">' +
            '<select class="form-select" name="assignedTo" required>' + options + '</select>' +
            '<button type="submit" class="btn btn-primary">Assign Task</button></form>';
    }

    let discussionHTML = messages.map(function(message) {
        return '<article class="project-discussion-message"><div class="project-discussion-message-head"><strong>' +
            projectEscape(getStudentName(message.userId)) + '</strong><small>' +
            projectEscape(new Date(message.createdAt).toLocaleString()) + '</small></div><p>' +
            projectEscape(message.text) + '</p></article>';
    }).join("");

    content.innerHTML = '<div class="project-room-header"><div><p class="section-label mb-1">TEAM WORKSPACE</p>' +
        '<h3>' + projectEscape(project.title) + '</h3><p>' + projectEscape(project.description || "") + '</p></div>' +
        '<button type="button" class="btn btn-outline-secondary btn-sm" id="closeProjectRoom"><i class="bi bi-arrow-left me-1"></i>Back to projects</button></div>' +
        '<div class="project-room-members"><strong>Team members:</strong>' + memberHTML + '</div>' +
        '<div class="project-room-grid"><section class="project-room-panel"><div class="project-room-panel-heading"><h5><i class="bi bi-list-check me-2"></i>Team Tasks</h5><span>' + tasks.length + ' task(s)</span></div>' +
        (taskHTML || '<p class="team-task-empty">No tasks yet. The project owner can create the first task.</p>') + taskForm +
        '</section><section class="project-room-panel"><div class="project-room-panel-heading"><h5><i class="bi bi-chat-dots me-2"></i>Discussion</h5><span>' + messages.length + ' message(s)</span></div>' +
        '<div class="project-discussion-list">' + (discussionHTML || '<p class="team-task-empty">No messages yet. Start the team discussion.</p>') + '</div>' +
        '<form id="projectDiscussionForm" class="project-discussion-form"><label for="projectDiscussionText" class="form-label">Write a message</label>' +
        '<textarea id="projectDiscussionText" class="form-control" rows="3" maxlength="1000" required placeholder="Share an idea, ask a question, or update your team..."></textarea>' +
        '<button type="submit" class="btn btn-primary mt-2"><i class="bi bi-send me-1"></i>Send message</button></form></section></div>';

    room.hidden = false;
}

function renderTeamProjects() {
    if (!student) return;
    let projects = readProjectData(PROJECT_KEYS.PROJECTS);
    migrateProjectPlaces(projects);
    let requests = readProjectData(PROJECT_KEYS.REQUESTS);
    let search = document.getElementById("projectSearch").value.trim().toLowerCase();
    let html = "";

    projects.forEach(function(project) {
        let title = String(project.title || "");
        let category = String(project.category || "");
        let description = String(project.description || "");
        let skills = String(project.skills || "");
        let members = getProjectMembers(project);
        let places = getProjectPlaces(project);
        let owner = project.userId === student.id;
        let myRequests = requests.filter(function(request) {
            return request.projectId === project.id && request.userId === student.id;
        });
        let myRequest = myRequests.length ? myRequests[myRequests.length - 1] : null;

        let searchText = (title + " " + category + " " + description + " " + skills).toLowerCase();
        if (search && searchText.indexOf(search) === -1) return;

        let actionHTML = "";
        if (owner) {
            actionHTML = '<span class="badge text-bg-primary">Your project</span>' +
                '<div class="d-flex flex-wrap gap-2 mt-3">' +
                '<button class="btn btn-sm btn-primary" data-open-project="' + projectEscape(project.id) + '"><i class="bi bi-folder2-open me-1"></i>Open Project</button>' +
                '<button class="btn btn-sm btn-outline-primary" data-edit-project="' + projectEscape(project.id) + '">Edit</button>' +
                '<button class="btn btn-sm btn-outline-danger" data-delete-project="' + projectEscape(project.id) + '">Delete</button></div>';
        } else if (members.includes(student.id)) {
            actionHTML = '<p class="mt-3 mb-2">You are a team member.</p>' +
                '<button class="btn btn-primary btn-sm" data-open-project="' + projectEscape(project.id) + '"><i class="bi bi-folder2-open me-1"></i>Open Project</button>';
        } else if (myRequest) {
            actionHTML = '<p class="mt-3 mb-0">Your request: <strong>' + projectEscape(myRequest.status) + '</strong></p>';
        } else if (places > 0 && project.status !== "Full") {
            actionHTML = '<button class="btn btn-primary btn-sm mt-2" data-join-project="' + projectEscape(project.id) + '">Request to Join</button>';
        } else {
            actionHTML = '<span class="badge text-bg-secondary mt-2">No places available</span>';
        }

        let pendingHTML = "";
        if (owner) {
            let pendingRequests = requests.filter(function(request) {
                return request.projectId === project.id && request.status === "Pending";
            });
            pendingHTML = '<div class="border-top mt-3 pt-3"><h6 class="mb-2">Pending requests (' + pendingRequests.length + ')</h6>';
            if (pendingRequests.length === 0) {
                pendingHTML += '<small class="text-muted">No pending requests.</small>';
            } else {
                pendingRequests.forEach(function(request) {
                    pendingHTML += '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 border rounded p-2 mb-2">' +
                        '<span class="small">' + projectEscape(getStudentName(request.userId)) + '</span>' +
                        '<span class="d-flex gap-1"><button class="btn btn-sm btn-success" data-accept-request="' + projectEscape(request.id) + '">Accept</button>' +
                        '<button class="btn btn-sm btn-outline-danger" data-reject-request="' + projectEscape(request.id) + '">Reject</button></span></div>';
                });
            }
            pendingHTML += '</div>';
        }

        html += '<div class="col-md-6 col-xl-4"><article class="team-up-card">' +
            '<span class="badge text-bg-light">' + projectEscape(category || "Project") + '</span>' +
            '<h5>' + projectEscape(title) + '</h5>' +
            '<p class="team-up-card-description">' + projectEscape(description) + '</p>' +
            '<div class="team-up-card-meta"><span class="team-up-meta-chip"><i class="bi bi-person"></i>' + projectEscape(getStudentName(project.userId)) + '</span>' +
            '<span class="team-up-meta-chip"><i class="bi bi-people"></i>' + members.length + ' member(s)</span>' +
            '<span class="team-up-meta-chip"><i class="bi bi-person-plus"></i>' + places + ' place(s) left</span></div>' +
            (skills ? '<p class="small text-muted mb-2"><strong>Skills:</strong> ' + projectEscape(skills) + '</p>' : '') +
            actionHTML + pendingHTML + '</article></div>';
    });

    document.getElementById("projectsList").innerHTML = html ||
        '<div class="col-12"><div class="team-up-empty"><i class="bi bi-people fs-2 d-block mb-2"></i>No projects match your search.</div></div>';

    // Mettre à jour aussi My Projects et My Join Requests.
    renderMyProjects(projects, requests);
    renderMyRequests(projects, requests);
}

// ==========================================
// MY PROJECTS AND MY JOIN REQUESTS
// ==========================================

// CODE ETUDIE EN COURS
// Ces deux fonctions utilisent seulement : let, if, for, arrays, objects, innerHTML.

function renderMyProjects(projects, requests) {
    let html = "";

    for (let i = 0; i < projects.length; i++) {
        let project = projects[i];

        if (project.userId !== student.id) {
            continue;
        }

        let pendingCount = 0;
        for (let j = 0; j < requests.length; j++) {
            if (requests[j].projectId === project.id && requests[j].status === "Pending") {
                pendingCount++;
            }
        }

        let status = project.status || "Open";
        let badgeClass = status === "Open" ? "text-bg-success" : "text-bg-secondary";

        html += "<tr>" +
            "<td><strong>" + projectEscape(project.title) + "</strong></td>" +
            "<td>" + projectEscape(project.category || "Project") + "</td>" +
            '<td><span class="badge ' + badgeClass + '">' + projectEscape(status) + "</span></td>" +
            "<td>" + getProjectMembers(project).length + "</td>" +
            "<td>" + getProjectPlaces(project) + "</td>" +
            "<td>" + pendingCount + "</td>" +
            "</tr>";
    }

    if (html === "") {
        html = '<tr><td colspan="6" class="text-center text-muted py-4">You have not created any project yet.</td></tr>';
    }

    document.getElementById("myProjectsList").innerHTML = html;
}

function renderMyRequests(projects, requests) {
    let html = "";

    for (let i = 0; i < requests.length; i++) {
        let request = requests[i];

        if (request.userId !== student.id) {
            continue;
        }

        // Chercher le projet lié à cette demande.
        let project = null;
        for (let j = 0; j < projects.length; j++) {
            if (projects[j].id === request.projectId) {
                project = projects[j];
                break;
            }
        }

        let title = "Deleted project";
        let owner = "-";
        if (project !== null) {
            title = project.title;
            owner = getStudentName(project.userId);
        }

        let badgeClass = "text-bg-warning";
        if (request.status === "Accepted") {
            badgeClass = "text-bg-success";
        } else if (request.status === "Rejected") {
            badgeClass = "text-bg-danger";
        }

        html += "<tr>" +
            "<td><strong>" + projectEscape(title) + "</strong></td>" +
            "<td>" + projectEscape(owner) + "</td>" +
            "<td>" + projectEscape(new Date(request.createdAt).toLocaleDateString()) + "</td>" +
            '<td><span class="badge ' + badgeClass + '">' + projectEscape(request.status) + "</span></td>" +
            "</tr>";
    }

    if (html === "") {
        html = '<tr><td colspan="4" class="text-center text-muted py-4">You have not sent any join request yet.</td></tr>';
    }

    document.getElementById("myRequestsList").innerHTML = html;
}

let projectForm = document.getElementById("projectForm");

projectForm.addEventListener("submit", function(event) {
    event.preventDefault();

    let projects = readProjectData(PROJECT_KEYS.PROJECTS);
    let editId = document.getElementById("projectEditId").value;
    let places = Number(document.getElementById("projectPositions").value);

    if (!Number.isInteger(places) || places < 1 || places > 30) {
        showProjectMessage("Enter a number of teammates between 1 and 30.", "danger");
        return;
    }

    let data = {
        title: document.getElementById("projectTitle").value.trim(),
        category: document.getElementById("projectCategory").value,
        description: document.getElementById("projectDescription").value.trim(),
        skills: document.getElementById("projectSkills").value.trim(),
        positions: places,
        userId: student.id,
        updatedAt: new Date().toISOString()
    };

    if (!data.title || !data.category || !data.description) {
        showProjectMessage("Please complete all required fields.", "danger");
        return;
    }

    if (editId) {
        let index = projects.findIndex(function(item) {
            return item.id === editId && item.userId === student.id;
        });
        if (index === -1) return;
        projects[index] = Object.assign({}, projects[index], data);
        projects[index].status = places > 0 ? "Open" : "Full";
        projects[index].placesCounted = true;
        showProjectMessage("Project updated.");
    } else {
        data.id = projectId();
        data.members = [student.id];
        data.status = "Open";
        data.placesCounted = true;
        data.createdAt = new Date().toISOString();
        projects.unshift(data);
        showProjectMessage("Your project has been published.");
    }

    saveProjectData(PROJECT_KEYS.PROJECTS, projects);
    if (typeof addLog === "function") addLog("Team Up", "Project created or updated");
    projectForm.reset();
    document.getElementById("projectEditId").value = "";
    document.getElementById("projectSubmit").innerHTML = '<i class="bi bi-plus-lg me-1"></i> Publish Project';
    renderTeamProjects();
});

document.getElementById("cancelProjectEdit").addEventListener("click", function() {
    document.getElementById("projectEditId").value = "";
    document.getElementById("projectSubmit").innerHTML = '<i class="bi bi-plus-lg me-1"></i> Publish Project';
});

document.getElementById("projectsList").addEventListener("click", function(event) {
    let editButton = event.target.closest("[data-edit-project]");
    let deleteButton = event.target.closest("[data-delete-project]");
    let joinButton = event.target.closest("[data-join-project]");
    let acceptButton = event.target.closest("[data-accept-request]");
    let rejectButton = event.target.closest("[data-reject-request]");
    let openButton = event.target.closest("[data-open-project]");
    let projects = readProjectData(PROJECT_KEYS.PROJECTS);
    let requests = readProjectData(PROJECT_KEYS.REQUESTS);

    if (openButton) {
        let project = projects.find(function(item) {
            return item.id === openButton.dataset.openProject &&
                getProjectMembers(item).includes(student.id);
        });
        if (!project) return;
        openedProjectId = project.id;
        renderProjectRoom();
        document.getElementById("projectRoom").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    if (editButton) {
        let project = projects.find(function(item) {
            return item.id === editButton.dataset.editProject && item.userId === student.id;
        });
        if (!project) return;
        document.getElementById("projectEditId").value = project.id;
        document.getElementById("projectTitle").value = project.title || "";
        document.getElementById("projectCategory").value = project.category || "";
        document.getElementById("projectDescription").value = project.description || "";
        document.getElementById("projectSkills").value = project.skills || "";
        document.getElementById("projectPositions").value = getProjectPlaces(project);
        document.getElementById("projectSubmit").textContent = "Save Changes";
        document.getElementById("createProject").scrollIntoView({ behavior: "smooth" });
        return;
    }

    if (deleteButton) {
        if (!confirm("Delete this project and its join requests?")) return;
        let id = deleteButton.dataset.deleteProject;
        projects = projects.filter(function(item) {
            return !(item.id === id && item.userId === student.id);
        });
        requests = requests.filter(function(item) {
            return item.projectId !== id;
        });
        saveProjectData(PROJECT_KEYS.PROJECTS, projects);
        saveProjectData(PROJECT_KEYS.REQUESTS, requests);
        showProjectMessage("Project deleted.");
        renderTeamProjects();
        return;
    }

    if (joinButton) {
        let id = joinButton.dataset.joinProject;
        let project = projects.find(function(item) { return item.id === id; });
        if (!project || project.userId === student.id || getProjectPlaces(project) < 1 || project.status === "Full") {
            showProjectMessage("This project is no longer accepting requests.", "warning");
            renderTeamProjects();
            return;
        }
        let existing = requests.find(function(item) {
            return item.projectId === id && item.userId === student.id &&
                (item.status === "Pending" || item.status === "Accepted");
        });
        if (existing) {
            showProjectMessage("You already have an active request for this project.", "warning");
            return;
        }
        requests.push({
            id: projectId(),
            projectId: id,
            userId: student.id,
            status: "Pending",
            createdAt: new Date().toISOString()
        });
        saveProjectData(PROJECT_KEYS.REQUESTS, requests);
        showProjectMessage("Your join request has been sent to the project owner.");
        renderTeamProjects();
        return;
    }

    if (acceptButton || rejectButton) {
        let requestId = acceptButton ? acceptButton.dataset.acceptRequest : rejectButton.dataset.rejectRequest;
        let request = requests.find(function(item) { return item.id === requestId; });
        if (!request || request.status !== "Pending") return;
        let project = projects.find(function(item) { return item.id === request.projectId; });
        if (!project || project.userId !== student.id) return;

        if (acceptButton) {
            let members = getProjectMembers(project);
            if (members.includes(request.userId)) {
                request.status = "Accepted";
            } else if (getProjectPlaces(project) > 0 && project.status !== "Full") {
                members.push(request.userId);
                project.members = members;
                project.positions = getProjectPlaces(project) - 1;
                project.status = project.positions > 0 ? "Open" : "Full";
                request.status = "Accepted";
                showProjectMessage("Student accepted. One available place has been used.");
            } else {
                showProjectMessage("The project is full. This request cannot be accepted.", "danger");
                return;
            }
        } else {
            request.status = "Rejected";
            showProjectMessage("Join request rejected.");
        }
    }

    saveProjectData(PROJECT_KEYS.PROJECTS, projects);
    saveProjectData(PROJECT_KEYS.REQUESTS, requests);
    renderTeamProjects();
});

// The project owner creates tasks and assigns them to current team members.
document.getElementById("projectsList").addEventListener("submit", function(event) {
    let form = event.target.closest("[data-create-task]");
    if (!form) return;
    event.preventDefault();

    let projectIdValue = form.dataset.createTask;
    let projects = readProjectData(PROJECT_KEYS.PROJECTS);
    let project = projects.find(function(item) {
        return item.id === projectIdValue && item.userId === student.id;
    });
    if (!project) return;

    let members = getProjectMembers(project);
    let formData = new FormData(form);
    let title = String(formData.get("taskTitle") || "").trim();
    let description = String(formData.get("taskDescription") || "").trim();
    let assignedTo = String(formData.get("assignedTo") || "");

    if (!title || !members.includes(assignedTo)) {
        showProjectMessage("Choose a valid team member and enter a task title.", "danger");
        return;
    }

    if (!Array.isArray(project.tasks)) project.tasks = [];
    project.tasks.push({
        id: projectId(),
        title: title,
        description: description,
        assignedTo: assignedTo,
        status: "To Do",
        createdBy: student.id,
        createdAt: new Date().toISOString()
    });

    saveProjectData(PROJECT_KEYS.PROJECTS, projects);
    showProjectMessage("Task assigned successfully.");
    renderTeamProjects();
});

// A student can update the status only of a task assigned to that student.
document.getElementById("projectsList").addEventListener("change", function(event) {
    let select = event.target.closest("[data-task-status]");
    if (!select) return;

    let allowedStatuses = ["To Do", "In Progress", "Completed"];
    if (!allowedStatuses.includes(select.value)) return;

    let projects = readProjectData(PROJECT_KEYS.PROJECTS);
    let changed = false;

    projects.forEach(function(project) {
        if (!getProjectMembers(project).includes(student.id)) return;
        getProjectTasks(project).forEach(function(task) {
            if (task.id === select.dataset.taskStatus && task.assignedTo === student.id) {
                task.status = select.value;
                task.updatedAt = new Date().toISOString();
                changed = true;
            }
        });
    });

    if (changed) {
        saveProjectData(PROJECT_KEYS.PROJECTS, projects);
        showProjectMessage("Your task status has been updated.");
        renderTeamProjects();
    }
});

document.getElementById("projectRoom").addEventListener("click", function(event) {
    if (event.target.closest("#closeProjectRoom")) {
        openedProjectId = null;
        renderProjectRoom();
    }
});

document.getElementById("projectRoom").addEventListener("submit", function(event) {
    if (event.target.id === "projectDiscussionForm") {
        event.preventDefault();
        let text = document.getElementById("projectDiscussionText").value.trim();
        if (!text || !openedProjectId) return;

        let projects = readProjectData(PROJECT_KEYS.PROJECTS);
        let project = projects.find(function(item) {
            return item.id === openedProjectId && getProjectMembers(item).includes(student.id);
        });
        if (!project) return;

        if (!Array.isArray(project.discussion)) project.discussion = [];
        project.discussion.push({
            id: projectId(),
            userId: student.id,
            text: text,
            createdAt: new Date().toISOString()
        });
        saveProjectData(PROJECT_KEYS.PROJECTS, projects);
        renderProjectRoom();
        return;
    }

    if (event.target.id === "projectRoomTaskForm") {
        event.preventDefault();
        if (!openedProjectId) return;

        let projects = readProjectData(PROJECT_KEYS.PROJECTS);
        let project = projects.find(function(item) {
            return item.id === openedProjectId && item.userId === student.id;
        });
        if (!project) return;

        let formData = new FormData(event.target);
        let title = String(formData.get("taskTitle") || "").trim();
        let description = String(formData.get("taskDescription") || "").trim();
        let assignedTo = String(formData.get("assignedTo") || "");
        if (!title || !getProjectMembers(project).includes(assignedTo)) return;

        if (!Array.isArray(project.tasks)) project.tasks = [];
        project.tasks.push({
            id: projectId(),
            title: title,
            description: description,
            assignedTo: assignedTo,
            status: "To Do",
            createdBy: student.id,
            createdAt: new Date().toISOString()
        });
        saveProjectData(PROJECT_KEYS.PROJECTS, projects);
        renderProjectRoom();
        return;
    }
});

document.getElementById("projectRoom").addEventListener("change", function(event) {
    let select = event.target.closest("[data-room-task-status]");
    if (!select || !openedProjectId) return;

    let allowedStatuses = ["To Do", "In Progress", "Completed"];
    if (!allowedStatuses.includes(select.value)) return;

    let projects = readProjectData(PROJECT_KEYS.PROJECTS);
    let project = projects.find(function(item) {
        return item.id === openedProjectId && getProjectMembers(item).includes(student.id);
    });
    if (!project) return;

    let task = getProjectTasks(project).find(function(item) {
        return item.id === select.dataset.roomTaskStatus && item.assignedTo === student.id;
    });
    if (!task) return;

    task.status = select.value;
    task.updatedAt = new Date().toISOString();
    saveProjectData(PROJECT_KEYS.PROJECTS, projects);
    renderProjectRoom();
});

document.getElementById("projectSearch").addEventListener("input", renderTeamProjects);
renderTeamProjects();
})();
}
