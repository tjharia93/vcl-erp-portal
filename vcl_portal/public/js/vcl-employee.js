/**
 * VCL Employee Portal - Session check and user greeting
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    checkSession();
    setupMobileToggle();
  });

  /**
   * Check if the user is logged in via ERPNext session.
   * If not authenticated, redirect to login.
   * If authenticated, populate the user greeting.
   */
  function checkSession() {
    fetch("/api/method/frappe.auth.get_logged_user", {
      method: "GET",
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        return response.json();
      })
      .then(function (data) {
        var user = data.message;
        if (!user || user === "Guest") {
          window.location.href = "/login";
          return;
        }
        setUserDisplay(user);
      })
      .catch(function () {
        window.location.href = "/login";
      });
  }

  /**
   * Set the user name in the header and greeting.
   * Uses the full_name from the session if available,
   * otherwise falls back to the email/username.
   */
  function setUserDisplay(user) {
    var displayName = user;

    // Try to get the full name from ERPNext
    fetch("/api/method/frappe.client.get_value", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frappe-CSRF-Token": getCSRFToken(),
      },
      body: JSON.stringify({
        doctype: "User",
        filters: { name: user },
        fieldname: "full_name",
      }),
    })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        if (data && data.message && data.message.full_name) {
          displayName = data.message.full_name;
        }
        applyName(displayName);
      })
      .catch(function () {
        applyName(displayName);
      });
  }

  function applyName(name) {
    var nameEl = document.getElementById("portalUserName");
    var greetingEl = document.getElementById("portalGreeting");

    if (nameEl) {
      nameEl.textContent = name;
    }
    if (greetingEl) {
      greetingEl.textContent = "Welcome back, " + name;
    }
  }

  function setupMobileToggle() {
    var toggle = document.querySelector(".vcl-mobile-toggle");
    var navLinks = document.querySelector(".vcl-nav-links");

    if (toggle && navLinks) {
      toggle.addEventListener("click", function () {
        navLinks.classList.toggle("open");
        toggle.setAttribute(
          "aria-expanded",
          navLinks.classList.contains("open")
        );
      });
    }
  }

  function getCSRFToken() {
    var match = document.cookie.match(
      new RegExp("(^|;\\s*)csrf_token=([^;]*)")
    );
    return match ? decodeURIComponent(match[2]) : "";
  }
})();
