/**
 * VCL Homepage - Mobile navigation toggle and smooth scroll
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // Mobile menu toggle
    var toggle = document.querySelector(".vcl-mobile-toggle");
    var navLinks = document.querySelector(".vcl-nav-links");

    if (toggle && navLinks) {
      toggle.addEventListener("click", function () {
        navLinks.classList.toggle("open");
        var expanded = navLinks.classList.contains("open");
        toggle.setAttribute("aria-expanded", expanded);
      });

      // Close mobile menu when a nav link is clicked
      navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          navLinks.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        var targetId = this.getAttribute("href");
        if (targetId === "#") return;

        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  });
})();
