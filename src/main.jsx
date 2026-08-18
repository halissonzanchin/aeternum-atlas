import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/globals.css";
import "./styles/CrystalGlassSystem.css";
import "./styles/AeternumOpticalGlass.css";
import "./styles/A26Foundation.css";
import "./styles/A26Shell.css";
import "./styles/A26DailyExperience.css";
import "./styles/A26StudentConsolidation.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>
);

