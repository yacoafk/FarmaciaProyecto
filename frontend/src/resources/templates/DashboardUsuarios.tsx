import { useState, useEffect } from "react";
import { Search, Trash2, UserPlus, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom"; 

import api from "../../api";

import "../static/DashboardUsuarios.css"; 
import { DashboardHeader } from './fragments/DashboardHeader';

export function DashboardUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [rolFiltro, setRolFiltro] = useState("TODOS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/usuarios");
      setUsuarios(res.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id: number) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await api.delete(`/auth/usuarios/${id}`);
        cargarUsuarios();
      } catch (error) {
        alert("Error al eliminar");
      }
    }
  };

  const cambiarRol = async (id: number, rolActual: string) => {
    try {
      const nuevoRol = rolActual === "ADMINISTRADOR" ? "Usuario" : "ADMINISTRADOR";
      const usuario = usuarios.find(u => u.id === id);
      await api.put(`/auth/usuarios/${id}`, { ...usuario, rol: nuevoRol });
      cargarUsuarios();
    } catch (error) {
      alert("Error al actualizar el rol");
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideTexto = 
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
      u.correo.toLowerCase().includes(filtro.toLowerCase());
    
    const coincideRol = rolFiltro === "TODOS" || u.rol === rolFiltro;

    return coincideTexto && coincideRol;
  });

  return (
    <div className="dashboard-container">
      <DashboardHeader />

      <div className="dashboard-container2">
        <div className="dashboard-header">
          <h1>Gestión de Usuarios</h1>
          
          <div className="toolbar">
            <div className="search-container">
              <Search className="input-icon" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o correo..." 
                className="search-input"
                onChange={(e) => setFiltro(e.target.value)}
              />
            </div>
            <select 
              className="filter-select"
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
            >
              <option value="TODOS">Todos los Roles</option>
              <option value="ADMINISTRADOR">Administradores</option>
              <option value="Usuario">Usuarios</option>
            </select>
          </div>
        </div>

        <div className="side-panel">
          <h4>Acciones</h4>
          <button className="btn-add-admin" onClick={() => navigate("/DashboardRegistro")}>
            <UserPlus size={18} />Crear Admin
          </button>
        </div>
        <br />

        <div className="crud-card">
          {/* ================= VISTA DE TABLA (ESCRITORIO) ================= */}
          <div className="main-table-area desktop-only">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol Actual</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((u) => (
                    <tr key={u.id}>
                      <td>{u.nombre}</td>
                      <td>{u.correo}</td>
                      <td>
                        <span className={`role-badge ${u.rol === 'ADMINISTRADOR' ? 'admin' : 'user'}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          onClick={() => cambiarRol(u.id, u.rol)}
                          className="btn-icon edit"
                          title="Cambiar Rol"
                        >
                          <Shield size={18} />
                        </button>
                        <button 
                          onClick={() => eliminarUsuario(u.id)}
                          className="btn-icon delete"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-10 text-gray-400">
                      No se encontraron usuarios con esos criterios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ================= VISTA DE TARJETAS (MÓVIL) ================= */}
          <div className="mobile-cards-area mobile-only">
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((u) => (
                <div key={u.id} className="user-responsive-card">
                  <div className="card-row">
                    <span className="card-label">Usuario:</span>
                    <span className="card-value username-text">{u.nombre}</span>
                  </div>
                  
                  <div className="card-row">
                    <span className="card-label">Correo:</span>
                    <span className="card-value code-text">{u.correo}</span>
                  </div>
                  
                  <div className="card-row">
                    <span className="card-label">Rol Actual:</span>
                    <span className="card-value">
                      <span className={`role-badge ${u.rol === 'ADMINISTRADOR' ? 'admin' : 'user'}`}>
                        {u.rol}
                      </span>
                    </span>
                  </div>

                  <div className="card-actions">
                    <button 
                      onClick={() => cambiarRol(u.id, u.rol)}
                      className="btn-responsive-action edit-btn"
                    >
                      <Shield size={16} /> Cambiar Rol
                    </button>
                    <button 
                      onClick={() => eliminarUsuario(u.id)}
                      className="btn-responsive-action delete-btn"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results-mobile">
                No se encontraron usuarios con esos criterios.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}