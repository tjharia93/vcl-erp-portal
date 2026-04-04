/**
 * VCL Login - ERPNext authentication frontend
 */
(function () {
  "use strict";

  var form = document.getElementById("loginForm");
  var button = document.getElementById("loginButton");
  var errorBox = document.getElementById("loginError");
  var usrInput = document.getElementById("usr");
  var pwdInput = document.getElementById("pwd");

  var buttonLabel = "Sign In";
  var buttonLoading = "Signing in\u2026";

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  function hideError() {
    errorBox.textContent = "";
    errorBox.style.display = "none";
  }

  function setLoading(loading) {
    button.disabled = loading;
    button.textContent = loading ? buttonLoading : buttonLabel;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideError();

    var usr = usrInput.value.trim();
    var pwd = pwdInput.value;

    if (!usr || !pwd) {
      showError("Please enter both your email/username and password.");
      return;
    }

    setLoading(true);

    fetch("/api/method/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frappe-CSRF-Token": getCSRFToken(),
      },
      body: JSON.stringify({ usr: usr, pwd: pwd }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (data) {
            throw new Error(
              data.message || "Invalid credentials. Please try again."
            );
          });
        }
        return response.json();
      })
      .then(function () {
        // Redirect on successful login
        window.location.href = "/employee";
      })
      .catch(function (error) {
        showError(error.message || "Login failed. Please check your credentials and try again.");
        setLoading(false);
      });
  });

  /**
   * Retrieve the Frappe CSRF token from the cookie.
   * ERPNext/Frappe sets this as a cookie named 'csrf_token'.
   */
  function getCSRFToken() {
    var match = document.cookie.match(
      new RegExp("(^|;\\s*)csrf_token=([^;]*)")
    );
    return match ? decodeURIComponent(match[2]) : "";
  }
})();
