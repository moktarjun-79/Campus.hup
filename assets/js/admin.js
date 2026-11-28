// ==========================================
// 1. CHECK ADMIN SESSION
// ==========================================
if (document.getElementById("adminUsersCount")) {
  (function () {
    let loggedAdmin = currentUser();

    if (loggedAdmin === null || loggedAdmin.role !== "admin") {
      window.location.href = "../login.html";
    } else {
      // ==========================================
      // 2. DISPLAY ADMIN NAME
      // ==========================================

      let adminFullName =
        (loggedAdmin.firstName || "") + " " + (loggedAdmin.lastName || "");

      adminFullName = adminFullName.trim();

      if (adminFullName === "") {
        adminFullName = loggedAdmin.matricule;
      }

      document.getElementById("adminName").textContent = adminFullName;

      // ==========================================
      // 3. LOAD PLATFORM DATA
      // ==========================================

      let users = getData(KEYS.USERS);
      let registrations = getData(KEYS.REGISTRATIONS);
      let logs = getData(KEYS.ACTIVITY_LOGS);
      let resources = getData(KEYS.RESOURCES);
      let events = getData(KEYS.EVENTS);
      let lostFound = getData(KEYS.LOST_FOUND);
      let projects = getData(KEYS.PROJECTS);
      let posts = getData(KEYS.POSTS);

      // ==========================================
      // 4. DISPLAY STATISTICS
      // ==========================================

      let studentUsersCount = 0;

      for (let i = 0; i < users.length; i++) {
        if (users[i].role === "student") {
          studentUsersCount++;
        }
      }

      // Total Accounts includes the administrator and all registered student accounts.
      document.getElementById("adminUsersCount").textContent = users.length;

      // Registered Students counts ONLY students who have completed registration.
      document.getElementById("approvedCount").textContent = studentUsersCount;
      document.getElementById("adminRegistrationsCount").textContent =
        registrations.length;
      document.getElementById("adminLogsCount").textContent = logs.length;

      document.getElementById("adminResourcesCount").textContent =
        resources.length;
      document.getElementById("adminEventsCount").textContent = events.length;
      document.getElementById("adminLostCount").textContent = lostFound.length;
      document.getElementById("adminProjectsCount").textContent =
        projects.length;
      document.getElementById("adminPostsCount").textContent = posts.length;

      // ==========================================
      // 5. RECENT PLATFORM ACTIVITY
      // ==========================================

      let activityContainer = document.getElementById("adminRecentActivity");
      let recentActivities = [];

      // Add normal platform activity logs.
      for (let i = 0; i < logs.length; i++) {
        if (
          String(logs[i].action || "").indexOf("Lost & Found Announcement") !==
          -1
        ) {
          continue;
        }

        recentActivities.push({
          kind: "log",
          action: logs[i].action || "Activity",
          details: logs[i].details || "",
          date: logs[i].date,
        });
      }

      // Add Lost & Found announcements with their full details.
      for (let i = 0; i < lostFound.length; i++) {
        let item = lostFound[i];
        let studentName = "Unknown student";

        for (let j = 0; j < users.length; j++) {
          if (users[j].id === item.userId) {
            studentName =
              (users[j].firstName || "") + " " + (users[j].lastName || "");

            studentName = studentName.trim();

            if (studentName === "") {
              studentName = users[j].matricule || "Student";
            }

            break;
          }
        }

        recentActivities.push({
          kind: "lost-found",
          action:
            item.type === "Found"
              ? "Item Found Announcement"
              : "Lost Item Announcement",
          title: item.title || "Untitled announcement",
          student: studentName,
          category: item.category || "Not specified",
          location: item.location || "Not specified",
          description: item.description || "No description provided",
          status: item.status || "Open",
          date: item.createdAt || item.updatedAt,
        });
      }

      // Show newest activities first.
      recentActivities.sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
      });

      if (recentActivities.length === 0) {
        activityContainer.innerHTML =
          '<p class="dashboard-empty">No activity recorded.</p>';
      } else {
        let activityHTML = "";

        for (let i = 0; i < recentActivities.length && i < 10; i++) {
          let activity = recentActivities[i];

          let activityDate = activity.date
            ? new Date(activity.date).toLocaleString()
            : "Date not available";

          activityHTML += '<div class="dashboard-list-item">';
          activityHTML += "<h4>" + escapeHTML(activity.action) + "</h4>";

          if (activity.kind === "lost-found") {
            activityHTML +=
              "<p><strong>Item:</strong> " +
              escapeHTML(activity.title) +
              "</p>" +
              "<p><strong>Student:</strong> " +
              escapeHTML(activity.student) +
              "</p>" +
              "<p><strong>Category:</strong> " +
              escapeHTML(activity.category) +
              " &nbsp; | &nbsp; <strong>Location:</strong> " +
              escapeHTML(activity.location) +
              "</p>" +
              "<p><strong>Description:</strong> " +
              escapeHTML(activity.description) +
              "</p>" +
              "<p><strong>Status:</strong> " +
              escapeHTML(activity.status) +
              "</p>" +
              '<p><a href="lost-found.html">View Lost & Found management</a></p>';
          } else {
            activityHTML += "<p>" + escapeHTML(activity.details) + "</p>";
          }

          activityHTML += "<p>" + escapeHTML(activityDate) + "</p>";
          activityHTML += "</div>";
        }

        activityContainer.innerHTML = activityHTML;
      }
    }
  })();
}

// ==========================================
// ADMIN EVENTS
// Runs only on the page that contains its main element.
// ==========================================
if (document.getElementById("adminEventForm")) {
  (function () {

    // ==========================================
    // 1. CHECK ADMIN SESSION
    // ==========================================
    let eventAdmin = currentUser();
    if (eventAdmin === null || eventAdmin.role !== "admin") {
      window.location.href = "../login.html";
    } else {
      // ==========================================
      // 2. DISPLAY ADMIN NAME
      // ==========================================

      let adminName =
        (eventAdmin.firstName || "") + " " + (eventAdmin.lastName || "");
      adminName = adminName.trim();
      if (adminName === "") {
        adminName = eventAdmin.matricule;
      }
      document.getElementById("adminName").textContent = adminName;
      // ==========================================
      // 3. LOGOUT
      // ==========================================
      document
        .getElementById("logoutBtn")
        .addEventListener("click", function () {
          if (confirm("Are you sure you want to logout?")) {
            addLog("Admin Logout", "Administrator logged out.");
            logoutUser();
          }
        });
      // ==========================================
      // 4. HTML ELEMENTS
      // ==========================================
      let adminEventForm = document.getElementById("adminEventForm");
      let adminEventsTable = document.getElementById("adminEventsTable");
      let adminEventSearch = document.getElementById("adminEventSearch");
      // ==========================================
      // 5. DISPLAY MESSAGE
      // ==========================================
      function showAdminEventMessage(message, type) {
        document.getElementById("adminEventMessage").innerHTML =
          '<div class="alert alert-' +
          type +
          '">' +
          escapeHTML(message) +
          "</div>";
      }
      // ==========================================
      // 6. UPDATE STATISTICS
      // ==========================================
      function updateAdminEventStatistics() {
        let events = getData(KEYS.EVENTS);
        let registrations = getData(KEYS.REGISTRATIONS);
        let upcomingCount = 0;
        for (let i = 0; i < events.length; i++) {
          let eventDate = events[i].date || events[i].eventDate || "";
          if (eventDate >= today()) {
            upcomingCount++;
          }
        }
        document.getElementById("totalAdminEvents").textContent = events.length;
        document.getElementById("totalEventRegistrations").textContent =
          registrations.length;
        document.getElementById("totalUpcomingEvents").textContent =
          upcomingCount;
      }
      // ==========================================
      // 7. DISPLAY EVENTS
      // ==========================================
      function renderAdminEvents() {
        let events = getData(KEYS.EVENTS);
        let registrations = getData(KEYS.REGISTRATIONS);
        let searchValue = adminEventSearch.value.toLowerCase().trim();
        let html = "";
        let displayedCount = 0;
        for (let i = 0; i < events.length; i++) {
          let item = events[i];
          let title = String(item.title || "").toLowerCase();
          let location = String(item.location || "").toLowerCase();
          let description = String(item.description || "").toLowerCase();

          if (
            title.includes(searchValue) ||
            location.includes(searchValue) ||
            description.includes(searchValue)
          ) {
            let registrationCount = 0;

            for (let j = 0; j < registrations.length; j++) {
              if (registrations[j].eventId === item.id) {
                registrationCount++;
              }
            }

            displayedCount++;

            html +=
              "<tr>" +
              "<td>" +
              "<strong>" +
              escapeHTML(item.title || "Untitled Event") +
              "</strong>" +
              "</td>" +
              "<td>" +
              escapeHTML(item.date || item.eventDate || "Not specified") +
              "</td>" +
              "<td>" +
              escapeHTML(item.location || "Not specified") +
              "</td>" +
              "<td>" +
              registrationCount +
              "</td>" +
              "<td>" +
              '<button class="btn btn-sm btn-outline-primary me-1"' +
              ' data-edit-admin-event="' +
              escapeHTML(item.id) +
              '">' +
              '<i class="bi bi-pencil"></i> Edit' +
              "</button>" +
              '<button class="btn btn-sm btn-outline-danger"' +
              ' data-delete-admin-event="' +
              escapeHTML(item.id) +
              '">' +
              '<i class="bi bi-trash"></i> Delete' +
              "</button>" +
              "</td>" +
              "</tr>";
          }
        }

        if (displayedCount === 0) {
          adminEventsTable.innerHTML =
            "<tr>" +
            '<td colspan="5" class="text-center text-secondary py-4">' +
            "No events found." +
            "</td>" +
            "</tr>";
        } else {
          adminEventsTable.innerHTML = html;
        }
      }

      // ==========================================
      // 8. CREATE OR UPDATE EVENT
      // ==========================================

      adminEventForm.addEventListener("submit", function (event) {
        event.preventDefault();

        let events = getData(KEYS.EVENTS);

        let editId = document.getElementById("adminEventEditId").value;

        let title = document.getElementById("adminEventTitle").value.trim();

        let date = document.getElementById("adminEventDate").value;

        let location = document
          .getElementById("adminEventLocation")
          .value.trim();

        let description = document
          .getElementById("adminEventDescription")
          .value.trim();

        if (
          title === "" ||
          date === "" ||
          location === "" ||
          description === ""
        ) {
          showAdminEventMessage(
            "Please complete all required fields.",
            "danger",
          );

          return;
        }

        let eventData = {
          title: title,

          description: description,

          date: date,

          location: location,

          updatedAt: new Date().toISOString(),
        };

        // UPDATE EVENT

        if (editId !== "") {
          let found = false;

          for (let i = 0; i < events.length; i++) {
            if (events[i].id === editId) {
              events[i].title = eventData.title;

              events[i].description = eventData.description;

              events[i].date = eventData.date;

              events[i].location = eventData.location;

              events[i].updatedAt = eventData.updatedAt;

              found = true;

              break;
            }
          }

          if (found === false) {
            showAdminEventMessage("Event not found.", "danger");

            return;
          }

          if (!saveData(KEYS.EVENTS, events)) {
            showAdminEventMessage("Could not save event changes.", "danger");

            return;
          }

          addLog("Event Updated", title);

          showAdminEventMessage("Event updated successfully.", "success");
        } else {
          // CREATE EVENT

          eventData.id = makeId();

          eventData.createdBy = eventAdmin.id;

          eventData.createdAt = new Date().toISOString();

          events.unshift(eventData);

          if (!saveData(KEYS.EVENTS, events)) {
            showAdminEventMessage("Could not publish the event.", "danger");

            return;
          }

          addLog("Event Published", title);

          showAdminEventMessage("Event published successfully.", "success");
        }

        adminEventForm.reset();

        document.getElementById("adminEventEditId").value = "";

        document.getElementById("adminEventSubmit").innerHTML =
          '<i class="bi bi-plus-circle me-2"></i> Publish Event';

        document.getElementById("eventFormTitle").innerHTML =
          '<i class="bi bi-calendar-plus me-2 text-primary"></i> Create New Event';

        renderAdminEvents();

        updateAdminEventStatistics();
      });

      // ==========================================
      // 9. EDIT AND DELETE EVENTS
      // ==========================================

      adminEventsTable.addEventListener("click", function (event) {
        let editButton = event.target.closest("[data-edit-admin-event]");

        let deleteButton = event.target.closest("[data-delete-admin-event]");

        let events = getData(KEYS.EVENTS);

        // EDIT EVENT

        if (editButton !== null) {
          let editId = editButton.dataset.editAdminEvent;

          let selectedEvent = null;

          for (let i = 0; i < events.length; i++) {
            if (events[i].id === editId) {
              selectedEvent = events[i];

              break;
            }
          }

          if (selectedEvent === null) {
            return;
          }

          document.getElementById("adminEventEditId").value = selectedEvent.id;

          document.getElementById("adminEventTitle").value =
            selectedEvent.title || "";

          document.getElementById("adminEventDate").value =
            selectedEvent.date || selectedEvent.eventDate || "";

          document.getElementById("adminEventLocation").value =
            selectedEvent.location || "";

          document.getElementById("adminEventDescription").value =
            selectedEvent.description || "";

          document.getElementById("adminEventSubmit").innerHTML =
            '<i class="bi bi-check-circle me-2"></i> Save Changes';

          document.getElementById("eventFormTitle").textContent = "Edit Event";

          adminEventForm.scrollIntoView({
            behavior: "smooth",
          });
        }

        // DELETE EVENT

        if (deleteButton !== null) {
          let deleteId = deleteButton.dataset.deleteAdminEvent;

          if (!confirm("Delete this event and all its registrations?")) {
            return;
          }

          let updatedEvents = [];

          for (let i = 0; i < events.length; i++) {
            if (events[i].id !== deleteId) {
              updatedEvents.push(events[i]);
            }
          }

          let registrations = getData(KEYS.REGISTRATIONS);

          let updatedRegistrations = [];

          for (let i = 0; i < registrations.length; i++) {
            if (registrations[i].eventId !== deleteId) {
              updatedRegistrations.push(registrations[i]);
            }
          }

          let eventsSaved = saveData(KEYS.EVENTS, updatedEvents);

          let registrationsSaved = saveData(
            KEYS.REGISTRATIONS,
            updatedRegistrations,
          );

          if (!eventsSaved || !registrationsSaved) {
            showAdminEventMessage(
              "An error occurred while deleting the event.",
              "danger",
            );

            return;
          }

          addLog("Event Deleted", deleteId);

          showAdminEventMessage(
            "Event and its registrations deleted successfully.",
            "success",
          );

          renderAdminEvents();

          updateAdminEventStatistics();
        }
      });

      // ==========================================
      // 10. SEARCH
      // ==========================================

      adminEventSearch.addEventListener("input", function () {
        renderAdminEvents();
      });

      // ==========================================
      // 11. RESET FORM
      // ==========================================

      document
        .getElementById("adminEventReset")
        .addEventListener("click", function () {
          document.getElementById("adminEventEditId").value = "";

          document.getElementById("adminEventSubmit").innerHTML =
            '<i class="bi bi-plus-circle me-2"></i> Publish Event';

          document.getElementById("eventFormTitle").textContent =
            "Create New Event";
        });

      // ==========================================
      // 12. INITIAL DISPLAY
      // ==========================================

      renderAdminEvents();

      updateAdminEventStatistics();
    }
  })();
}

// ==========================================
// ADMIN LOST AND FOUND
// Runs only on the page that contains its main element.
// ==========================================
if (document.getElementById("lostAdminTable")) {
  (function () {
    // ==========================================
    // 1. CHECK ADMIN SESSION
    // ==========================================

    let lostAdmin = currentUser();

    if (lostAdmin === null || lostAdmin.role !== "admin") {
      window.location.href = "../login.html";
    } else {
      // ==========================================
      // 2. DISPLAY ADMIN NAME
      // ==========================================

      let adminFullName =
        (lostAdmin.firstName || "") + " " + (lostAdmin.lastName || "");

      adminFullName = adminFullName.trim();

      if (adminFullName === "") {
        adminFullName = lostAdmin.matricule;
      }

      document.getElementById("adminName").textContent = adminFullName;

      // ==========================================
      // 3. LOGOUT
      // ==========================================

      document
        .getElementById("logoutBtn")
        .addEventListener("click", function () {
          if (confirm("Are you sure you want to logout?")) {
            addLog("Admin Logout", "Administrator logged out.");

            logoutUser();
          }
        });

      // ==========================================
      // 4. HTML ELEMENTS
      // ==========================================

      let lostAdminTable = document.getElementById("lostAdminTable");

      let lostAdminSearch = document.getElementById("lostAdminSearch");

      let lostAdminType = document.getElementById("lostAdminType");

      let lostAdminStatus = document.getElementById("lostAdminStatus");

      // ==========================================
      // 5. DISPLAY MESSAGE
      // ==========================================

      function showLostAdminMessage(message, type) {
        document.getElementById("lostAdminMessage").innerHTML =
          '<div class="alert alert-' +
          type +
          ' alert-dismissible fade show">' +
          escapeHTML(message) +
          '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
          "</div>";
      }

      // ==========================================
      // 6. GET STUDENT NAME
      // ==========================================

      function getLostStudentName(userId) {
        let users = getData(KEYS.USERS);

        for (let i = 0; i < users.length; i++) {
          if (users[i].id === userId) {
            let fullName =
              (users[i].firstName || "") + " " + (users[i].lastName || "");

            fullName = fullName.trim();

            if (fullName !== "") {
              return fullName;
            }

            return users[i].matricule || "Student";
          }
        }

        return "Unknown Student";
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

      // ==========================================
      // 7. UPDATE STATISTICS
      // ==========================================

      function updateLostStatistics() {
        let items = getData(KEYS.LOST_FOUND);

        let lostCount = 0;
        let foundCount = 0;
        let openCount = 0;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type === "Lost") {
            lostCount++;
          }

          if (items[i].type === "Found") {
            foundCount++;
          }

          if ((items[i].status || "Open") === "Open") {
            openCount++;
          }
        }

        document.getElementById("totalLostItems").textContent = items.length;

        document.getElementById("totalLostOnly").textContent = lostCount;

        document.getElementById("totalFoundOnly").textContent = foundCount;

        document.getElementById("totalOpenLost").textContent = openCount;
      }


      function renderLostAnnouncements() {
        let items = getData(KEYS.LOST_FOUND);

        let searchValue = lostAdminSearch.value.toLowerCase().trim();

        let selectedType = lostAdminType.value;

        let selectedStatus = lostAdminStatus.value;

        let html = "";

        let displayedCount = 0;

        for (let i = 0; i < items.length; i++) {
          let item = items[i];

          let title = String(item.title || "").toLowerCase();

          let category = String(item.category || "").toLowerCase();

          let location = String(item.location || "").toLowerCase();

          let description = String(item.description || "").toLowerCase();

          let studentName = getLostStudentName(item.userId).toLowerCase();

          let searchMatches =
            title.includes(searchValue) ||
            category.includes(searchValue) ||
            location.includes(searchValue) ||
            description.includes(searchValue) ||
            studentName.includes(searchValue);

          let typeMatches = selectedType === "" || item.type === selectedType;

          let itemStatus = item.status || "Open";

          let statusMatches =
            selectedStatus === "" || itemStatus === selectedStatus;

          if (searchMatches && typeMatches && statusMatches) {
            displayedCount++;

            let typeClass = item.type === "Found" ? "found" : "lost";

            let statusClass = itemStatus === "Resolved" ? "resolved" : "open";

            let date = "Not specified";

            if (item.createdAt) {
              let itemDate = new Date(item.createdAt);

              if (!isNaN(itemDate.getTime())) {
                date = itemDate.toLocaleDateString();
              }
            }

            let viewButtonHTML =
              '<button type="button" class="btn btn-sm btn-outline-secondary"' +
              ' data-view-lost="' +
              escapeHTML(item.id) +
              '">' +
              '<i class="bi bi-eye"></i> View Details' +
              "</button>";

            let statusButtonHTML = "";

            if (itemStatus === "Open") {
              statusButtonHTML =
                '<button type="button" class="btn btn-sm btn-outline-primary"' +
                ' data-toggle-lost-status="' +
                escapeHTML(item.id) +
                '">' +
                '<i class="bi bi-check-circle"></i> Resolve' +
                "</button>";
            } else {
              statusButtonHTML =
                '<button type="button" class="btn btn-sm btn-outline-primary"' +
                ' data-toggle-lost-status="' +
                escapeHTML(item.id) +
                '">' +
                '<i class="bi bi-arrow-counterclockwise"></i> Reopen' +
                "</button>";
            }

            let deleteButtonHTML =
              '<button type="button" class="btn btn-sm btn-outline-danger"' +
              ' data-delete-lost="' +
              escapeHTML(item.id) +
              '">' +
              '<i class="bi bi-trash"></i>' +
              "</button>";

            html +=
              "<tr>" +
              "<td>" +
              '<div class="lost-item-title">' +
              escapeHTML(item.title || "Untitled") +
              "</div>" +
              '<div class="lost-item-description">' +
              escapeHTML(item.description || "No description") +
              "</div>" +
              "</td>" +
              "<td>" +
              '<span class="lost-type-badge ' +
              typeClass +
              '">' +
              escapeHTML(item.type || "Unknown") +
              "</span>" +
              "</td>" +
              "<td>" +
              escapeHTML(item.category || "Not specified") +
              "</td>" +
              "<td>" +
              escapeHTML(item.location || "Not specified") +
              "</td>" +
              "<td>" +
              escapeHTML(getLostStudentName(item.userId)) +
              "</td>" +
              "<td>" +
              escapeHTML(date) +
              "</td>" +
              "<td>" +
              '<span class="lost-status-badge ' +
              statusClass +
              '">' +
              escapeHTML(itemStatus) +
              "</span>" +
              "</td>" +
              "<td>" +
              '<div class="lost-admin-actions">' +
              viewButtonHTML +
              statusButtonHTML +
              deleteButtonHTML +
              "</div>" +
              "</td>" +
              "</tr>";
          }
        }

        if (displayedCount === 0) {
          html =
            "<tr>" +
            '<td colspan="8" class="lost-admin-empty">' +
            '<i class="bi bi-search fs-3 d-block mb-2"></i>' +
            "No announcements found." +
            "</td>" +
            "</tr>";
        }

        lostAdminTable.innerHTML = html;

        document.getElementById("displayedLostCount").textContent =
          displayedCount + " Announcements";

        updateLostStatistics();
      }


      lostAdminTable.addEventListener("click", function (event) {
        let viewButton = event.target.closest("[data-view-lost]");
        let statusButton = event.target.closest("[data-toggle-lost-status]");

        let deleteButton = event.target.closest("[data-delete-lost]");

        let items = getData(KEYS.LOST_FOUND);

        // VIEW ANNOUNCEMENT DETAILS

        if (viewButton !== null) {
          let selectedId = viewButton.getAttribute("data-view-lost");

          let selectedItem = null;

          for (let i = 0; i < items.length; i++) {
            if (String(items[i].id) === String(selectedId)) {
              selectedItem = items[i];
              break;
            }
          }

          if (selectedItem === null) {
            return;
          }

          let student = getLostStudent(selectedItem.userId);

          let itemDate = selectedItem.createdAt || null;
          let updateDate = selectedItem.updatedAt || null;

          function formatLostDate(dateValue) {
            if (!dateValue) {
              return "Not specified";
            }

            let date = new Date(dateValue);

            if (isNaN(date.getTime())) {
              return "Not specified";
            }

            return date.toLocaleString();
          }

          document.getElementById("detailTitle").textContent =
            selectedItem.title || "Untitled";

          document.getElementById("detailType").textContent =
            selectedItem.type || "Unknown";

          document.getElementById("detailStatus").textContent =
            selectedItem.status || "Open";

          document.getElementById("detailStudent").textContent = student
            ? getLostStudentName(selectedItem.userId)
            : "Unknown Student";

          document.getElementById("detailMatricule").textContent = student
            ? student.matricule || "Not specified"
            : "Not found";

          document.getElementById("detailCategory").textContent =
            selectedItem.category || "Not specified";

          document.getElementById("detailLocation").textContent =
            selectedItem.location || "Not specified";

          document.getElementById("detailDescription").textContent =
            selectedItem.description || "No description";

          document.getElementById("detailDate").textContent =
            formatLostDate(itemDate);

          document.getElementById("detailUpdated").textContent =
            formatLostDate(updateDate);

          let modalElement = document.getElementById("lostDetailsModal");

          let detailsModal = bootstrap.Modal.getOrCreateInstance(modalElement);

          detailsModal.show();

          return;
        }

        // CHANGE STATUS

        if (statusButton !== null) {
          let selectedId = statusButton.getAttribute("data-toggle-lost-status");

          let selectedItem = null;

          for (let i = 0; i < items.length; i++) {
            if (items[i].id === selectedId) {
              selectedItem = items[i];

              break;
            }
          }

          if (selectedItem === null) {
            return;
          }

          if ((selectedItem.status || "Open") === "Open") {
            selectedItem.status = "Resolved";
          } else {
            selectedItem.status = "Open";
          }

          selectedItem.updatedAt = new Date().toISOString();

          if (saveData(KEYS.LOST_FOUND, items) === false) {
            showLostAdminMessage(
              "Could not update announcement status.",
              "danger",
            );

            return;
          }

          addLog(
            "Lost & Found Status Updated",
            selectedItem.title + " - " + selectedItem.status,
          );

          showLostAdminMessage(
            "Announcement status updated successfully.",
            "success",
          );

          renderLostAnnouncements();
        }

        // DELETE ANNOUNCEMENT

        if (deleteButton !== null) {
          let selectedId = deleteButton.getAttribute("data-delete-lost");

          if (!confirm("Are you sure you want to delete this announcement?")) {
            return;
          }

          let updatedItems = [];

          let deletedItem = null;

          for (let i = 0; i < items.length; i++) {
            if (items[i].id === selectedId) {
              deletedItem = items[i];
            } else {
              updatedItems.push(items[i]);
            }
          }

          if (deletedItem === null) {
            return;
          }

          if (saveData(KEYS.LOST_FOUND, updatedItems) === false) {
            showLostAdminMessage("Could not delete announcement.", "danger");

            return;
          }

          addLog("Lost & Found Announcement Deleted", deletedItem.title);

          showLostAdminMessage("Announcement deleted successfully.", "success");

          renderLostAnnouncements();
        }
      });

      // ==========================================
      // 10. SEARCH AND FILTER
      // ==========================================

      lostAdminSearch.addEventListener("input", renderLostAnnouncements);

      lostAdminType.addEventListener("change", renderLostAnnouncements);

      lostAdminStatus.addEventListener("change", renderLostAnnouncements);

      // ==========================================
      // 10.1 CODE SUPPLEMENTAIRE : MODAL FOCUS
      // ==========================================

      // Quand la fenêtre Details commence à se fermer ("hide.bs.modal"),
      // on retire le focus du bouton qui le garde (Close ou X).
      // Cela supprime l'avertissement aria-hidden dans la Console.

      let lostDetailsModalElement = document.getElementById("lostDetailsModal");

      lostDetailsModalElement.addEventListener("hide.bs.modal", function () {
        if (document.activeElement !== null) {
          document.activeElement.blur();
        }
      });

      // ==========================================
      // 11. INITIAL DISPLAY
      // ==========================================

      renderLostAnnouncements();
    }
  })();
}

// ==========================================
// ADMIN PROJECTS
// Runs only on the page that contains its main element.
// ==========================================
if (document.getElementById("projectSearch")) {
  (function () {
    // ==========================================
    // CampusHub - Admin Projects Management
    // ==========================================

    let admin = currentUser();

    if (!admin || admin.role !== "admin") {
      window.location.href = "../login.html";
    } else {
      document.getElementById("adminName").textContent =
        ((admin.firstName || "") + " " + (admin.lastName || "")).trim() ||
        admin.matricule ||
        "Administrator";

      document
        .getElementById("logoutBtn")
        .addEventListener("click", function () {
          if (confirm("Are you sure you want to logout?")) logoutUser();
        });

      function getAdminProjects() {
        return getData(KEYS.PROJECTS);
      }

      function getAdminRequests() {
        return getData(KEYS.PROJECT_REQUESTS);
      }

      function migrateAdminProjectPlaces(projects) {
        let changed = false;
        projects.forEach(function (project) {
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
        if (changed) saveData(KEYS.PROJECTS, projects);
      }

      function getAdminUserName(userId) {
        let users = getData(KEYS.USERS);
        let user = users.find(function (item) {
          return item.id === userId;
        });
        if (!user) return "Unknown student";
        return (
          ((user.firstName || "") + " " + (user.lastName || "")).trim() ||
          user.matricule ||
          "Student"
        );
      }

      function updateProjectStatistics(projects, requests) {
        let openCount = projects.filter(function (item) {
          return item.status !== "Full" && Number(item.positions) > 0;
        }).length;
        let pendingCount = requests.filter(function (item) {
          return item.status === "Pending";
        }).length;
        let memberCount = 0;
        projects.forEach(function (project) {
          memberCount += Array.isArray(project.members)
            ? project.members.length
            : 0;
        });
        document.getElementById("totalProjects").textContent = projects.length;
        document.getElementById("openProjects").textContent = openCount;
        document.getElementById("pendingProjectRequests").textContent =
          pendingCount;
        document.getElementById("totalProjectMembers").textContent =
          memberCount;
      }

      function populateProjectCategories() {
        let projects = getAdminProjects();
        let select = document.getElementById("projectCategoryFilter");
        let selected = select.value;
        let categories = [];
        projects.forEach(function (project) {
          let category = project.category || "Other";
          if (!categories.includes(category)) categories.push(category);
        });
        categories.sort();
        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(function (category) {
          let option = document.createElement("option");
          option.value = category;
          option.textContent = category;
          select.appendChild(option);
        });
        select.value = selected;
      }

      function renderAdminProjects() {
        let projects = getAdminProjects();
        migrateAdminProjectPlaces(projects);
        let requests = getAdminRequests();
        let search = document
          .getElementById("projectSearch")
          .value.trim()
          .toLowerCase();
        let category = document.getElementById("projectCategoryFilter").value;
        let status = document.getElementById("projectStatusFilter").value;
        let rows = "";

        updateProjectStatistics(projects, requests);
        populateProjectCategories();

        projects.forEach(function (project) {
          let projectCategory = project.category || "Other";
          let projectStatus =
            project.status === "Full" ||
            project.status === "Closed" ||
            Number(project.positions) <= 0
              ? "Full"
              : "Open";
          let ownerName = getAdminUserName(project.userId);
          let members = Array.isArray(project.members) ? project.members : [];
          let relatedRequests = requests.filter(function (request) {
            return request.projectId === project.id;
          });
          let searchText = (
            (project.title || "") +
            " " +
            project.description +
            " " +
            projectCategory +
            " " +
            ownerName
          ).toLowerCase();

          if (search && searchText.indexOf(search) === -1) return;
          if (category && projectCategory !== category) return;
          if (status && projectStatus !== status) return;

          let memberNames = members.map(function (userId) {
            return getAdminUserName(userId);
          });
          let requestDetails = relatedRequests
            .map(function (request) {
              return (
                '<div class="project-request-item"><strong>' +
                escapeHTML(getAdminUserName(request.userId)) +
                "</strong><small>" +
                escapeHTML(request.status || "Pending") +
                "</small></div>"
              );
            })
            .join("");

          rows +=
            "<tr>" +
            '<td><div class="project-admin-title">' +
            escapeHTML(project.title || "Untitled project") +
            "</div>" +
            '<div class="project-admin-description">' +
            escapeHTML(project.description || "") +
            "</div></td>" +
            "<td>" +
            escapeHTML(projectCategory) +
            "</td>" +
            "<td>" +
            escapeHTML(ownerName) +
            "</td>" +
            "<td><details><summary>" +
            members.length +
            ' member(s)</summary><div class="mt-2">' +
            (memberNames
              .map(function (name) {
                return (
                  '<small class="d-block">' + escapeHTML(name) + "</small>"
                );
              })
              .join("") || "<small>No members</small>") +
            "</div></details></td>" +
            "<td>" +
            Number(project.positions || 0) +
            " available</td>" +
            '<td><details class="project-requests-details"><summary>' +
            relatedRequests.length +
            " request(s)</summary>" +
            (requestDetails || "<small>No requests</small>") +
            "</details></td>" +
            '<td><span class="project-status-badge ' +
            (projectStatus === "Open" ? "open" : "closed") +
            '">' +
            escapeHTML(projectStatus) +
            "</span></td>" +
            '<td class="project-admin-actions"><button class="btn btn-sm btn-outline-danger" data-admin-delete-project="' +
            escapeHTML(project.id) +
            '">Delete</button></td>' +
            "</tr>";
        });

        document.getElementById("projectsAdminTable").innerHTML =
          rows ||
          '<tr><td colspan="8" class="text-center py-4 text-muted">No projects found.</td></tr>';
        document.getElementById("displayedProjects").textContent =
          (rows
            ? document.querySelectorAll("#projectsAdminTable tr").length
            : 0) + " Projects";
      }

      document
        .getElementById("projectSearch")
        .addEventListener("input", renderAdminProjects);
      document
        .getElementById("projectCategoryFilter")
        .addEventListener("change", renderAdminProjects);
      document
        .getElementById("projectStatusFilter")
        .addEventListener("change", renderAdminProjects);

      document
        .getElementById("projectsAdminTable")
        .addEventListener("click", function (event) {
          let button = event.target.closest("[data-admin-delete-project]");
          if (!button) return;
          if (!confirm("Delete this project and all related join requests?"))
            return;

          let projectId = button.dataset.adminDeleteProject;
          let projects = getAdminProjects().filter(function (project) {
            return project.id !== projectId;
          });
          let requests = getAdminRequests().filter(function (request) {
            return request.projectId !== projectId;
          });
          saveData(KEYS.PROJECTS, projects);
          saveData(KEYS.PROJECT_REQUESTS, requests);
          addLog("Team Up", "An administrator deleted a project");
          showAdminProjectMessage(
            "Project and related requests deleted.",
            "success",
          );
          renderAdminProjects();
        });

      function showAdminProjectMessage(message, type) {
        document.getElementById("adminProjectMessage").innerHTML =
          '<div class="alert alert-' +
          type +
          ' alert-dismissible fade show" role="alert">' +
          escapeHTML(message) +
          '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>';
      }

      renderAdminProjects();
    }
  })();
}

if (document.getElementById("adminResourceForm")) {
  (function () {


    let resourceAdmin = currentUser();

    if (resourceAdmin === null || resourceAdmin.role !== "admin") {
      window.location.href = "../login.html";
    } else {
      // ==========================================
      // 2. DISPLAY ADMIN NAME
      // ==========================================

      let adminFullName =
        (resourceAdmin.firstName || "") + " " + (resourceAdmin.lastName || "");

      adminFullName = adminFullName.trim();

      if (adminFullName === "") {
        adminFullName = resourceAdmin.matricule;
      }

      document.getElementById("adminName").textContent = adminFullName;

      // ==========================================
      // 3. GET HTML ELEMENTS
      // ==========================================

      let adminResourceForm = document.getElementById("adminResourceForm");

      let resourcesTableBody = document.getElementById("resourcesTableBody");

      let resourceSearch = document.getElementById("resourceSearch");

      let resourceFilter = document.getElementById("resourceFilter");

      let resourceEditId = document.getElementById("resourceEditId");

      // ==========================================
      // 4. DISPLAY MESSAGES
      // ==========================================

      function showAdminResourceMessage(message, type) {
        document.getElementById("resourceMessage").innerHTML =
          '<div class="alert alert-' +
          type +
          ' alert-dismissible fade show">' +
          escapeHTML(message) +
          '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
          "</div>";
      }

      // ==========================================
      // 5. UPDATE STATISTICS
      // ==========================================

      function updateResourceStatistics() {
        let resources = getData(KEYS.RESOURCES);

        let subjects = [];
        let categories = [];

        for (let i = 0; i < resources.length; i++) {
          let subject = resources[i].subject;
          let category = resources[i].category;

          if (subject && !subjects.includes(subject)) {
            subjects.push(subject);
          }

          if (category && !categories.includes(category)) {
            categories.push(category);
          }
        }

        document.getElementById("totalResources").textContent =
          resources.length;

        document.getElementById("subjectsCount").textContent = subjects.length;

        document.getElementById("categoriesCount").textContent =
          categories.length;
      }

      // ==========================================
      // 6. GET RESOURCE AUTHOR
      // ==========================================

      function getResourceAuthor(userId) {
        let users = getData(KEYS.USERS);

        for (let i = 0; i < users.length; i++) {
          if (users[i].id === userId) {
            let name =
              (users[i].firstName || "") + " " + (users[i].lastName || "");

            if (name.trim() !== "") {
              return name.trim();
            }

            return users[i].matricule || "Student";
          }
        }

        if (userId === resourceAdmin.id) {
          return "Administrator";
        }

        return "Student";
      }

      // ==========================================
      // 7. DISPLAY RESOURCES
      // ==========================================

      function renderAdminResources() {
        let resources = getData(KEYS.RESOURCES);

        let searchValue = resourceSearch.value.toLowerCase().trim();

        let selectedCategory = resourceFilter.value;

        let html = "";

        let displayedCount = 0;

        for (let i = 0; i < resources.length; i++) {
          let item = resources[i];

          let title = String(item.title || "").toLowerCase();

          let subject = String(item.subject || "").toLowerCase();

          let description = String(item.description || "").toLowerCase();

          let matchesSearch =
            title.includes(searchValue) ||
            subject.includes(searchValue) ||
            description.includes(searchValue);

          let matchesCategory =
            selectedCategory === "" || item.category === selectedCategory;

          if (matchesSearch && matchesCategory) {
            displayedCount++;

            let authorName = getResourceAuthor(item.userId);

            html +=
              "<tr>" +
              "<td>" +
              '<div class="resource-title">' +
              escapeHTML(item.title || "Untitled Resource") +
              "</div>" +
              '<small class="text-muted">' +
              escapeHTML(item.description || "No description") +
              "</small>" +
              "</td>" +
              "<td>" +
              escapeHTML(item.subject || "Not specified") +
              "</td>" +
              "<td>" +
              '<span class="resource-category-badge">' +
              escapeHTML(item.category || "Other") +
              "</span>" +
              "</td>" +
              "<td>" +
              escapeHTML(item.year || "Not specified") +
              "</td>" +
              "<td>" +
              escapeHTML(authorName) +
              "</td>" +
              "<td>" +
              '<div class="resource-action-buttons">' +
              '<a href="' +
              escapeHTML(item.url || "#") +
              '"' +
              ' target="_blank"' +
              ' rel="noopener noreferrer"' +
              ' class="btn btn-sm btn-outline-success">' +
              '<i class="bi bi-eye"></i>' +
              "</a>" +
              '<button type="button"' +
              ' class="btn btn-sm btn-outline-primary"' +
              ' data-edit-resource="' +
              escapeHTML(item.id) +
              '">' +
              '<i class="bi bi-pencil"></i>' +
              "</button>" +
              '<button type="button"' +
              ' class="btn btn-sm btn-outline-danger"' +
              ' data-delete-resource="' +
              escapeHTML(item.id) +
              '">' +
              '<i class="bi bi-trash"></i>' +
              "</button>" +
              "</div>" +
              "</td>" +
              "</tr>";
          }
        }

        if (displayedCount === 0) {
          html =
            "<tr>" +
            '<td colspan="6" class="resources-empty">' +
            "No resources found." +
            "</td>" +
            "</tr>";
        }

        resourcesTableBody.innerHTML = html;

        updateResourceStatistics();
      }

      // ==========================================
      // 8. RESET FORM
      // ==========================================

      function resetResourceForm() {
        adminResourceForm.reset();

        resourceEditId.value = "";

        document.getElementById("formTitle").innerHTML =
          '<i class="bi bi-plus-circle me-2"></i>' + "Add New Resource";

        document.getElementById("resourceSubmit").innerHTML =
          '<i class="bi bi-cloud-upload me-2"></i>' + "Publish Resource";
      }

      // ==========================================
      // 9. ADD OR UPDATE RESOURCE
      // ==========================================

      adminResourceForm.addEventListener("submit", function (event) {
        event.preventDefault();

        let resources = getData(KEYS.RESOURCES);

        let editId = resourceEditId.value;

        let title = document.getElementById("resourceTitle").value.trim();

        let subject = document.getElementById("resourceSubject").value.trim();

        let category = document.getElementById("resourceCategory").value;

        let year = document.getElementById("resourceYear").value.trim();

        let url = document.getElementById("resourceUrl").value.trim();

        let description = document
          .getElementById("resourceDescription")
          .value.trim();

        // VALIDATION

        if (title === "" || subject === "" || category === "" || url === "") {
          showAdminResourceMessage(
            "Please complete all required fields.",
            "danger",
          );

          return;
        }

        // CODE SUPPLEMENTAIRE
        // Vérifier le type du lien.

        if (!url.startsWith("https://") && !url.startsWith("http://")) {
          showAdminResourceMessage(
            "Please enter a valid HTTP or HTTPS link.",
            "danger",
          );

          return;
        }

        // RESOURCE DATA

        let resourceData = {
          title: title,
          subject: subject,
          category: category,
          year: year,
          url: url,
          description: description,
          updatedAt: new Date().toISOString(),
        };

        // UPDATE RESOURCE

        if (editId !== "") {
          let resourceFound = false;

          for (let i = 0; i < resources.length; i++) {
            if (resources[i].id === editId) {
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
            showAdminResourceMessage("Resource not found.", "danger");

            return;
          }

          if (saveData(KEYS.RESOURCES, resources) === false) {
            showAdminResourceMessage("Could not save the changes.", "danger");

            return;
          }

          addLog("Admin Resource Updated", title);

          showAdminResourceMessage("Resource updated successfully.", "success");
        }

        // ADD NEW RESOURCE
        else {
          resourceData.id = makeId();

          resourceData.userId = resourceAdmin.id;

          resourceData.createdAt = new Date().toISOString();

          resources.unshift(resourceData);

          if (saveData(KEYS.RESOURCES, resources) === false) {
            showAdminResourceMessage(
              "Could not publish the resource.",
              "danger",
            );

            return;
          }

          addLog("Admin Resource Published", title);

          showAdminResourceMessage(
            "Resource published successfully.",
            "success",
          );
        }

        resetResourceForm();

        renderAdminResources();
      });

      // ==========================================
      // 10. EDIT AND DELETE RESOURCES
      // ==========================================

      resourcesTableBody.addEventListener("click", function (event) {
        let editButton = event.target.closest("[data-edit-resource]");

        let deleteButton = event.target.closest("[data-delete-resource]");

        let resources = getData(KEYS.RESOURCES);

        // EDIT

        if (editButton !== null) {
          let id = editButton.getAttribute("data-edit-resource");

          let selectedResource = null;

          for (let i = 0; i < resources.length; i++) {
            if (resources[i].id === id) {
              selectedResource = resources[i];
              break;
            }
          }

          if (selectedResource === null) {
            return;
          }

          resourceEditId.value = selectedResource.id;

          document.getElementById("resourceTitle").value =
            selectedResource.title || "";

          document.getElementById("resourceSubject").value =
            selectedResource.subject || "";

          document.getElementById("resourceCategory").value =
            selectedResource.category || "";

          document.getElementById("resourceYear").value =
            selectedResource.year || "";

          document.getElementById("resourceUrl").value =
            selectedResource.url || "";

          document.getElementById("resourceDescription").value =
            selectedResource.description || "";

          document.getElementById("formTitle").innerHTML =
            '<i class="bi bi-pencil-square me-2"></i>' + "Edit Resource";

          document.getElementById("resourceSubmit").innerHTML =
            '<i class="bi bi-check-circle me-2"></i>' + "Save Changes";

          document.getElementById("adminResourceForm").scrollIntoView({
            behavior: "smooth",
          });
        }

        // DELETE

        if (deleteButton !== null) {
          let id = deleteButton.getAttribute("data-delete-resource");

          let confirmDelete = confirm(
            "Are you sure you want to delete this resource?",
          );

          if (confirmDelete === false) {
            return;
          }

          let updatedResources = [];

          let deletedResource = null;

          for (let i = 0; i < resources.length; i++) {
            if (resources[i].id === id) {
              deletedResource = resources[i];
            } else {
              updatedResources.push(resources[i]);
            }
          }

          if (deletedResource === null) {
            return;
          }

          if (saveData(KEYS.RESOURCES, updatedResources) === false) {
            showAdminResourceMessage(
              "Could not delete the resource.",
              "danger",
            );

            return;
          }

          addLog("Admin Resource Deleted", deletedResource.title);

          showAdminResourceMessage("Resource deleted successfully.", "success");

          renderAdminResources();
        }
      });

      // ==========================================
      // 11. SEARCH AND FILTER
      // ==========================================

      resourceSearch.addEventListener("input", function () {
        renderAdminResources();
      });

      resourceFilter.addEventListener("change", function () {
        renderAdminResources();
      });

      // ==========================================
      // 12. RESET BUTTON
      // ==========================================

      document
        .getElementById("resourceReset")
        .addEventListener("click", function () {
          resetResourceForm();
        });



      renderAdminResources();
    }
  })();
}

// ==========================================
// ADMIN STUDENTS
// Runs only on the page that contains its main element.
// ==========================================
if (document.getElementById("studentsTableBody")) {
  (function () {


    let loggedAdmin = currentUser();

    if (loggedAdmin === null || loggedAdmin.role !== "admin") {
      window.location.href = "../login.html";
    } else {
      let adminFullName = (
        (loggedAdmin.firstName || "") +
        " " +
        (loggedAdmin.lastName || "")
      ).trim();

      if (adminFullName === "") {
        adminFullName = loggedAdmin.matricule || "Administrator";
      }

      document.getElementById("adminName").textContent = adminFullName;

      // Seuls les comptes créés sont visibles. APPROVED_STUDENTS reste privé.
      function getStudentRecords() {
        let users = getData(KEYS.USERS);
        let records = [];

        for (let i = 0; i < users.length; i++) {
          if (users[i].role === "student") {
            records.push({
              matricule: users[i].matricule || "",
              firstName: users[i].firstName || "",
              lastName: users[i].lastName || "",
              email: users[i].email || "",
              active: users[i].active !== false,
            });
          }
        }

        return records;
      }

      function displayStudentStatistics(records) {
        let activeCount = 0;
        let inactiveCount = 0;

        for (let i = 0; i < records.length; i++) {
          if (records[i].active) activeCount++;
          else inactiveCount++;
        }

        document.getElementById("totalStudents").textContent = records.length;
        document.getElementById("activeStudents").textContent = activeCount;
        document.getElementById("inactiveStudents").textContent = inactiveCount;
      }

      function displayStudents() {
        let records = getStudentRecords();
        displayStudentStatistics(records);

        let searchValue = document
          .getElementById("studentSearch")
          .value.trim()
          .toLowerCase();
        let statusValue = document.getElementById("statusFilter").value;
        let filteredRecords = [];

        for (let i = 0; i < records.length; i++) {
          let fullName = (
            records[i].firstName +
            " " +
            records[i].lastName
          ).toLowerCase();
          let matricule = records[i].matricule.toLowerCase();
          let email = records[i].email.toLowerCase();
          let matchesSearch =
            fullName.includes(searchValue) ||
            matricule.includes(searchValue) ||
            email.includes(searchValue);
          let matchesStatus =
            statusValue === "all" ||
            (statusValue === "active" && records[i].active) ||
            (statusValue === "inactive" && !records[i].active);

          if (matchesSearch && matchesStatus) filteredRecords.push(records[i]);
        }

        let tableBody = document.getElementById("studentsTableBody");

        if (filteredRecords.length === 0) {
          tableBody.innerHTML =
            '<tr><td colspan="6" class="students-empty">No registered student accounts found.</td></tr>';
          return;
        }

        let tableHTML = "";

        for (let i = 0; i < filteredRecords.length; i++) {
          let student = filteredRecords[i];
          let fullName = (student.firstName + " " + student.lastName).trim();
          if (fullName === "") fullName = "Student";

          let statusText = student.active ? "Active" : "Inactive";
          let statusClass = student.active
            ? "status-active"
            : "status-inactive";
          let buttonClass = student.active
            ? "btn-outline-danger"
            : "btn-outline-success";
          let buttonText = student.active ? "Deactivate" : "Activate";

          let actionHTML =
            '<button type="button" class="btn btn-sm ' +
            buttonClass +
            ' student-status-button" data-matricule="' +
            escapeHTML(student.matricule) +
            '">' +
            buttonText +
            "</button>";

          tableHTML +=
            "<tr>" +
            '<td><span class="student-name">' +
            escapeHTML(fullName) +
            "</span></td>" +
            "<td>" +
            escapeHTML(student.matricule) +
            "</td>" +
            "<td>" +
            escapeHTML(student.email || "—") +
            "</td>" +
            '<td><span class="student-status ' +
            statusClass +
            '">' +
            statusText +
            "</span></td>" +
            "<td>Account created</td>" +
            "<td>" +
            actionHTML +
            "</td>" +
            "</tr>";
        }

        tableBody.innerHTML = tableHTML;
      }

      function changeStudentStatus(matricule) {
        let users = getData(KEYS.USERS);
        let studentFound = false;
        let newStatus = true;

        for (let i = 0; i < users.length; i++) {
          if (
            users[i].role === "student" &&
            String(users[i].matricule || "").trim() === matricule
          ) {
            newStatus = users[i].active === false;
            users[i].active = newStatus;
            studentFound = true;
            break;
          }
        }

        if (studentFound === false) {
          showStudentsMessage(
            "Registered student account was not found.",
            "danger",
          );
          return;
        }

        if (saveData(KEYS.USERS, users) === false) {
          showStudentsMessage("Could not save the student status.", "danger");
          return;
        }

        addLog(
          newStatus ? "Student Activated" : "Student Deactivated",
          "Student account status changed: " + matricule,
        );

        showStudentsMessage(
          newStatus
            ? "Student activated successfully."
            : "Student deactivated successfully.",
          "success",
        );
        displayStudents();
      }

      function showStudentsMessage(message, type) {
        document.getElementById("studentsMessage").innerHTML =
          '<div class="alert alert-' +
          type +
          ' mt-3">' +
          escapeHTML(message) +
          "</div>";
      }

      document
        .getElementById("studentSearch")
        .addEventListener("input", displayStudents);
      document
        .getElementById("statusFilter")
        .addEventListener("change", displayStudents);
      document
        .getElementById("studentsTableBody")
        .addEventListener("click", function (event) {
          let button = event.target.closest(".student-status-button");
          if (button !== null)
            changeStudentStatus(button.getAttribute("data-matricule"));
        });

      displayStudents();
    }
  })();
}
