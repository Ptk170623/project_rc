import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { api } from "./api.js";
import "./index.css";

// HashRouter (not BrowserRouter): static hosts like GitHub Pages have no
// server-side rewrite, so a reload on a sub-route would 404 otherwise.
async function start() {
  await api.ready();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}

start();
