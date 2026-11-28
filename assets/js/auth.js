// ==========================================
// CampusHub - Authentication
// File: assets/js/auth.js
// ==========================================

// ==========================================
// 1. PASSWORD HASHING
// ==========================================

// NOTION NOUVELLE: Web Crypto API
// Cette méthode est utilisée pour la démonstration locale.
// Elle ne remplace pas un système d'authentification Backend.

async function hashPassword(password, salt) {
  let encoder = new TextEncoder();
  let passwordData = encoder.encode(salt + password);

  let hash = await crypto.subtle.digest("SHA-256", passwordData);
  let hashArray = Array.from(new Uint8Array(hash));

  let hashText = "";

  for (let i = 0; i < hashArray.length; i++) {
    hashText += hashArray[i].toString(16).padStart(2, "0");
  }

  return hashText;
}

function makeSalt() {
  let randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

// ==========================================
// 2. DEMO ADMIN ACCOUNT
// ==========================================

// NOTION NOUVELLE: compte administrateur de démonstration.
// Ces identifiants sont publics dans le code local.
// Ne jamais utiliser cette méthode pour un vrai site publié.

async function ensureDemoAdmin() {
  let users = getData(KEYS.USERS);
  let admin = null;

  // Rechercher le compte de démonstration par son Matricule exact.
  // Ne pas considérer un autre compte Admin comme preuve que ADMIN001 existe.
  for (let i = 0; i < users.length; i++) {
    if (
      String(users[i].matricule || "")
        .trim()
        .toUpperCase() === "ADMIN001"
    ) {
      admin = users[i];
      break;
    }
  }

  let salt = makeSalt();
  let passwordHash = await hashPassword("CampusHub@2026", salt);

  if (admin !== null) {
    // Réparer uniquement les identifiants du compte Admin de démonstration.
    // Cela corrige un ancien hash/salt incompatible sans toucher aux étudiants.
    admin.matricule = "ADMIN001";
    admin.role = "admin";
    admin.salt = salt;
    admin.passwordHash = passwordHash;
    admin.active = true;

    if (saveData(KEYS.USERS, users) === true) {
      return true;
    }

    return false;
  }

  // Créer ADMIN001 même si un autre compte Admin existe déjà.
  let newAdmin = {
    id: makeId(),
    matricule: "ADMIN001",
    firstName: "CampusHub",
    lastName: "Administrator",
    email: "admin@campushub.local",
    role: "admin",
    passwordHash: passwordHash,
    salt: salt,
    active: true,
    createdAt: new Date().toISOString(),
  };

  users.push(newAdmin);

  if (saveData(KEYS.USERS, users) === true) {
    addLog("Admin Initialization", "Demo administrator account initialized.");
    return true;
  }

  return false;
}

// ==========================================
// 3. DISPLAY MESSAGE
// ==========================================

function showMessage(elementId, message, type) {
  let element = document.getElementById(elementId);

  if (element !== null) {
    element.innerHTML =
      '<div class="alert alert-' + type + '">' + escapeHTML(message) + "</div>";
  }
}

// ==========================================
// 4. VERIFY STUDENT
// ==========================================

let verifiedStudent = null;

let verifyForm = document.getElementById("verifyForm");

if (verifyForm !== null) {
  verifyForm.addEventListener("submit", function (event) {
    event.preventDefault();

    let matricule = document.getElementById("regMatricule").value.trim();
    let code = document
      .getElementById("verificationCode")
      .value.trim()
      .toUpperCase();

    let students = getData(KEYS.APPROVED_STUDENTS);
    let users = getData(KEYS.USERS);

    if (matricule === "" || code === "") {
      showMessage(
        "verificationMessage",
        "Please enter your Matricule and Verification Code.",
        "danger",
      );

      return;
    }

    let student = null;

    for (let i = 0; i < students.length; i++) {
      if (String(students[i].matricule || "").trim() === matricule) {
        student = students[i];
        break;
      }
    }

    if (student === null) {
      showMessage("verificationMessage", "Matricule not found.", "danger");

      return;
    }

    if (
      String(student.code || "")
        .trim()
        .toUpperCase() !== code
    ) {
      showMessage(
        "verificationMessage",
        "Incorrect Verification Code.",
        "danger",
      );

      return;
    }

    if (student.used === true) {
      showMessage(
        "verificationMessage",
        "This Verification Code has already been used.",
        "danger",
      );

      return;
    }

    if (student.active === false) {
      showMessage(
        "verificationMessage",
        "This student account is not active.",
        "danger",
      );

      return;
    }

    for (let i = 0; i < users.length; i++) {
      if (String(users[i].matricule || "").trim() === matricule) {
        showMessage(
          "verificationMessage",
          "An account already exists for this Matricule.",
          "danger",
        );

        return;
      }
    }

    verifiedStudent = student;

    document.getElementById("passwordSection").classList.remove("d-none");

    let studentName = document.getElementById("verifiedStudentName");

    if (studentName !== null) {
      studentName.textContent =
        "Verified: " +
        (student.firstName || "") +
        " " +
        (student.lastName || "");
    }

    showMessage(
      "verificationMessage",
      "Verification successful. You can now create your password.",
      "success",
    );
  });
}

// ==========================================
// 5. CREATE STUDENT ACCOUNT
// ==========================================

let createAccountForm = document.getElementById("createAccountForm");

if (createAccountForm !== null) {
  createAccountForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (verifiedStudent === null) {
      showMessage(
        "accountMessage",
        "Please verify your student information first.",
        "danger",
      );

      return;
    }

    let password = document.getElementById("newPassword").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 8) {
      showMessage(
        "accountMessage",
        "Password must contain at least 8 characters.",
        "danger",
      );

      return;
    }

    if (password !== confirmPassword) {
      showMessage("accountMessage", "Passwords do not match.", "danger");

      return;
    }

    let users = getData(KEYS.USERS);
    let students = getData(KEYS.APPROVED_STUDENTS);

    for (let i = 0; i < users.length; i++) {
      if (users[i].matricule === verifiedStudent.matricule) {
        showMessage("accountMessage", "An account already exists.", "danger");

        return;
      }
    }

    let studentIndex = -1;

    for (let i = 0; i < students.length; i++) {
      if (
        String(students[i].matricule || "").trim() === verifiedStudent.matricule
      ) {
        studentIndex = i;
        break;
      }
    }

    if (
      studentIndex === -1 ||
      students[studentIndex].used === true ||
      String(students[studentIndex].code || "")
        .trim()
        .toUpperCase() !==
        document.getElementById("verificationCode").value.trim().toUpperCase()
    ) {
      showMessage(
        "accountMessage",
        "Student verification is no longer valid. Please verify again.",
        "danger",
      );

      return;
    }

    let salt = makeSalt();
    let passwordHash = await hashPassword(password, salt);

    let newUser = {
      id: makeId(),
      matricule: verifiedStudent.matricule,
      firstName: verifiedStudent.firstName || "",
      lastName: verifiedStudent.lastName || "",
      email: verifiedStudent.email || "",
      role: "student",
      passwordHash: passwordHash,
      salt: salt,
      active: true,
      createdAt: new Date().toISOString(),
    };

    // On prépare les deux tableaux avant de les enregistrer.
    users.push(newUser);
    students[studentIndex].used = true;
    students[studentIndex].code = "";

    let usersSaved = saveData(KEYS.USERS, users);

    if (usersSaved === false) {
      showMessage(
        "accountMessage",
        "Could not save your account. Please try again.",
        "danger",
      );

      return;
    }

    let studentsSaved = saveData(KEYS.APPROVED_STUDENTS, students);

    if (studentsSaved === false) {
      // Annuler l'ajout du compte si la validation du code n'a pas été enregistrée.
      users.pop();
      saveData(KEYS.USERS, users);

      showMessage(
        "accountMessage",
        "Could not complete registration. Please try again.",
        "danger",
      );

      return;
    }

    addLog(
      "Student Registration",
      "New student account created: " + newUser.matricule,
    );

    showMessage(
      "accountMessage",
      "Account created successfully. You can now log in.",
      "success",
    );

    createAccountForm.reset();
    document.getElementById("passwordSection").classList.add("d-none");
    verifyForm.reset();
    verifiedStudent = null;
  });
}

// ==========================================
// 6. STUDENT AND ADMIN LOGIN
// ==========================================

let loginForm = document.getElementById("loginForm");

if (loginForm !== null) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    let accountType = document.getElementById("accountType").value;
    let matricule = document.getElementById("matricule").value.trim();
    let password = document.getElementById("password").value;

    // Code supplémentaire : Vérifier le type de compte

    if (accountType === "") {
      showMessage("loginMessage", "Please select your account type.", "danger");

      return;
    }

    if (matricule === "" || password === "") {
      showMessage(
        "loginMessage",
        "Please enter your Matricule and Password.",
        "danger",
      );

      return;
    }

    if (!window.crypto || !crypto.subtle) {
      showMessage(
        "loginMessage",
        "Password security is unavailable. Open the project through localhost.",
        "danger",
      );

      return;
    }

    await ensureDemoAdmin();

    let users = getData(KEYS.USERS);
    let user = null;

    for (let i = 0; i < users.length; i++) {
      if (users[i].matricule === matricule) {
        user = users[i];
        break;
      }
    }

    if (user === null) {
      showMessage("loginMessage", "Incorrect Matricule or Password.", "danger");

      return;
    }

    // Code supplémentaire : Vérifier le rôle choisi

    if (user.role !== accountType) {
      showMessage(
        "loginMessage",
        "The selected account type does not match your account.",
        "danger",
      );

      return;
    }

    if (user.active === false) {
      showMessage(
        "loginMessage",
        "This account is currently inactive.",
        "danger",
      );

      return;
    }

    let enteredHash = await hashPassword(password, user.salt);

    if (enteredHash !== user.passwordHash) {
      showMessage("loginMessage", "Incorrect Matricule or Password.", "danger");

      return;
    }

    let sessionUser = {
      id: user.id,
      matricule: user.matricule,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    if (setSession(sessionUser) === false) {
      showMessage(
        "loginMessage",
        "Could not create your session. Please try again.",
        "danger",
      );

      return;
    }

    addLog("Login", "User logged in: " + user.matricule);

    if (user.role === "admin") {
      window.location.href = "admin/dashboard.html";
    } else if (user.role === "student") {
      window.location.href = "student/dashboard.html";
    }
  });
}
