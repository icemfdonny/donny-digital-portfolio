import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { loadTowns } from "./lib/geo";
import { applyTheme } from "./lib/profile";
import { applySchema } from "./lib/seo";

// The profile is read from the link (or storage) at import time; paint in the trade's colours from the start.
applyTheme();
applySchema();
void loadTowns();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
