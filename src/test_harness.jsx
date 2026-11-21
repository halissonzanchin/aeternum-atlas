import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import AtlasAIOrb from "./features/atlas-viewer/ai/AtlasAIOrb.jsx";
import "./features/atlas-viewer/ai/AtlasAIOrb.css";

function Harness() {
  const [state, setState] = useState("idle");
  const [intensity, setIntensity] = useState(0.8);
  const [size, setSize] = useState("md");

  window.__SET_ORB_STATE__ = (newState, newIntensity) => {
    setState(newState);
    if (typeof newIntensity === "number") setIntensity(newIntensity);
  };

  window.__GET_ORB_STATE__ = () => ({ state, intensity, size });

  return (
    <div id="orb-stage" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <AtlasAIOrb state={state} intensity={intensity} size={size} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Harness />);
