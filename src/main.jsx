import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../css/styles.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`, {
      scope: import.meta.env.BASE_URL,
    }).catch((error) => {
      console.error("CaliTrack could not enable offline support.", error);
    });
  });
}

createRoot(document.getElementById("root")).render(<App />);
