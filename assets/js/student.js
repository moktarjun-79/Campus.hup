
if (document.getElementById("dashboardUserName")) {
    (function () {
// ==========================================
// 1. CHECK STUDENT SESSION
// ==========================================

let loggedUser = currentUser();

if (loggedUser === null || loggedUser.role !== "student") {
  window.location.href = "../login.html";
} else {
  // ==========================================
  // 2. DISPLAY STUDENT NAME
  // ==========================================

  let fullName =
    (loggedUser.firstName || "") + " " + (loggedUser.lastName || "");

  fullName = fullName.trim();

  if (fullName === "") {
    fullName = loggedUser.matricule;
  }

  document.getElementById("dashboardUserName").textContent = fullName;

  document.getElementById("welcomeTitle").textContent =
    "Welcome, " + fullName + "!";

  // ==========================================
  // 3. LOAD SHARED DATA
  // ==========================================

  let resources = getData(KEYS.RESOURCES);
  let events = getData(KEYS.EVENTS);
  let posts = getData(KEYS.POSTS);
  let logs = getData(KEYS.ACTIVITY_LOGS);

  // ==========================================
  // 4. CALCULATE DASHBOARD STATISTICS
  // ==========================================

  let upcomingEventsList = [];

  for (let i = 0; i < events.length; i++) {
    if (events[i].date >= today()) {
      upcomingEventsList.push(events[i]);
    }
  }

  document.getElementById("resourcesCount").textContent = resources.length;
  document.getElementById("eventsCount").textContent =
    upcomingEventsList.length;
  document.getElementById("postsCount").textContent = posts.length;

  // ==========================================
  // 5. RECENT ACTIVITY
  // ==========================================

  let activityContainer = document.getElementById("recentActivity");
  let myLogs = [];

  for (let i = 0; i < logs.length; i++) {
    if (logs[i].matricule === loggedUser.matricule) {
      myLogs.push(logs[i]);
    }
  }

  if (myLogs.length === 0) {
    activityContainer.innerHTML =
      '<p class="dashboard-empty">No activity yet.</p>';
  } else {
    let activityHTML = "";

    for (let i = 0; i < myLogs.length && i < 5; i++) {
      activityHTML +=
        '<div class="dashboard-list-item">' +
        "<h4>" +
        escapeHTML(myLogs[i].action) +
        "</h4>" +
        "<p>" +
        escapeHTML(myLogs[i].details) +
        "</p>" +
        "<p>" +
        escapeHTML(new Date(myLogs[i].date).toLocaleString()) +
        "</p>" +
        "</div>";
    }

    activityContainer.innerHTML = activityHTML;
  }

  // ==========================================
  // 6. UPCOMING EVENTS
  // ==========================================

  let eventsContainer = document.getElementById("upcomingEvents");

  upcomingEventsList.sort(function (a, b) {
    return a.date.localeCompare(b.date);
  });

  if (upcomingEventsList.length === 0) {
    eventsContainer.innerHTML =
      '<p class="dashboard-empty">No upcoming events.</p>';
  } else {
    let eventsHTML = "";

    for (let i = 0; i < upcomingEventsList.length && i < 5; i++) {
      eventsHTML +=
        '<div class="dashboard-list-item">' +
        "<h4>" +
        escapeHTML(upcomingEventsList[i].title || "Untitled event") +
        "</h4>" +
        "<p>" +
        escapeHTML(upcomingEventsList[i].date || "") +
        "</p>" +
        "<p>" +
        escapeHTML(upcomingEventsList[i].description || "") +
        "</p>" +
        "</div>";
    }

    eventsContainer.innerHTML = eventsHTML;
  }

  // ==========================================
  // 7. LATEST RESOURCES
  // ==========================================

  let resourcesContainer = document.getElementById("latestResources");

  let sortedResources = resources.slice();

  sortedResources.sort(function (a, b) {
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });

  if (sortedResources.length === 0) {
    resourcesContainer.innerHTML =
      '<p class="dashboard-empty">No resources available.</p>';
  } else {
    let resourcesHTML = "";

    for (let i = 0; i < sortedResources.length && i < 5; i++) {
      resourcesHTML +=
        '<div class="dashboard-list-item">' +
        "<h4>" +
        escapeHTML(sortedResources[i].title || "Untitled resource") +
        "</h4>" +
        "<p>" +
        escapeHTML(
          sortedResources[i].subject ||
            sortedResources[i].category ||
            "Academic resource",
        ) +
        "</p>" +
        "</div>";
    }

    resourcesContainer.innerHTML = resourcesHTML;
  }

  // ==========================================
  // 8. COMMUNITY UPDATES
  // ==========================================

  let communityContainer = document.getElementById("communityUpdates");

  let sortedPosts = posts.slice();

  sortedPosts.sort(function (a, b) {
    return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
  });

  if (sortedPosts.length === 0) {
    communityContainer.innerHTML =
      '<p class="dashboard-empty">No community posts yet.</p>';
  } else {
    let postsHTML = "";

    for (let i = 0; i < sortedPosts.length && i < 5; i++) {
      postsHTML +=
        '<div class="dashboard-list-item">' +
        "<h4>" +
        escapeHTML(
          sortedPosts[i].title || sortedPosts[i].authorName || "Community post",
        ) +
        "</h4>" +
        "<p>" +
        escapeHTML(sortedPosts[i].content || sortedPosts[i].description || "") +
        "</p>" +
        "</div>";
    }

    communityContainer.innerHTML = postsHTML;
  }
}
    })();
}



// ==========================================
if (document.getElementById("eventsList")) {
    (function () {

let eventStudent = currentUser();

if (eventStudent === null || eventStudent.role !== "student") {
  window.location.href = "../login.html";
} else {
  // ==========================================
  // 2. DISPLAY STUDENT NAME
  // ==========================================

  let eventStudentName =
    (eventStudent.firstName || "") + " " + (eventStudent.lastName || "");

  eventStudentName = eventStudentName.trim();

  if (eventStudentName === "") {
    eventStudentName = eventStudent.matricule;
  }

  document.getElementById("studentName").textContent = eventStudentName;

  // ==========================================
  // 3. LOGOUT
  // ==========================================

  document.getElementById("logoutBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      addLog("Logout", "Student logged out: " + eventStudent.matricule);

      logoutUser();
    }
  });

  // ==========================================
  // 4. GET HTML ELEMENTS
  // ==========================================

  let eventsList = document.getElementById("eventsList");

  let eventSearch = document.getElementById("eventSearch");

  let eventFilter = document.getElementById("eventFilter");

  // ==========================================
  // 5. DISPLAY MESSAGE
  // ==========================================

  function showEventMessage(message, type) {
    document.getElementById("eventMessage").innerHTML =
      '<div class="alert alert-' + type + '">' + escapeHTML(message) + "</div>";
  }

  // ==========================================
  // 6. CHECK REGISTRATION
  // ==========================================

  function isRegistered(eventId) {
  
    for (let i = 0; i < registrations.length; i++) {
      if (
        registrations[i].eventId === eventId &&
        registrations[i].userId === eventStudent.id
      ) {
        return true;
      }
    }

    return false;
  }

  // ==========================================
  // 7. UPDATE STATISTICS
  // ==========================================

  function updateEventStatistics() {
    let events = getData(KEYS.EVENTS);

  
    let todayDate = today();

    let availableCount = events.length;

    let upcomingCount = 0;

    for (let i = 0; i < events.length; i++) {
      let eventDate = events[i].date || events[i].eventDate || "";

      if (eventDate >= todayDate) {
        upcomingCount++;
      }
    }


    document.getElementById("availableEventsCount").textContent =
      availableCount;

    document.getElementById("upcomingEventsCount").textContent = upcomingCount;
  }

  // ==========================================
  // 8. DISPLAY EVENTS
  // ==========================================

  function renderEvents() {
    let events = getData(KEYS.EVENTS);

    let searchValue = eventSearch.value.toLowerCase().trim();

    let filterValue = eventFilter.value;

    let todayDate = today();

    let html = "";

    let displayedCount = 0;

    for (let i = 0; i < events.length; i++) {
      let item = events[i];

      let eventDate = item.date || item.eventDate || "";

      let registered = isRegistered(item.id);

      let matchesSearch =
        (item.title || "").toLowerCase().includes(searchValue) ||
        (item.description || "").toLowerCase().includes(searchValue) ||
        (item.location || "").toLowerCase().includes(searchValue);

      let matchesFilter = true;

      if (filterValue === "upcoming") {
        matchesFilter = eventDate >= todayDate;
      }

      if (filterValue === "past") {
        matchesFilter = eventDate < todayDate;
      }

      if (filterValue === "registered") {
        matchesFilter = registered;
      }

      if (matchesSearch && matchesFilter) {
        displayedCount++;

        html +=
          '<div class="col-md-6 col-xl-4">' +
          '<div class="service-item">' +
          '<div class="mb-3 text-primary fs-2">' +
          '<i class="bi bi-calendar2-event"></i>' +
          "</div>" +
          "<h5>" +
          escapeHTML(item.title || "Untitled Event") +
          "</h5>" +
          "<p>" +
          escapeHTML(item.description || "No description available.") +
          "</p>" +
          "<p>" +
          '<i class="bi bi-calendar me-2"></i>' +
          escapeHTML(eventDate || "Date not specified") +
          "</p>" +
          "<p>" +
          '<i class="bi bi-geo-alt me-2"></i>' +
          escapeHTML(item.location || "Location not specified") +
          "</p>" +
          '<div class="service-item-actions">' +
          (registered
            ? '<button class="btn btn-outline-danger btn-sm"' +
              ' data-cancel-event="' +
              escapeHTML(item.id) +
              '">' +
              "Cancel Registration" +
              "</button>"
            : '<button class="btn btn-primary btn-sm"' +
              ' data-register-event="' +
              escapeHTML(item.id) +
              '"' +
              (eventDate < todayDate ? " disabled" : "") +
              ">" +
              "Register Now" +
              "</button>") +
          "</div>" +
          "</div>" +
          "</div>";
      }
    }

    if (displayedCount === 0) {
      eventsList.innerHTML =
        '<div class="col-12">' +
        '<div class="empty-state">' +
        "No events found." +
        "</div>" +
        "</div>";
    } else {
      eventsList.innerHTML = html;
    }
  }

  // ==========================================
  // 9. REGISTER AND CANCEL
  // ==========================================

  eventsList.addEventListener("click", function (event) {
    let registerButton = event.target.closest("[data-register-event]");

    let cancelButton = event.target.closest("[data-cancel-event]");

  
    // REGISTER

    if (registerButton !== null) {
      let eventId = registerButton.dataset.registerEvent;

      let events = getData(KEYS.EVENTS);

      let selectedEvent = null;

      for (let i = 0; i < events.length; i++) {
        if (events[i].id === eventId) {
          selectedEvent = events[i];

          break;
        }
      }

      if (selectedEvent === null) {
        return;
      }

      if ((selectedEvent.date || selectedEvent.eventDate || "") < today()) {
        showEventMessage("Registration is closed for this event.", "warning");

        return;
      }

      if (isRegistered(eventId)) {
        showEventMessage(
          "You are already registered for this event.",
          "warning",
        );

        return;
      }

      registrations.push({
        id: makeId(),

        eventId: eventId,

        userId: eventStudent.id,

        date: new Date().toISOString(),
      });

      saveData(KEYS.REGISTRATIONS, registrations);

      addLog("Event Registration", "Registered for: " + selectedEvent.title);

      showEventMessage("Registration completed successfully.", "success");
    }

    // CANCEL REGISTRATION

    if (cancelButton !== null) {
      if (!confirm("Are you sure you want to cancel your registration?")) {
        return;
      }

      let eventId = cancelButton.dataset.cancelEvent;

      let updatedRegistrations = [];

      for (let i = 0; i < registrations.length; i++) {
        if (
          !(
            registrations[i].eventId === eventId &&
            registrations[i].userId === eventStudent.id
          )
        ) {
          updatedRegistrations.push(registrations[i]);
        }
      }

      saveData(KEYS.REGISTRATIONS, updatedRegistrations);

      addLog(
        "Registration Cancelled",
        "Cancelled event registration: " + eventId,
      );

      showEventMessage("Your registration has been cancelled.", "success");
    }

    renderEvents();

    updateEventStatistics();
  });

  // ==========================================
  // 10. SEARCH AND FILTER
  // ==========================================

  eventSearch.addEventListener("input", function () {
    renderEvents();
  });

  eventFilter.addEventListener("change", function () {
    renderEvents();
  });

  // ==========================================
  // 11. INITIAL DISPLAY
  // ==========================================

  renderEvents();

  updateEventStatistics();
}
    })();
}



if (document.getElementById("studentLostForm")) {
    (function () {

let lostStudent = currentUser();

if (lostStudent === null || lostStudent.role !== "student") {
  window.location.href = "../login.html";
} else {
  // 2. DISPLAY STUDENT NAME

  let lostStudentName =
    (lostStudent.firstName || "") + " " + (lostStudent.lastName || "");

  lostStudentName = lostStudentName.trim();

  if (lostStudentName === "") {
    lostStudentName = lostStudent.matricule;
  }

  document.getElementById("studentName").textContent = lostStudentName;

  // 3. LOGOUT

  document.getElementById("logoutBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      addLog("Logout", "Student logged out: " + lostStudent.matricule);
      logoutUser();
    }
  });

  // 4. GET HTML ELEMENTS

  let lostStudentForm = document.getElementById("studentLostForm");
  let lostStudentList = document.getElementById("studentLostList");
  let lostStudentSearch = document.getElementById("studentLostSearch");
  let lostStudentFilter = document.getElementById("studentLostFilter");

  // 5. DISPLAY MESSAGE

  function showLostStudentMessage(message, type) {
    document.getElementById("lostStudentMessage").innerHTML =
      '<div class="alert alert-' +
      type +
      ' alert-dismissible fade show">' +
      escapeHTML(message) +
      '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
      "</div>";
  }

  // 6. GET STUDENT NAME FROM USER ID

  function getLostAuthorName(userId) {
    let users = getData(KEYS.USERS);

    for (let i = 0; i < users.length; i++) {
      if (users[i].id === userId) {
        let fullName =
          (users[i].firstName || "") + " " + (users[i].lastName || "");

        fullName = fullName.trim();

        return fullName || users[i].matricule || "Student";
      }
    }

    return userId === lostStudent.id ? lostStudentName : "Student";
  }

  // ==========================================
  // 6.1 GET COMPLETE STUDENT INFORMATION
  // ==========================================

  function getLostStudent(userId) {
    let users = getData(KEYS.USERS);

    for (let i = 0; i < users.length; i++) {
      if (users[i].id === userId) {
        return users[i];
      }
    }

    return null;
  }

  // 7. UPDATE STATISTICS

  function updateLostStudentStatistics() {
    let items = getData(KEYS.LOST_FOUND);
    let lostCount = 0;
    let foundCount = 0;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type === "Lost") lostCount++;
      if (items[i].type === "Found") foundCount++;
    }

    document.getElementById("studentLostTotal").textContent = items.length;
    document.getElementById("studentLostCount").textContent = lostCount;
    document.getElementById("studentFoundCount").textContent = foundCount;
  }

  // 8. DISPLAY ANNOUNCEMENTS

  function renderLostStudentAnnouncements() {
    let items = getData(KEYS.LOST_FOUND);
    let searchValue = lostStudentSearch.value.toLowerCase().trim();
    let selectedType = lostStudentFilter.value;
    let html = "";
    let displayedCount = 0;

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let title = String(item.title || "").toLowerCase();
      let category = String(item.category || "").toLowerCase();
      let location = String(item.location || "").toLowerCase();
      let description = String(item.description || "").toLowerCase();
      let author = getLostAuthorName(item.userId).toLowerCase();

      let searchMatches =
        title.includes(searchValue) ||
        category.includes(searchValue) ||
        location.includes(searchValue) ||
        description.includes(searchValue) ||
        author.includes(searchValue);

      let typeMatches = selectedType === "" || item.type === selectedType;

      if (searchMatches && typeMatches) {
        displayedCount++;

        let itemStatus = item.status || "Open";
        let typeClass = item.type === "Found" ? "found" : "lost";
        let statusClass = itemStatus === "Resolved" ? "resolved" : "open";
        let date = "Date not specified";

        if (item.createdAt) {
          let itemDate = new Date(item.createdAt);
          if (!isNaN(itemDate.getTime())) {
            date = itemDate.toLocaleDateString();
          }
        }

        let ownerActions = "";

        if (item.userId === lostStudent.id) {
          ownerActions =
            '<div class="lost-student-actions">' +
            (itemStatus === "Open"
              ? '<button type="button" class="btn btn-sm btn-outline-success" data-lost-resolve="' +
                escapeHTML(item.id) +
                '">Mark Resolved</button>'
              : '<button type="button" class="btn btn-sm btn-outline-secondary" data-lost-reopen="' +
                escapeHTML(item.id) +
                '">Reopen</button>') +
            '<button type="button" class="btn btn-sm btn-outline-primary" data-lost-edit="' +
            escapeHTML(item.id) +
            '">Edit</button>' +
            '<button type="button" class="btn btn-sm btn-outline-danger" data-lost-delete="' +
            escapeHTML(item.id) +
            '">Delete</button>' +
            "</div>";
        }

        html +=
          '<div class="col-md-6 col-xl-4">' +
          '<article class="service-item lost-student-card">' +
          '<div class="d-flex justify-content-between align-items-center gap-2 mb-3">' +
          '<span class="lost-type-badge ' +
          typeClass +
          '">' +
          escapeHTML(item.type || "Unknown") +
          "</span>" +
          '<span class="lost-status-badge ' +
          statusClass +
          '">' +
          escapeHTML(itemStatus) +
          "</span>" +
          "</div>" +
          "<h5>" +
          escapeHTML(item.title || "Untitled") +
          "</h5>" +
          '<p class="lost-student-description">' +
          escapeHTML(item.description || "No description provided.") +
          "</p>" +
          '<div class="lost-student-details">' +
          '<p><i class="bi bi-tag"></i> ' +
          escapeHTML(item.category || "Not specified") +
          "</p>" +
          '<p><i class="bi bi-geo-alt"></i> ' +
          escapeHTML(item.location || "Not specified") +
          "</p>" +
          '<p><i class="bi bi-person"></i> ' +
          escapeHTML(getLostAuthorName(item.userId)) +
          "</p>" +
          '<p><i class="bi bi-calendar3"></i> ' +
          escapeHTML(date) +
          "</p>" +
          "</div>" +
          ownerActions +
          "</article>" +
          "</div>";
      }
    }

    if (displayedCount === 0) {
      html =
        '<div class="col-12"><div class="empty-state">No announcements found.</div></div>';
    }

    lostStudentList.innerHTML = html;
    document.getElementById("studentLostDisplayed").textContent =
      displayedCount + " Announcements";
    updateLostStudentStatistics();
  }

  // 9. CREATE OR UPDATE ANNOUNCEMENT

  lostStudentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let items = getData(KEYS.LOST_FOUND);
    let editId = document.getElementById("studentLostEditId").value;

    let announcement = {
      title: document.getElementById("studentLostTitle").value.trim(),
      type: document.getElementById("studentLostType").value,
      category: document.getElementById("studentLostCategory").value.trim(),
      location: document.getElementById("studentLostLocation").value.trim(),
      description: document
        .getElementById("studentLostDescription")
        .value.trim(),
      userId: lostStudent.id,
      updatedAt: new Date().toISOString(),
    };

    if (
      announcement.title === "" ||
      announcement.category === "" ||
      announcement.location === ""
    ) {
      showLostStudentMessage("Please complete the required fields.", "warning");
      return;
    }

    if (editId !== "") {
      let selectedItem = null;

      for (let i = 0; i < items.length; i++) {
        if (items[i].id === editId && items[i].userId === lostStudent.id) {
          selectedItem = items[i];
          break;
        }
      }

      if (selectedItem === null) return;

      selectedItem.title = announcement.title;
      selectedItem.type = announcement.type;
      selectedItem.category = announcement.category;
      selectedItem.location = announcement.location;
      selectedItem.description = announcement.description;
      selectedItem.updatedAt = announcement.updatedAt;
    } else {
      announcement.id = makeId();
      announcement.status = "Open";
      announcement.createdAt = new Date().toISOString();
      items.unshift(announcement);
    }

    if (saveData(KEYS.LOST_FOUND, items) === false) {
      showLostStudentMessage(
        "Could not save your announcement. Please try again.",
        "danger",
      );
      return;
    }

    addLog(
      "Lost & Found Announcement",
      "Item: " +
        announcement.title +
        " | Type: " +
        announcement.type +
        " | Student: " +
        lostStudentName +
        " | Matricule: " +
        lostStudent.matricule +
        " | Category: " +
        announcement.category +
        " | Location: " +
        announcement.location +
        " | Description: " +
        announcement.description,
    );
    showLostStudentMessage(
      editId
        ? "Announcement updated successfully."
        : "Announcement published successfully.",
      "success",
    );
    resetLostStudentForm();
    renderLostStudentAnnouncements();
  });

  // 10. RESET FORM

  function resetLostStudentForm() {
    lostStudentForm.reset();
    document.getElementById("studentLostEditId").value = "";
    document.getElementById("lostFormHeading").textContent =
      "Publish an Announcement";
    document.getElementById("studentLostSubmit").innerHTML =
      '<i class="bi bi-plus-circle me-1"></i> Publish Announcement';
    document.getElementById("studentLostCancel").hidden = true;
  }

  document
    .getElementById("studentLostCancel")
    .addEventListener("click", resetLostStudentForm);

  // 11. EDIT, DELETE AND UPDATE STATUS

  lostStudentList.addEventListener("click", function (event) {
    let editButton = event.target.closest("[data-lost-edit]");
    let deleteButton = event.target.closest("[data-lost-delete]");
    let resolveButton = event.target.closest("[data-lost-resolve]");
    let reopenButton = event.target.closest("[data-lost-reopen]");
    let items = getData(KEYS.LOST_FOUND);
    let selectedId = null;

    if (editButton) selectedId = editButton.getAttribute("data-lost-edit");
    if (deleteButton)
      selectedId = deleteButton.getAttribute("data-lost-delete");
    if (resolveButton)
      selectedId = resolveButton.getAttribute("data-lost-resolve");
    if (reopenButton)
      selectedId = reopenButton.getAttribute("data-lost-reopen");

    if (selectedId === null) return;

    let selectedItem = null;

    for (let i = 0; i < items.length; i++) {
      if (items[i].id === selectedId && items[i].userId === lostStudent.id) {
        selectedItem = items[i];
        break;
      }
    }

    if (selectedItem === null) return;

    if (editButton) {
      document.getElementById("studentLostEditId").value = selectedItem.id;
      document.getElementById("studentLostTitle").value =
        selectedItem.title || "";
      document.getElementById("studentLostType").value =
        selectedItem.type || "Lost";
      document.getElementById("studentLostCategory").value =
        selectedItem.category || "";
      document.getElementById("studentLostLocation").value =
        selectedItem.location || "";
      document.getElementById("studentLostDescription").value =
        selectedItem.description || "";
      document.getElementById("lostFormHeading").textContent =
        "Edit Your Announcement";
      document.getElementById("studentLostSubmit").innerHTML =
        '<i class="bi bi-check-circle me-1"></i> Save Changes';
      document.getElementById("studentLostCancel").hidden = false;
      lostStudentForm.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (deleteButton) {
      if (!confirm("Are you sure you want to delete this announcement?"))
        return;

      let updatedItems = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].id !== selectedId || items[i].userId !== lostStudent.id) {
          updatedItems.push(items[i]);
        }
      }
      items = updatedItems;
    }

    if (resolveButton) selectedItem.status = "Resolved";
    if (reopenButton) selectedItem.status = "Open";

    if (deleteButton || resolveButton || reopenButton) {
      if (saveData(KEYS.LOST_FOUND, items) === false) {
        showLostStudentMessage("Could not update the announcement.", "danger");
        return;
      }

      addLog(
        "Lost & Found Announcement Updated",
        selectedItem.title || "Announcement",
      );
      showLostStudentMessage(
        deleteButton ? "Announcement deleted." : "Announcement updated.",
        "success",
      );
      renderLostStudentAnnouncements();
    }
  });

  // 12. SEARCH AND FILTER

  lostStudentSearch.addEventListener("input", renderLostStudentAnnouncements);
  lostStudentFilter.addEventListener("change", renderLostStudentAnnouncements);

  // 13. INITIAL DISPLAY

  renderLostStudentAnnouncements();
}
    })();
}



if (document.getElementById("resourceForm")) {
    (function () {
// ==========================================
// 1. CHECK STUDENT SESSION
// ==========================================

let resourceStudent = currentUser();

if (resourceStudent === null || resourceStudent.role !== "student") {
  window.location.href = "../login.html";
} else {
  // ==========================================
  // 2. GET HTML ELEMENTS
  // ==========================================

  let resourceForm = document.getElementById("resourceForm");

  let resourcesList = document.getElementById("resourcesList");

  let resourceSearch = document.getElementById("resourceSearch");

  let resourceFilter = document.getElementById("resourceFilter");

  let resourceTotal = document.getElementById("resourceTotal");

  // ==========================================
  // 3. DISPLAY STUDENT NAME
  // ==========================================

  let resourceStudentName =
    (resourceStudent.firstName || "") + " " + (resourceStudent.lastName || "");

  resourceStudentName = resourceStudentName.trim();

  if (resourceStudentName === "") {
    resourceStudentName = resourceStudent.matricule;
  }

  document.getElementById("studentName").textContent = resourceStudentName;

  // ==========================================
  // 4. LOGOUT
  // ==========================================

  document.getElementById("logoutBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      addLog("Logout", "Student logged out: " + resourceStudent.matricule);

      logoutUser();
    }
  });

  // ==========================================
  // 5. DISPLAY MESSAGES
  // ==========================================

  function showResourceMessage(message, type) {
    let messageBox = document.getElementById("resourceMessage");

    messageBox.innerHTML =
      '<div class="alert alert-' +
      type +
      ' alert-dismissible fade show">' +
      escapeResourceHTML(message) +
      '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
      "</div>";
  }

  // ==========================================
  // 6. HTML PROTECTION
  // ==========================================


  function escapeResourceHTML(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[character];
    });
  }

  // ==========================================
  // 7. LOAD RESOURCES
  // ==========================================

  function renderResources() {
    let resources = getData(KEYS.RESOURCES);

    let searchValue = resourceSearch.value.toLowerCase().trim();

    let selectedCategory = resourceFilter.value;

    let filteredResources = [];

    // SEARCH AND FILTER

    for (let i = 0; i < resources.length; i++) {
      let title = String(resources[i].title || "").toLowerCase();

      let subject = String(resources[i].subject || "").toLowerCase();

      let description = String(resources[i].description || "").toLowerCase();

      let matchesSearch =
        title.includes(searchValue) ||
        subject.includes(searchValue) ||
        description.includes(searchValue);

      let matchesCategory =
        selectedCategory === "" || resources[i].category === selectedCategory;

      if (matchesSearch && matchesCategory) {
        filteredResources.push(resources[i]);
      }
    }

    // DISPLAY TOTAL

    resourceTotal.textContent = filteredResources.length + " Resources";

    // DISPLAY EMPTY MESSAGE

    if (filteredResources.length === 0) {
      resourcesList.innerHTML =
        '<div class="col-12">' +
        '<div class="empty-state">' +
        "No resources found." +
        "</div>" +
        "</div>";

      return;
    }

    // BUILD HTML

    let resourcesHTML = "";

    for (let i = 0; i < filteredResources.length; i++) {
      let item = filteredResources[i];

      let isOwner = item.userId === resourceStudent.id;

      let authorName = "Student";

      let users = getData(KEYS.USERS);

      for (let j = 0; j < users.length; j++) {
        if (users[j].id === item.userId) {
          authorName =
            (users[j].firstName || "") + " " + (users[j].lastName || "");

          break;
        }
      }

      if (authorName.trim() === "") {
        authorName = "Student";
      }

      resourcesHTML +=
        '<div class="col-md-6 col-xl-4 mb-3">' +
        '<div class="resource-item">' +
        '<div class="resource-item-icon">' +
        '<i class="bi bi-file-earmark-text"></i>' +
        "</div>" +
        '<span class="resource-category">' +
        escapeResourceHTML(item.category || "Resource") +
        "</span>" +
        "<h5>" +
        escapeResourceHTML(item.title || "Untitled Resource") +
        "</h5>" +
        "<p>" +
        escapeResourceHTML(item.subject || "") +
        "</p>" +
        '<p class="resource-description">' +
        escapeResourceHTML(item.description || "No description provided.") +
        "</p>" +
        '<div class="resource-meta">' +
        "Academic Year: " +
        escapeResourceHTML(item.year || "Not specified") +
        "</div>" +
        '<div class="resource-meta">' +
        "By: " +
        escapeResourceHTML(authorName) +
        "</div>" +
        '<div class="resource-actions">' +
        '<a href="' +
        escapeResourceHTML(item.url) +
        '"' +
        ' target="_blank"' +
        ' rel="noopener noreferrer"' +
        ' class="btn btn-sm btn-primary">' +
        '<i class="bi bi-box-arrow-up-right me-1"></i>' +
        "Open Resource" +
        "</a>" +
        (isOwner
          ? '<button class="btn btn-sm btn-outline-primary"' +
            ' data-edit-resource="' +
            escapeResourceHTML(item.id) +
            '">' +
            "Edit" +
            "</button>" +
            '<button class="btn btn-sm btn-outline-danger"' +
            ' data-delete-resource="' +
            escapeResourceHTML(item.id) +
            '">' +
            "Delete" +
            "</button>"
          : "") +
        "</div>" +
        "</div>" +
        "</div>";
    }

    resourcesList.innerHTML = resourcesHTML;
  }

  // ==========================================
  // 8. ADD OR UPDATE RESOURCE
  // ==========================================

  resourceForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let resources = getData(KEYS.RESOURCES);

    let editId = document.getElementById("resourceEditId").value;

    let title = document.getElementById("resourceTitle").value.trim();

    let subject = document.getElementById("resourceSubject").value.trim();

    let category = document.getElementById("resourceCategory").value;

    let year = document.getElementById("resourceYear").value.trim();

    let url = document.getElementById("resourceUrl").value.trim();

    let description = document
      .getElementById("resourceDescription")
      .value.trim();

    if (title === "" || subject === "" || category === "" || url === "") {
      showResourceMessage("Please complete all required fields.", "danger");

      return;
    }

    // URL VALIDATION

    if (!url.startsWith("https://") && !url.startsWith("http://")) {
      showResourceMessage("Please enter a valid HTTP or HTTPS link.", "danger");

      return;
    }

    let resourceData = {
      title: title,
      subject: subject,
      category: category,
      year: year,
      url: url,
      description: description,
      userId: resourceStudent.id,
      updatedAt: new Date().toISOString(),
    };

    // UPDATE EXISTING RESOURCE

    if (editId !== "") {
      let resourceFound = false;

      for (let i = 0; i < resources.length; i++) {
        if (
          resources[i].id === editId &&
          resources[i].userId === resourceStudent.id
        ) {
          resources[i].title = resourceData.title;
          resources[i].subject = resourceData.subject;
          resources[i].category = resourceData.category;
          resources[i].year = resourceData.year;
          resources[i].url = resourceData.url;
          resources[i].description = resourceData.description;
          resources[i].updatedAt = resourceData.updatedAt;

          resourceFound = true;

          break;
        }
      }

      if (resourceFound === false) {
        showResourceMessage(
          "Resource not found or you cannot edit it.",
          "danger",
        );

        return;
      }

      saveData(KEYS.RESOURCES, resources);

      addLog("Resource Updated", title);

      showResourceMessage("Resource updated successfully.", "success");
    } else {
      // ADD NEW RESOURCE

      resourceData.id = makeId();

      resourceData.createdAt = new Date().toISOString();

      resources.unshift(resourceData);

      saveData(KEYS.RESOURCES, resources);

      addLog("Resource Published", title);

      showResourceMessage("Resource published successfully.", "success");
    }

    // RESET FORM

    resourceForm.reset();

    document.getElementById("resourceEditId").value = "";

    document.getElementById("resourceSubmit").innerHTML =
      '<i class="bi bi-cloud-upload me-2"></i> Publish Resource';

    renderResources();
  });

  // ==========================================
  // 9. EDIT AND DELETE RESOURCES
  // ==========================================

  resourcesList.addEventListener("click", function (event) {
    let editButton = event.target.closest("[data-edit-resource]");

    let deleteButton = event.target.closest("[data-delete-resource]");

    let resources = getData(KEYS.RESOURCES);

    // EDIT

    if (editButton !== null) {
      let editId = editButton.dataset.editResource;

      let selectedResource = null;

      for (let i = 0; i < resources.length; i++) {
        if (
          resources[i].id === editId &&
          resources[i].userId === resourceStudent.id
        ) {
          selectedResource = resources[i];

          break;
        }
      }

      if (selectedResource === null) {
        return;
      }

      document.getElementById("resourceEditId").value = selectedResource.id;

      document.getElementById("resourceTitle").value =
        selectedResource.title || "";

      document.getElementById("resourceSubject").value =
        selectedResource.subject || "";

      document.getElementById("resourceCategory").value =
        selectedResource.category || "";

      document.getElementById("resourceYear").value =
        selectedResource.year || "";

      document.getElementById("resourceUrl").value = selectedResource.url || "";

      document.getElementById("resourceDescription").value =
        selectedResource.description || "";

      document.getElementById("resourceSubmit").innerHTML =
        '<i class="bi bi-check-circle me-2"></i> Save Changes';

      resourceForm.scrollIntoView({
        behavior: "smooth",
      });
    }

    // DELETE

    if (deleteButton !== null) {
      let deleteId = deleteButton.dataset.deleteResource;

      if (!confirm("Are you sure you want to delete this resource?")) {
        return;
      }

      let updatedResources = [];

      for (let i = 0; i < resources.length; i++) {
        if (
          !(
            resources[i].id === deleteId &&
            resources[i].userId === resourceStudent.id
          )
        ) {
          updatedResources.push(resources[i]);
        }
      }

      saveData(KEYS.RESOURCES, updatedResources);

      addLog("Resource Deleted", deleteId);

      renderResources();

      showResourceMessage("Resource deleted successfully.", "success");
    }
  });

  // ==========================================
  // 10. SEARCH AND FILTER EVENTS
  // ==========================================

  resourceSearch.addEventListener("input", function () {
    renderResources();
  });

  resourceFilter.addEventListener("change", function () {
    renderResources();
  });

  // ==========================================
  // 11. RESET FORM
  // ==========================================

  document
    .getElementById("resourceReset")
    .addEventListener("click", function () {
      document.getElementById("resourceEditId").value = "";

      document.getElementById("resourceSubmit").innerHTML =
        '<i class="bi bi-cloud-upload me-2"></i> Publish Resource';
    });

  // ==========================================
  // 12. INITIAL DISPLAY
  // ==========================================

  renderResources();
}
    })();
}


if (document.getElementById("serviceMessage")) {
    (function () {
let servicesStudent = currentUser();

if (servicesStudent === null || servicesStudent.role !== "student") {
  window.location.href = "../login.html";
} else {
  // 2. DISPLAY STUDENT NAME

  let servicesStudentName =
    (servicesStudent.firstName || "") + " " + (servicesStudent.lastName || "");

  servicesStudentName = servicesStudentName.trim();

  if (servicesStudentName === "") {
    servicesStudentName = servicesStudent.matricule;
  }

  document.getElementById("studentName").textContent = servicesStudentName;

  // 3. LOGOUT

  let logoutButton = document.getElementById("logoutBtn");

  if (logoutButton !== null) {
    logoutButton.addEventListener("click", function () {
      let confirmLogout = confirm("Are you sure you want to logout?");

      if (confirmLogout === true) {
        addLog("Logout", "Student logged out: " + servicesStudent.matricule);

        logoutUser();
      }
    });
  }
}
    })();
}
