import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { api } from "./api.js";
import "./index.css";

async function start() {
  await api.ready();
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

start();
