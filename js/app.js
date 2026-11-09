import "./workouts.js";

const tabs = document.querySelectorAll(".nav-tab");
const panels = document.querySelectorAll(".tab-panel");

function showTab(tab) {
  const selectedTab = tab.dataset.tab;

  tabs.forEach((item) => {
    const isSelected = item === tab;
    item.classList.toggle("is-active", isSelected);
    item.setAttribute("aria-selected", String(isSelected));
    item.tabIndex = isSelected ? 0 : -1;
  });

  panels.forEach((panel) => {
    panel.hidden = panel.id !== `${selectedTab}-panel`;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => showTab(tab));

  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    tabs[nextIndex].focus();
    showTab(tabs[nextIndex]);
  });
});
