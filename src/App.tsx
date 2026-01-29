import { HashRouter, Routes, Route } from "react-router-dom";
import { Settings } from "./pages/Settings";
import { Popup } from "./pages/Popup";
import "./App.css";

function App() {
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
