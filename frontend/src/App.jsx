import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"; // 👈 Añadidos Navigate y Outlet aquí
import api from './api';

import { Inicio } from "./resources/templates/Inicio";
import { Login } from "./resources/templates/Login";
import { Carrito } from "./resources/templates/Carrito";
import { Perfil } from "./resources/templates/Perfil";
import { MisPedidos } from "./resources/templates/MisPedidos";
import { Registro } from "./resources/templates/Registro";
import { RecuperarPassword } from "./resources/templates/RecuperarPassword";

import { DashboardProductos } from './resources/templates/DashboardProductos';
import { DashboardHome } from "./resources/templates/DashboardHome";
import { DashboardVentas } from "./resources/templates/DashboardVentas";
import { DashboardCompras } from "./resources/templates/DashboardCompras";
import { DashboardPedidos} from "./resources/templates/DashboardPedidos";
import { DashboardUsuarios } from "./resources/templates/DashboardUsuarios";
import { DashboardRegistro } from "./resources/templates/DashboardRegistro";

// ====================================================================
// 🛡️ COMPONENTE INTERNO DE PROTECCIÓN (Todo en la misma pestaña)
// ====================================================================
  const ProtectedRoute = ({ allowedRoles }) => {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Normalizar rol (por si viene en mayúsculas)
    const userRole = user.rol?.toLowerCase();

    if (allowedRoles && !allowedRoles.some(role => role.toLowerCase() === userRole)) {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  };
// ====================================================================
// 🚀 COMPONENTE PRINCIPAL
// ====================================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* === RUTAS PÚBLICAS === */}
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<RecuperarPassword />} />

        {/* === RUTAS PROTEGIDAS PARA CUALQUIER USUARIO LOGUEADO === */}
        <Route element={<ProtectedRoute />}>
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/mispedidos" element={<MisPedidos />} />
        </Route>

        {/* === RUTAS DEL DASHBOARD PROTEGIDAS POR ROL (Admin/Empleado) === */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'ADMINISTRADOR', 'empleado']} />}>
          <Route path="/DashboardHome" element={<DashboardHome />} />
          <Route path="/DashboardVentas" element={<DashboardVentas />} />
          <Route path="/DashboardCompras" element={<DashboardCompras />} />
          <Route path="/DashboardProductos" element={<DashboardProductos />} />
          <Route path="/DashboardPedidos" element={<DashboardPedidos />} />
          <Route path="/DashboardRegistro" element={<DashboardRegistro />} />
          <Route path="/DashboardUsuarios" element={<DashboardUsuarios />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;