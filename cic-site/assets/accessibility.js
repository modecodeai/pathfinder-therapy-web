
(function(){
  const STORAGE_KEY = "pathfinder_accessibility_v1";
  const panel = document.getElementById("accessibilityPanel");
  const toggle = document.getElementById("accessibilityToggle");
  const close = document.querySelector("[data-a11y-close]");

  const defaultState = {
    fontScale: 0,
    contrast: false,
    links: false,
    readable: false,
    motion: false
  };

  function loadState(){
    try {
      return Object.assign({}, defaultState, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch {
      return Object.assign({}, defaultState);
    }
  }

  function saveState(state){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function applyState(state){
    const root = document.documentElement;
    const body = document.body;

    body.classList.toggle("a11y-high-contrast", !!state.contrast);
    body.classList.toggle("a11y-underline-links", !!state.links);
    body.classList.toggle("a11y-readable-font", !!state.readable);
    body.classList.toggle("a11y-reduce-motion", !!state.motion);

    root.style.setProperty("--a11y-font-scale", String(1 + (state.fontScale * 0.1)));
  }

  let state = loadState();
  applyState(state);

  function openPanel(){
    if (!panel || !toggle) return;
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  function closePanel(){
    if (!panel || !toggle) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle) {
    toggle.addEventListener("click", function(){
      if (panel.hidden) openPanel();
      else closePanel();
    });
  }

  if (close) close.addEventListener("click", closePanel);

  document.addEventListener("click", function(event){
    const action = event.target.getAttribute("data-a11y-action");
    const toggleName = event.target.getAttribute("data-a11y-toggle");

    if (action === "font-increase") {
      state.fontScale = Math.min(3, state.fontScale + 1);
    }

    if (action === "font-decrease") {
      state.fontScale = Math.max(-1, state.fontScale - 1);
    }

    if (action === "reset") {
      state = Object.assign({}, defaultState);
    }

    if (toggleName && Object.prototype.hasOwnProperty.call(state, toggleName)) {
      state[toggleName] = !state[toggleName];
      event.target.classList.toggle("is-active", state[toggleName]);
    }

    if (action || toggleName) {
      saveState(state);
      applyState(state);
    }
  });

  document.addEventListener("keydown", function(event){
    if (event.key === "Escape" && panel && !panel.hidden) {
      closePanel();
    }
  });
})();
