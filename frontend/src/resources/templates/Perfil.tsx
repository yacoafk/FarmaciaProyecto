import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
// 🔄 CAMBIO: Agregados los íconos Eye y EyeOff para el control de visibilidad de contraseñas
import { User, MapPin, Package, Settings, LogOut, ArrowLeft, Save, Loader2, Eye, EyeOff } from "lucide-react";
import axios from "axios";

import { Header } from './fragments/Header';
import { Footer } from './fragments/Footer';

import "../static/Global.css";
import "../static/Perfil.css"; 

interface Usuario {
  id: number;
  nombre: string;
  correo: string; 
  rol: string; 
  intentos_fallidos: number;
  direccion?: string; 
  telefono?: string;
}

export function Perfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"menu" | "direcciones" | "configuracion">("menu");
  
  // --- Estados de Dirección ---
  const [direccionForm, setDireccionForm] = useState({ distrito: "", direccionExacta: "" });
  const [mensajeDireccion, setMensajeDireccion] = useState("");
  const [errorDireccion, setErrorDireccion] = useState(false);

  // --- Estados de Configuración ---
  const [configForm, setConfigForm] = useState({ nombre: "", telefono: "", password: "", confirmPassword: "" });
  const [mensajeConfig, setMensajeConfig] = useState("");
  const [errorConfig, setErrorConfig] = useState(false);
  
  // 🔄 CAMBIO: Estados para el manejo visual y de seguridad de la nueva contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail"); 

    if (!userEmail) {
      console.warn("No hay sesión activa. Redirigiendo al login...");
      navigate("/login");
      return;
    }
    
    const tiempoInicio = Date.now();
    
    axios.get(`http://localhost:8080/api/auth/buscar?correo=${userEmail}`)
      .then((res) => {
        setUsuario(res.data);
        
        setConfigForm(prev => ({ 
          ...prev, 
          nombre: res.data.nombre, 
          telefono: res.data.telefono || "" 
        }));

        if (res.data.direccion) {
          const partes = res.data.direccion.split(", ");
          setDireccionForm({
            direccionExacta: partes[0] || "",
            distrito: partes[1] || ""
          });
        }
        
        const tiempoTranscurrido = Date.now() - tiempoInicio;
        const tiempoRestante = Math.max(250 - tiempoTranscurrido, 0);

        setTimeout(() => {
          setLoading(false);
        }, tiempoRestante);
      })
      .catch((err) => {
        console.error("Error al conectar con PostgreSQL:", err);
        setTimeout(() => setLoading(false), 100);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail"); 
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId"); 
    navigate("/login");
  };

  // 🔄 CAMBIO: Lógica de posicionamiento y validación en tiempo real del Tooltip
  const handleFocus = () => {
    if (passwordInputRef.current) {
      const rect = passwordInputRef.current.getBoundingClientRect();
      setTooltipCoords({
        top: rect.top + window.scrollY + rect.height / 2,
        left: rect.right + window.scrollX + 15
      });
    }
    setShowTooltip(true);
  };

  const handlePasswordChange = (password: string) => {
    setConfigForm({ ...configForm, password: password });

    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*?&._#\-+=¿¡]/.test(password),
    });
  };

  // --- VALIDACIONES COMPLEMENTARIAS ---
  const esContrasenaValida =
    !configForm.password || // Es válida si está vacía (porque no desea cambiarla)
    (passwordCriteria.length &&
      passwordCriteria.uppercase &&
      passwordCriteria.number &&
      passwordCriteria.specialChar);

  const contrasenasCoinciden = configForm.password === configForm.confirmPassword;

  const formularioConfigCompleto =
    configForm.nombre.trim() !== "" &&
    esContrasenaValida &&
    contrasenasCoinciden;

  // --- 🛠️ VALIDACIONES Y ENVÍO DE DIRECCIÓN ---
  const handleGuardarDireccion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    const distritoClean = direccionForm.distrito.trim();
    const direccionExactaClean = direccionForm.direccionExacta.trim();

    if (distritoClean.length < 3 || direccionExactaClean.length < 5) {
      setErrorDireccion(true);
      setMensajeDireccion("❌ Por favor, ingresa datos de dirección más específicos.");
      return;
    }

    const regexValido = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ .,#°-]+$/;
    if (!regexValido.test(distritoClean) || !regexValido.test(direccionExactaClean)) {
      setErrorDireccion(true);
      setMensajeDireccion("❌ La dirección contiene caracteres no permitidos.");
      return;
    }

    const direccionCompleta = `${direccionExactaClean}, ${distritoClean}`;

    axios.put(`http://localhost:8080/api/perfil/${usuario.id}/datos`, {
      direccion: direccionCompleta
    })
    .then((res) => {
      setUsuario(res.data);
      setErrorDireccion(false);
      setMensajeDireccion("✅ Dirección de entrega guardada en la base de datos.");
      setTimeout(() => setMensajeDireccion(""), 3000);
    })
    .catch((err) => {
      console.error("Error al guardar dirección:", err);
      setErrorDireccion(true);
      setMensajeDireccion("❌ Error al conectar con el servidor.");
    });
  };

  // --- 🛠️ VALIDACIONES Y ENVÍO DE CONFIGURACIÓN ---
  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !formularioConfigCompleto) return;

    const nombreClean = configForm.nombre.trim();
    const telefonoClean = configForm.telefono.trim();

    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
    if (nombreClean.length < 3 || !regexNombre.test(nombreClean)) {
      setErrorConfig(true);
      setMensajeConfig("❌ El nombre debe contener solo letras y tener al menos 3 caracteres.");
      return;
    }

    if (telefonoClean) {
      const regexTelefono = /^9\d{8}$/;
      if (!regexTelefono.test(telefonoClean)) {
        setErrorConfig(true);
        setMensajeConfig("❌ El número de teléfono debe ser un celular válido de 9 dígitos (debe empezar con 9).");
        return;
      }
    }

    // Si escribió algo en el campo password, procesamos el cambio de clave
    if (configForm.password) {
      try {
        await axios.put(`http://localhost:8080/api/perfil/${usuario.id}/contrasena`, {
          nuevaContrasena: configForm.password
        });
      } catch (err) {
        console.error("Error al cambiar contraseña:", err);
        setErrorConfig(true);
        setMensajeConfig("❌ Error al actualizar la contraseña.");
        return;
      }
    }

    axios.put(`http://localhost:8080/api/perfil/${usuario.id}/datos`, {
      nombre: nombreClean,
      telefono: telefonoClean || null
    })
    .then((res) => {
      setUsuario(res.data);
      setErrorConfig(false);
      setMensajeConfig("✅ ¡Cambios guardados con éxito!");
      setConfigForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setPasswordCriteria({ length: false, uppercase: false, number: false, specialChar: false });
      setTimeout(() => setMensajeConfig(""), 3000);
    })
    .catch((err) => {
      console.error("Error al actualizar datos:", err);
      setErrorConfig(true);
      setMensajeConfig("❌ Error al guardar datos personales.");
    });
  };

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '15px', backgroundColor: '#f9fafb'
      }}>
        <Loader2 size={48} className="spinner-icon" style={{ color: '#f37907', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#63564b', fontSize: '1.1rem', fontWeight: 500, fontFamily: 'sans-serif' }}>
          Cargando tu perfil...
        </p>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <Header />
      <br />
      <main className="perfil-main">
        <div className="max-w-4xl mx-auto w-full px-4">
          <div className="perfil-card">
            
            {/* Banner de Cabecera */}
            <div className="perfil-banner">
              {view !== "menu" && (
                <button className="btn-back-perfil" onClick={() => setView("menu")}>
                  <ArrowLeft /> Volver
                </button>
              )}
              <div className="user-avatar-container">
                <User className="w-12 h-12" /> 
              </div>
              <h1 className="user-name">{usuario?.nombre || "Usuario"}</h1>
              <h1 className="user-email">{usuario?.correo || "correo@ejemplo.com"}</h1>
              
              {usuario?.rol === "ADMINISTRADOR" && (
                <span className="badge-admin">Modo Administrator</span>
              )}
            </div>

            {/* VISTA 1: MENÚ PRINCIPAL */}
            {view === "menu" && (
              <div className="perfil-options">
                <Link to="/perfil/mispedidos" className="perfil-option-item">
                  <div className="option-icon-box"><Package /></div>
                  <div className="option-text">
                    <h3>Mis Pedidos</h3>
                    <p>Ver historial de compras y recetas</p>
                  </div>
                  <span className="option-arrow">→</span>
                </Link>

                <button onClick={() => setView("direcciones")} className="perfil-option-item btn-menu-trigger">
                  <div className="option-icon-box"><MapPin /></div>
                  <div className="option-text">
                    <h3>Dirección de Entrega</h3>
                    <p>Gestionar tu punto de envío para delivery</p>
                  </div>
                  <span className="option-arrow">→</span>
                </button>

                <button onClick={() => setView("configuracion")} className="perfil-option-item btn-menu-trigger">
                  <div className="option-icon-box"><Settings /></div>
                  <div className="option-text">
                    <h3>Configuración</h3>
                    <p>Ajustes de seguridad y cuenta</p>
                  </div>
                  <span className="option-arrow">→</span>
                </button>
              </div>
            )}

            {/* VISTA 2: DIRECCIÓN */}
            {view === "direcciones" && (
              <div className="subview-container">
                <h2 className="subview-title">📍 Mi Dirección de Envío</h2>
                
                {mensajeDireccion && (
                  <div className={`mensaje-alerta-config ${errorDireccion ? "error-text" : "success-text"}`}>
                    {mensajeDireccion}
                  </div>
                )}

                <form onSubmit={handleGuardarDireccion} className="subview-form">
                  <h3>🏠 Actualizar Lugar de Entrega Frecuente</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '15px' }}>
                    Esta dirección se cargará automáticamente cuando realices tus pedidos por delivery.
                  </p>
                  
                  <div className="form-group-row">
                    <div style={{ width: '100%' }}>
                      <label>Distrito</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Santiago de Surco" 
                        value={direccionForm.distrito}
                        onChange={e => setDireccionForm({...direccionForm, distrito: e.target.value})}
                        required 
                        maxLength={50}
                      />
                    </div>
                  </div>

                  <label>Dirección Exacta</label>
                  <input 
                    type="text" 
                    placeholder="Av, Calle, Nro de casa, Departamento" 
                    value={direccionForm.direccionExacta}
                    onChange={e => setDireccionForm({...direccionForm, direccionExacta: e.target.value})}
                    required 
                    maxLength={100}
                  />

                  <button type="submit" className="btn-submit-subview">
                    <Save size={18} /> Guardar Dirección de Envío
                  </button>
                </form>
              </div>
            )}

            {/* VISTA 3: CONFIGURACIÓN (CON COMPORTAMIENTO INTEGRADO) */}
            {view === "configuracion" && (
              <div className="subview-container">
                <h2 className="subview-title">⚙️ Ajustes de Cuenta y Seguridad</h2>
                
                {mensajeConfig && (
                  <div className={`mensaje-alerta-config ${errorConfig ? "error-text" : "success-text"}`}>
                    {mensajeConfig}
                  </div>
                )}

                <form onSubmit={handleGuardarConfig} className="subview-form">
                  <h3>🔒 Actualizar Datos Personales</h3>
                  <label>Nombre Completo</label>
                  <input 
                    type="text" 
                    value={configForm.nombre}
                    onChange={e => {
                      const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");
                      setConfigForm({...configForm, nombre: soloLetras});
                    }}
                    required
                    maxLength={60}
                  />

                  <label>Número de Teléfono</label>
                  <input 
                    type="tel" 
                    placeholder="Ej: 987654321"
                    value={configForm.telefono}
                    onChange={e => {
                      const soloNumeros = e.target.value.replace(/\D/g, "");
                      setConfigForm({...configForm, telefono: soloNumeros});
                    }}
                    maxLength={9}
                  />

                  <h3 style={{ marginTop: '25px' }}>🔑 Cambiar Contraseña</h3>
                  
                  {/* INPUT NUEVA CONTRASEÑA CON INTERFAZ DE REGISTRO */}
                  <label>Nueva Contraseña <span className="text-gray-400 font-normal text-xs">(Dejar en blanco para mantener actual)</span></label>
                  <div className="input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      ref={passwordInputRef}
                      type={showPassword ? "text" : "password"} 
                      placeholder="Mínimo 8 caracteres"
                      value={configForm.password}
                      onChange={e => handlePasswordChange(e.target.value)}
                      onFocus={handleFocus}
                      onBlur={() => setShowTooltip(false)}
                      maxLength={32}
                      className="w-full"
                      style={{ paddingRight: '45px' }} // Evita que el texto se superponga con el icono
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        position: 'absolute', 
                        right: '12px',
                        top: '40%',                  // 👈 Mueve el botón al 50% del contenedor
                        transform: 'translateY(-50%)', // 👈 Eje central exacto verticalmente
                        display: 'flex',             // 👈 Asegura que el SVG interno se alinee
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* INPUT CONFIRMAR CONTRASEÑA */}
                  <label style={{ marginTop: '12px' }}>Confirmar Nueva Contraseña</label>
                  <div className="input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Repite tu nueva clave"
                      value={configForm.confirmPassword}
                      onChange={e => setConfigForm({...configForm, confirmPassword: e.target.value})}
                      maxLength={32}
                      className="w-full"
                      style={{ paddingRight: '45px' }} // Evita que el texto se superponga con el icono
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-orange-500 transition-colors"
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        position: 'absolute', 
                        right: '12px',
                        top: '40%',                  // 👈 Mueve el botón al 50% del contenedor
                        transform: 'translateY(-50%)', // 👈 Eje central exacto verticalmente
                        display: 'flex',             // 👈 Asegura que el SVG interno se alinee
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {/* Alerta de contraseñas no coincidentes */}
                  {configForm.password.length > 0 && !contrasenasCoinciden && (
                    <p className="text-red-500 text-left text-[11px] mt-1 ml-1 font-medium">
                      ✕ Las contraseñas no coinciden.
                    </p>
                  )}

                  <button 
                    type="submit" 
                    disabled={!formularioConfigCompleto}
                    className={`btn-submit-subview save-btn mt-4 transition-all duration-300 ${
                      formularioConfigCompleto ? "" : "opacity-50 cursor-not-allowed"
                    }`}
                    style={{
                      backgroundColor: formularioConfigCompleto ? '#f97316' : '#e5e7eb',
                      color: formularioConfigCompleto ? '#ffffff' : '#9ca3af'
                    }}
                  >
                    <Save size={18} /> Guardar Configuración
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Botón de Logout */}
          {view === "menu" && (
            <button onClick={handleLogout} className="btn-logout">
              <LogOut className="w-6 h-6" />
              Cerrar Sesión
            </button>
          )}
          <br />
        </div>
      </main>

      {/* 🌟 TOOLTIP FLOTANTE DINÁMICO (INYECTADO AL FINAL DEL BODY) 🌟 */}
      {showTooltip && configForm.password.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            top: `${tooltipCoords.top}px`,
            left: `${tooltipCoords.left}px`,
            transform: 'translateY(-50%)',
            zIndex: 99999,
            width: '290px',
            backgroundColor: '#edf2f7',
            padding: '16px',
            borderRadius: '14px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            pointerEvents: 'none'
          }}
        >
          <p style={{ color: '#4a5568', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
            La nueva contraseña debe cumplir:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <p style={{ color: passwordCriteria.length ? '#16a34a' : '#dc2626', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{passwordCriteria.length ? "✓" : "✕"}</span> Mínimo 8 caracteres.
            </p>
            <p style={{ color: passwordCriteria.uppercase ? '#16a34a' : '#dc2626', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{passwordCriteria.uppercase ? "✓" : "✕"}</span> Al menos una mayúscula.
            </p>
            <p style={{ color: passwordCriteria.number ? '#16a34a' : '#dc2626', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{passwordCriteria.number ? "✓" : "✕"}</span> Al menos un número.
            </p>
            <p style={{ color: passwordCriteria.specialChar ? '#16a34a' : '#dc2626', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{passwordCriteria.specialChar ? "✓" : "✕"}</span> Al menos un signo (@$!%*?&.).
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}