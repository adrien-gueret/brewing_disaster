let availableSections = [];
let nextSectionVars = {};

function isValidSection(sectionName) {
  return availableSections.includes(sectionName);
}

let onSectionChange = () => {};

function renderSection(sectionName) {
  const newSection = isValidSection(sectionName) ? sectionName : "title";

  if (newSection === document.body.dataset.currentSection) {
    return;
  }

  if (document.body.dataset.currentSection) {
    document.body.dataset.prevSection = document.body.dataset.currentSection;
  }

  const resultSectionChange = onSectionChange({
    nextSection: newSection,
    currentSection: document.body.dataset.prevSection,
    vars: nextSectionVars,
  });

  if (resultSectionChange !== false) {
    document.body.dataset.currentSection = newSection;
  } else {
    window.history.forward();
  }
}

export function goToSection(sectionName, vars = {}) {
  nextSectionVars = vars;
  window.location.hash = sectionName;
}

export default function init(onSectionChangeCallback) {
  onSectionChange = onSectionChangeCallback;

  let sectionSelectors = [];

  for (let section of document.querySelectorAll("section[id]")) {
    availableSections.push(section.id);

    sectionSelectors.push(
      `body[data-current-section="${section.id}"] section#${section.id}`
    );
  }

  document.head.insertAdjacentHTML(
    "beforeend",
    `<style>${sectionSelectors.join(",") + "{display:flex;}"}</style>`
  );

  function onHashChange() {
    renderSection(window.location.hash.substring(1));
  }

  window.addEventListener("hashchange", onHashChange);

  document.body.addEventListener("click", (e) => {
    if (e.target.tagName.toUpperCase() !== "A") {
      return;
    }

    nextSectionVars = JSON.parse(JSON.stringify(e.target.dataset));
  });

  goToSection(window.location.hash === "#rules" ? "rules" : "title");

  onHashChange();
}
