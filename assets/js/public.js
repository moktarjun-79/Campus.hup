function verif() {
  var nom = document.getElementById("contactName").value;
  var email = document.getElementById("contactEmail").value;
  var sujet = document.getElementById("contactSubject").value;
  var message = document.getElementById("contactMessage").value;

  if (nom == "" || email == "" || sujet == "" || message == "") {
    alert("Please fill in all fields.");
    return false;
  }

  var messages = JSON.parse(localStorage.getItem("campushub_contact_messages") || "[]");
  messages.push({ name: nom, email: email, subject: sujet, message: message, date: new Date().toLocaleString() });
  localStorage.setItem("campushub_contact_messages", JSON.stringify(messages));

  document.getElementById("contactResult").innerHTML =
    "<div class='alert alert-success'>Your message has been sent successfully!</div>";
  document.getElementById("contactForm").reset();
  return false;
}
