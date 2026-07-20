// src/resources/templates/RegistroAdmin.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";

import api from "../../api";

import { DashboardHeader } from './fragments/DashboardHeader';
import "../static/RegAdmin.css";

export function DashboardRegistro() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        nombre: "",
        correo: "",
        contrasena: "",
        rol: "ADMINISTRADOR" // <--- Importante: Rol fijo
    });

    // Estado para rastrear qué requisitos se van cumpliendo en tiempo real
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
    });

    // Función para validar la contraseña en tiempo real mientras se digita
    const handlePasswordChange = (password: string) => {
        setFormData({ ...formData, contrasena: password });

        setPasswordCriteria({
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            specialChar: /[@$!%*?&._#\-+=¿¡]/.test(password),
        });
    };

    // 1. Validar criterios de contraseña
    const esContrasenaValida = 
        passwordCriteria.length && 
        passwordCriteria.uppercase && 
        passwordCriteria.number && 
        passwordCriteria.specialChar;

    // 🔄 Validar que todos los campos requeridos estén llenos y limpios
    const formularioCompleto = 
        formData.nombre.trim() !== "" && 
        formData.correo.trim() !== "" && 
        esContrasenaValida;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formularioCompleto) {
            alert("Por favor, completa todos los campos correctamente.");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/registro', formData);
            
            if (response.status === 200 || response.status === 201) {
                alert("¡Administrador creado con éxito!");
                navigate('/dashboardHome'); 
            }
        } catch (err: any) {
            if (err.response) {
                const mensajeError = err.response.data.message || "Error al registrarse";
                alert(mensajeError);
            } else {
                alert("No se pudo conectar con el servidor.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            <DashboardHeader />
            <div className="login-card">
                <div className="logo-circle">
                    <ShieldCheck />
                </div>
                <h1>Nuevo Administrador</h1>
                
                <form onSubmit={handleSubmit}>
                    <br/>
                    
                    {/* CAMPO: NOMBRE COMPLETO (Bloquea números en tiempo real) */}
                    <div style={{ marginBottom: '12px' }}>
                        <div className="input-group">
                            <input 
                                type="text" 
                                className="login-input" 
                                placeholder="Nombre Completo" 
                                value={formData.nombre}
                                onChange={(e) => {
                                    // Bloquea números y signos extraños, solo permite letras, tildes, espacios y la Ñ
                                    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");
                                    setFormData({ ...formData, nombre: soloLetras });
                                }}
                                required 
                                maxLength={60}
                                disabled={loading}
                            />
                            <User className="input-icon" />
                        </div>
                    </div>

                    {/* CAMPO: CORREO ELECTRÓNICO */}
                    <div style={{ marginBottom: '12px' }}>
                        <div className="input-group">
                            <input 
                                type="email" 
                                className="login-input" 
                                placeholder="Correo" 
                                value={formData.correo}
                                onChange={(e) => setFormData({ ...formData, correo: e.target.value })} 
                                required
                                disabled={loading}
                            />
                            <Mail className="input-icon" />
                        </div>
                    </div>

                    {/* CAMPO: CONTRASEÑA */}
                    <div className="input-group relative mb-4">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="login-input w-full"
                            style={{ paddingRight: '45px' }} // Espacio para que el texto no tape el ojo
                            placeholder="Contraseña"
                            value={formData.contrasena}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            required
                            disabled={loading}
                        />
                        
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

                    {/* CRITERIOS DE CONTRASEÑA EN TAMAÑO REDUCIDO */}
                    {formData.contrasena.length > 0 && (
                        <div className="password-criteria mb-4 text-left text-[11px] space-y-0.5 bg-gray-50/50 p-1.5 rounded border border-gray-100/50">
                            <p className={`${passwordCriteria.length ? "text-green-600 font-medium" : "text-gray-400"} flex items-center gap-1`}>
                                <span>{passwordCriteria.length ? "✓" : "○"}</span> Mínimo 8 caracteres
                            </p>
                            <p className={`${passwordCriteria.uppercase ? "text-green-600 font-medium" : "text-gray-400"} flex items-center gap-1`}>
                                <span>{passwordCriteria.uppercase ? "✓" : "○"}</span> Al menos una mayúscula
                            </p>
                            <p className={`${passwordCriteria.number ? "text-green-600 font-medium" : "text-gray-400"} flex items-center gap-1`}>
                                <span>{passwordCriteria.number ? "✓" : "○"}</span> Al menos un número
                            </p>
                            <p className={`${passwordCriteria.specialChar ? "text-green-600 font-medium" : "text-gray-400"} flex items-center gap-1`}>
                                <span>{passwordCriteria.specialChar ? "✓" : "○"}</span> Al menos un signo (@$!%*?&._#\-+=¿¡)
                            </p>
                        </div>
                    )}

                    {/* BOTÓN DE ACCIÓN */}
                    <button 
                        type="submit" 
                        disabled={!formularioCompleto || loading}
                        className={`login-button mt-4 transition-all duration-300 ${
                            (formularioCompleto && !loading)
                                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                        }`} 
                        style={{ 
                            marginBottom: '6px',
                            backgroundColor: (formularioCompleto && !loading) ? '#f97316' : '#e5e7eb',
                            color: (formularioCompleto && !loading) ? '#ffffff' : '#9ca3af'
                        }}
                    >
                        {loading ? "Registrando..." : "Registrar Admin"}
                    </button>
                </form>
            </div>
        </div>
    );
}