
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Keep the `.dark` class on <html> in sync with the OS theme as it changes live.
  // The initial value is set by the anti-FOUC script in index.html.
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = (e: MediaQueryList | MediaQueryListEvent) => {
    document.documentElement.classList.toggle("dark", e.matches);
  };
  apply(mql);
  mql.addEventListener?.("change", apply);

  createRoot(document.getElementById("root")!).render(<App />);
