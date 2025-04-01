import React, { useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import TenantManager from "./components/TenantManager";
import Transforms from "./components/Transforms";
import TransformDetails from "./components/TransformDetails";
import TransformBuilder from "./components/TransformBuilder";
import TransformProjectDetails from "./components/builders/TransformProjectDetails";
import Sidebar from "./components/Sidebar";
import { DndProvider } from 'react-dnd/dist/core';
import { HTML5Backend } from 'react-dnd-html5-backend';
import "./styles/global.css";

const App: React.FC = () => {
  const [activeTenant, setActiveTenant] = useState<string | null>(() => {
    return localStorage.getItem("activeTenant") || null;
  });

  const [activeSection, setActiveSection] = useState<"tenants" | "transforms" | "transformbuilder">("tenants");

  return (
    <Router>
      <div className="app-container">
        <Sidebar
          activeTenant={activeTenant}
          setActiveTenant={setActiveTenant}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <div className="content">
          <DndProvider backend={HTML5Backend}>
            <Routes>
              <Route path="/" element={<TenantManager activeTenant={activeTenant} setActiveTenant={setActiveTenant} />} />
              <Route path="/transforms" element={<Transforms activeTenant={activeTenant} />} />
              <Route path="/transform/:tenantId/:transformId" element={<TransformDetails />} />
              <Route path="/transformbuilder" element={<TransformBuilder activeTenant={activeTenant} />} />
              <Route path="/transformproject/:tenantId/:projectId" element={<TransformProjectDetails />} />
            </Routes>
          </DndProvider>
        </div>
      </div>
    </Router>
  );
};

export default App;
