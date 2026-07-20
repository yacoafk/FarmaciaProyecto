import { useState, useEffect } from "react";
import { Search, Trash2, UserPlus, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Para que el botón de Crear funcione

import api from "../../api";

import "../static/DashboardUsuarios.css"; 
import { DashboardHeader } from './fragments/DashboardHeader';

export function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  
  // CORRECCIÓN 1: El estado inicial debe ser "TODOS" para que muestre datos al entrar
  const [rolFiltro, setRolFiltro] = useState("TODOS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      // Asegúrate de que la URL coincida con tu Backend
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

  // CORRECCIÓN 2: Lógica de filtrado con RETURN explícito
  const usuariosFiltrados = usuarios.filter(u => {
    const coincideTexto = 
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) || 
      u.correo.toLowerCase().includes(filtro.toLowerCase());
    
    const coincideRol = rolFiltro === "TODOS" || u.rol === rolFiltro;

    return coincideTexto && coincideRol; // Esto devuelve el resultado al array
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
          <button className="btn-add-admin"
            onClick={() => navigate("/admin/registro")}>
            <UserPlus size={18} />Crear Admin</button>
        </div><br></br>
      <div className="crud-card">
        <div className="main-table-area">
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
      </div>
    </div>
    </div>
      
  );
}