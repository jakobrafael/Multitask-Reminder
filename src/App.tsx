import { HashRouter, Routes, Route } from "react-router-dom";
import { Settings } from "./pages/Settings";
import { Popup } from "./pages/Popup";
import "./App.css";

function App() {
  // CI trigger: minor change to retrigger workflow
  // CI rerun marker
  // rerun attempt: force new workflow by adding a comment
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Settings />} />
        <Route path="/popup" element={<Popup />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
