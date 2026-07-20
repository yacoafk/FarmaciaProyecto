// src/resources/templates/RegistroAdmin.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, ShieldCheck , Eye, EyeOff } from "lucide-react";

import api from "../../api";

import { DashboardHeader } from './fragments/DashboardHeader';
import "../static/RegAdmin.css";


export function RegistroAdmin() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        correo: "",
        contrasena: "",
        rol: "ADMINISTRADOR" // <--- Importante: Rol fijo
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/registro', formData);
            alert("Administrador creado con éxito");
            navigate("/dashboardHome");
        } catch (err: any) {
            alert("Error al registrar: " + (err.response?.data?.message || "Servidor no responde"));
        }
    };

    return (
        <div className="login-page-wrapper"><DashboardHeader />
            <div className="login-card">
                <div className="logo-circle"><ShieldCheck /></div>
                <h1>Nuevo Administrador</h1>
                <form onSubmit={handleSubmit}>
                    <br/>
                    <input 
                        type="text" 
                        className="login-input" 
                        placeholder="Nombre" 
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                    /><br/>
                    <input 
                        type="email" 
                        className="login-input" 
                        placeholder="Correo" 
                        onChange={(e) => setFormData({...formData, correo: e.target.value})} 
                    /><br/>

<div className="input-group relative mb-4">
  <input
    type={showPassword ? "text" : "password"}
    className="login-input w-full"
    style={{ paddingRight: '45px' }} // Espacio para que el texto no tape el ojo
    placeholder="Contraseña"
    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
    required
  />
  
  {/* Icono de Candado opcional (si lo usas en el resto del diseño) */}
  <Lock className="input-icon" />

  {/* BOTÓN DEL OJITO */}
  <button
    type="button" // Evita que el formulario se envíe al clickear el ojo
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>

<button type="submit" className="login-button">
  Registrar Admin
</button>

                    <br/>
                    <button type="submit" className="login-button">Registrar Admin</button>
                </form>
            </div>
        </div>
    );
}