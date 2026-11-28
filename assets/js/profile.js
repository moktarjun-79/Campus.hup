if (document.getElementById("profileForm")) {
    (function () {
        const student = currentUser();

        if (!student || student.role !== "student") {
            window.location.href = "../login.html";
            return;
        }

        const profileForm = document.getElementById("profileForm");
        const messageBox = document.getElementById("serviceMessage");
        const logoutButton = document.getElementById("logoutBtn");
        const studentName = document.getElementById("studentName");

        if (studentName) {
            const fullName = ((student.firstName || "") + " " + (student.lastName || "")).trim();
            studentName.textContent = fullName || student.matricule || "Student";
        }

        function showProfileMessage(message, type) {
            if (!messageBox) return;

            messageBox.innerHTML =
                '<div class="alert alert-' + (type || "success") + '">' +
                escapeHTML(message) + "</div>";
        }

        function renderProfile() {
            const users = getData(KEYS.USERS);
            const user = users.find(function (item) {
                return item.id === student.id;
            });

            if (!user) {
                showProfileMessage("Your account information could not be found.", "warning");
                return;
            }

            document.getElementById("profileFirstName").value = user.firstName || "";
            document.getElementById("profileLastName").value = user.lastName || "";
            document.getElementById("profileEmail").value = user.email || "";
            document.getElementById("profileDepartment").value = user.department || "";

            const resourcesCount = getData(KEYS.RESOURCES).filter(function (item) {
                return item.userId === student.id;
            }).length;

            const postsCount = getData(KEYS.POSTS).filter(function (item) {
                return item.userId === student.id;
            }).length;

            const projectsCount = getData(KEYS.PROJECTS).filter(function (item) {
                return item.userId === student.id;
            }).length;


            document.getElementById("myActivity").innerHTML = `
                <div class="row g-3">
                    <div class="col-6 col-lg-3">
                        <div class="service-item profile-stat">
                            <h4>${resourcesCount}</h4>
                            <small>Resources shared</small>
                        </div>
                    </div>
                    <div class="col-6 col-lg-3">
                        <div class="service-item profile-stat">
                            <h4>${postsCount}</h4>
                            <small>Community posts</small>
                        </div>
                    </div>
                    <div class="col-6 col-lg-3">
                        <div class="service-item profile-stat">
                            <h4>${projectsCount}</h4>
                            <small>Projects created</small>
                        </div>
                    </div>
                </div>
            `;
        }

        profileForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const users = getData(KEYS.USERS);
            const userIndex = users.findIndex(function (item) {
                return item.id === student.id;
            });

            if (userIndex === -1) {
                showProfileMessage("Your account could not be updated.", "danger");
                return;
            }

            const firstName = document.getElementById("profileFirstName").value.trim();
            const lastName = document.getElementById("profileLastName").value.trim();
            const email = document.getElementById("profileEmail").value.trim();
            const department = document.getElementById("profileDepartment").value.trim();

            if (!firstName || !lastName || !email) {
                showProfileMessage("Please complete the required fields.", "warning");
                return;
            }

            users[userIndex].firstName = firstName;
            users[userIndex].lastName = lastName;
            users[userIndex].email = email;
            users[userIndex].department = department;
            users[userIndex].updatedAt = new Date().toISOString();

            if (!saveData(KEYS.USERS, users)) {
                showProfileMessage("The changes could not be saved.", "danger");
                return;
            }

            student.firstName = firstName;
            student.lastName = lastName;
            student.email = email;
            student.department = department;
            setSession(student);

            document.getElementById("studentName").textContent =
                (firstName + " " + lastName).trim();

            addLog("Profile", "Student profile updated");
            showProfileMessage("Your profile has been updated.");
            renderProfile();
        });

        if (logoutButton) {
            logoutButton.addEventListener("click", function () {
                if (confirm("Are you sure you want to logout?")) {
                    addLog("Logout", "Student logged out: " + student.matricule);
                    logoutUser();
                }
            });
        }

        renderProfile();
    })();
}
