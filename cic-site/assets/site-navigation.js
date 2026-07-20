(function () {
  const breakpoint = window.matchMedia("(max-width: 1100px)");

  function closeDropdowns(nav, except) {
    nav.querySelectorAll(".nav-group.is-open").forEach((group) => {
      if (group === except) return;
      group.classList.remove("is-open");
      const button = group.querySelector(".nav-dropdown-toggle");
      if (button) button.setAttribute("aria-expanded", "false");
    });
  }

  function setMobileMenuState(header, nav, toggle, isOpen) {
    header.classList.toggle("is-nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");

    if (!isOpen) closeDropdowns(nav);

    if (breakpoint.matches) {
      nav.querySelectorAll(".nav-dropdown-toggle").forEach((button) => {
        button.setAttribute("aria-expanded", String(isOpen));
      });
    }
  }

  document.querySelectorAll(".site-header").forEach((header) => {
    const nav = header.querySelector(".main-nav");
    if (!nav) return;

    if (!nav.id) nav.id = "main-nav";

    let toggle = header.querySelector(".mobile-nav-toggle");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "mobile-nav-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-controls", nav.id);
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      toggle.innerHTML =
        '<span class="mobile-nav-toggle__bar"></span><span class="mobile-nav-toggle__bar"></span><span class="mobile-nav-toggle__bar"></span><span class="visually-hidden">Menu</span>';
      nav.parentNode.insertBefore(toggle, nav);
    }

    toggle.addEventListener("click", () => {
      const isOpen = !header.classList.contains("is-nav-open");
      setMobileMenuState(header, nav, toggle, isOpen);
    });

    nav.querySelectorAll(".nav-dropdown-toggle").forEach((button) => {
      button.addEventListener("click", (event) => {
        const group = button.closest(".nav-group");
        if (!group) return;

        if (breakpoint.matches) {
          button.setAttribute("aria-expanded", "true");
          return;
        }

        event.preventDefault();
        const isOpen = !group.classList.contains("is-open");
        closeDropdowns(nav, group);
        group.classList.toggle("is-open", isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
      });
    });

    document.addEventListener("click", (event) => {
      if (header.contains(event.target)) return;
      setMobileMenuState(header, nav, toggle, false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const wasOpen = header.classList.contains("is-nav-open");
      setMobileMenuState(header, nav, toggle, false);
      closeDropdowns(nav);
      if (wasOpen) toggle.focus();
    });

    breakpoint.addEventListener("change", () => {
      setMobileMenuState(header, nav, toggle, false);
      nav.querySelectorAll(".nav-dropdown-toggle").forEach((button) => {
        button.setAttribute("aria-expanded", "false");
      });
    });

    setMobileMenuState(header, nav, toggle, false);
  });
})();
