import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/jost/latin-300.css";
import "@fontsource/jost/latin-400.css";
import "@fontsource/jost/latin-500.css";
import "@fontsource/barlow-condensed/latin-400.css";
import "./styles.css";
import App from "./App.jsx";
import { PlanProvider } from "../../src/plan.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlanProvider>
        <App />
      </PlanProvider>
    </BrowserRouter>
  </React.StrictMode>
);
