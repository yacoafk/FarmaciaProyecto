import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from 'lucide-react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Package, 
  Truck, 
  UserPlus,
  LogOut 
} from "lucide-react";

import api from "../../api";

import { DashboardHeader } from './fragments/DashboardHeader';

//import { DashboardHeader } from './fragments/DashboardHeader';
import "../static/DashboardHome.css";

export function DashboardHome() {
  const navigate = useNavigate();
  const [hora, setHora] = useState(new Date().toLocaleTimeString());
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProductosStockBajo, setTotalProductosStockBajo] = useState(0);
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setHora(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Cantidad de clientes
  useEffect(() => {
    api.get("/perfil/total-clientes")
      .then((response) => {
        setTotalClientes(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener clientes:", error);
      });
  }, []);

  // 2. Cantidad de productos stock min
  useEffect(() => {
    api.get("/productos/stock-bajo")
      .then((response) => {
        setTotalProductosStockBajo(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // 3. Ventas de hoy
  useEffect(() => {
      api.get("/ventas/ventas-hoy")
          .then((response) => {
              setTotalVentasHoy(response.data);
          })
          .catch((error) => {
              console.error(error);
          });
  }, []);

  return (
    <div className="admin-main-container">

      <DashboardHeader />
  
      <main className="admin-content">

        {/* INDICADORES RÁPIDOS (KPIs) */}
        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon blue"><ShoppingBag/></div>
            <div className="kpi-data">
              <span>Ventas Hoy</span>
              <h3>s/ {totalVentasHoy}</h3>
            </div>
          </div>
          
          <div className="kpi-card">
            <div className="kpi-icon orange"><Package/></div>
            <div className="kpi-data">
              <span>Stock Bajo</span>
              <h3>{totalProductosStockBajo}</h3>
            </div>
          </div>

          {/* 3. Reemplazamos el valor estático por la variable del estado */}
          <div className="kpi-card">
            <div className="kpi-icon green"><Users/></div>
            <div className="kpi-data">
              <span>Clientes</span>
              <h3>{totalClientes}</h3>
            </div>
          </div>
        </section>

          {/* GRILLA DE MÓDULOS PRINCIPALES */}
          <div className="module-grid">

            <button className="module-card" onClick={() => navigate("/DashboardVentas")}>
              <div className="module-icon"><TrendingUp size={32}/></div>
              <div className="module-info">
                <h3>Ventas</h3>
                <p>Ver reportes e salidas</p>
              </div>
            </button>


            <button className="module-card" onClick={() => navigate("/DashboardCompras")}>
              <div className="module-icon"><TrendingUp size={32}/></div>
              <div className="module-info">
                <h3>Compras</h3>
                <p>Ver reportes e ingresos</p>
              </div>
            </button>


            <button className="module-card" onClick={() => navigate("/DashboardProductos")}>
              <div className="module-icon"><Package size={32}/></div>
              <div className="module-info">
                <h3>Productos</h3>
                <p>Gestionar catálogo</p>
              </div>
            </button>

            <button className="module-card" onClick={() => navigate("/DashboardPedidos")}>
              <div className="module-icon"><Truck size={32}/></div>
              <div className="module-info">
                <h3>Pedidos</h3>
                <p>Envíos y logística</p>
              </div>
            </button>

            <button className="module-card " onClick={() => navigate("/DashboardRegistro")}>
              <div className="module-icon"><UserPlus size={32}/></div>
              <div className="module-info">
                <h3>Nuevo Admin</h3>
                <p>Registrar personal</p>
              </div>
            </button>
            <button className="module-card " onClick={() => navigate("/DashboardUsuarios")}>
              <div className="module-icon"><UserPlus size={32}/></div>
              <div className="module-info">
                <h3>Gestionar Admins</h3>
                <p>Administrar personal</p>
              </div>
            </button>
          </div>
        </main>
        <br></br>

      </div>

  );
}