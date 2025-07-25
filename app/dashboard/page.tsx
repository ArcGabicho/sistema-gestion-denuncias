"use client"

import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Inicio from "../pages/Inicio";
import Denuncias from "../pages/Denuncias";
import Denunciantes from "../pages/Denunciantes";
import Reportes from "../pages/Reportes";
import IA from "../pages/IA";

const Dashboard = () => {
  const [vistaActual, setVistaActual] = useState("Inicio");

  const renderVista = () => {
    switch (vistaActual) {
      case "Inicio":
        return <Inicio />;
      case "Denuncias":
        return <Denuncias />;
      case "Denunciantes":
        return <Denunciantes />;
      case "Reportes":
        return <Reportes />;
      case "IA":
        return <IA />;
      default:
        return <Inicio />;
    }
  };

  return (
    <section className="relative flex">
      <Sidebar onChangeVista={({ href }) => setVistaActual(href)} />
      <div className="ml-64 flex-1 overflow-auto">
        {renderVista()}
      </div>
    </section>
  );
};

export default Dashboard;