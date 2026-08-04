import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./context/LanguageContext";
import "./styles/globals.css";
import "./styles/CrystalGlassSystem.css";
import "./styles/AeternumOpticalGlass.css";
import "./styles/A26Foundation.css";
import "./styles/A26Shell.css";
import "./styles/A26DailyExperience.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);
