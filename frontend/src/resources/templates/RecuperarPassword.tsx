import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Heart, Home, ArrowLeft, Lock, Eye, EyeOff, KeyRound } from "lucide-react";

import { Footer } from './fragments/Footer';
import api from "../../api";

import "../static/Login.css";
import "../static/Global.css";

export function RecuperarPassword() {
  const navigate = useNavigate();
  
  // Estados de flujo
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  // Datos del formulario
  const [correo, setCorreo] = useState("");
  const [token, setToken] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");

  // Visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Estado para rastrear qué requisitos se van cumpliendo en tiempo real
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  // Función para validar la contraseña en tiempo real mientras se digita
  const handlePasswordChange = (password: string) => {
    setNuevaContrasena(password);

    setPasswordCriteria({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      specialChar: /[@$!%*?&._#\-+=¿¡]/.test(password),
    });
  };

  // Validar criterios de contraseña
  const esContrasenaValida = 
    passwordCriteria.length && 
    passwordCriteria.uppercase && 
    passwordCriteria.number && 
    passwordCriteria.specialChar;

  // Validar que el segundo formulario esté completamente correcto
  const formularioCompleto = 
    token.trim() !== "" && 
    esContrasenaValida && 
    nuevaContrasena === confirmar;

  // PASO 1: Solicitar el código al correo
  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/solicitar-recuperacion', { correo });
      setEnviado(true);
      alert("Código enviado. Revisa tu bandeja de entrada o spam.");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error al procesar la solicitud";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: Enviar el código junto con la nueva contraseña
  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nuevaContrasena !== confirmar) {
      return alert("Las contraseñas no coinciden.");
    }

    if (!esContrasenaValida) {
      return alert("La contraseña no cumple con todos los requisitos de seguridad.");
    }

    setLoading(true);
    try {
      // Usamos el mismo endpoint que procesa el token y la nueva clave
      await api.post('/auth/resetear-password', { token: token.trim(), nuevaContrasena });
      alert("Contraseña actualizada con éxito.");
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || "El código es inválido o ya expiró.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      
      <header className="sticky top-0 z-50">
        <div className="header-container">
          <div className="header-left">
            <Link to="/" title="Inicio"><Home className="w-7 h-7 text-white" /></Link>
          </div>
          <div className="header-center">
            <Link to="/" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-white fill-white" />
              <span className="brand-title text-white">MediExpress</span>
            </Link>
          </div>
          <div className="header-right"><div className="w-7"></div></div>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card text-center">
          <div className="logo-circle">
            <Heart />
          </div>

          {/* SINO HA ENVIADO EL CORREO: MUESTRA FORMULARIO DE SOLICITUD */}
          {!enviado ? (
            <>
              <h1>Recuperar Contraseña</h1>
              <p className="login-subtitle">Enviaremos un código de seguridad a tu correo</p> <br />

              <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                <div>
                  <label className="login-label">Correo Electrónico</label>
                  <div className="input-group">
                    <input
                      type="email"
                      className="login-input"
                      placeholder="Ingresa tu correo"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <Mail className="input-icon" />
                  </div>
                </div> <br />

                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Código"}
                </button>
              </form> <br />
            </>
          ) : (
            /* SI YA SE ENVIÓ EL CORREO: MUESTRA FORMULARIO PARA COLOCAR EL CÓDIGO Y LAS CLAVES */
            <>
              <h1 style={{ marginTop: '-10px' }}>Verificación</h1>
              <p className="login-subtitle">Introduce el código enviado a <strong>{correo}</strong></p> <br />

              <form onSubmit={handleRestablecer} className="space-y-4">
                
                {/* CAMPO: CÓDIGO DE VERIFICACIÓN */}
                <div>
                  <label className="login-label" style={{ marginBottom: '8px' }}>Código de Verificación (Expira en 5 min)</label>
                  <div className="input-group" style={{ marginBottom: '6px' }}>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="Ej: A1B2C3D4"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                    <KeyRound className="input-icon" />
                  </div>
                </div>

                {/* CAMPO: NUEVA CONTRASEÑA */}
                <div style={{ marginBottom: '6px' }}>
                  <label className="login-label">Nueva Contraseña</label>
                  <div className="input-group relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="login-input w-full pr-10"
                      style={{ paddingRight: '45px' }}
                      placeholder="Mínimo 8 caracteres"
                      value={nuevaContrasena}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                    />
                    <Lock className="input-icon" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* CAMPO: CONFIRMAR CONTRASEÑA */}
                <div>
                  <label className="login-label">Confirmar Contraseña</label>
                  <div className="input-group relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className="login-input w-full pr-10"
                      style={{ paddingRight: '45px' }}
                      placeholder="Repite tu contraseña"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      required
                    />
                    <Lock className="input-icon" />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {nuevaContrasena !== confirmar && confirmar.length > 0 && (
                    <p className="text-red-500 text-[11px] text-left mt-1">Las contraseñas no coinciden.</p>
                  )}
                  {/* CRITERIOS DE CONTRASEÑA EN TAMAÑO REDUCIDO */}
                    {nuevaContrasena.length > 0 && (
                      <div className="password-criteria text-left text-[11px] space-y-0.5 bg-gray-50/50 p-1.5 rounded border border-gray-100/50 mx-auto w-full">
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
                          <span>{passwordCriteria.specialChar ? "✓" : "○"}</span> Al menos un signo (@$!%*?&.)
                        </p>
                      </div>
                    )}
                </div> 

                {/* Botón de Envíos Dinámico adaptado a estilos globales inline */}
                <button 
                  type="submit" 
                  disabled={!formularioCompleto || loading}
                  className="login-button transition-all duration-300"
                  style={{ 
                    cursor: (formularioCompleto && !loading) ? 'pointer' : 'not-allowed',
                    opacity: (formularioCompleto && !loading) ? 1 : 0.65,
                    backgroundColor: (formularioCompleto && !loading) ? '#f97316' : '#e5e7eb',
                    color: (formularioCompleto && !loading) ? '#ffffff' : '#9ca3af',
                    boxShadow: (formularioCompleto && !loading) ? '0 4px 6px -1px rgba(249, 115, 22, 0.2)' : 'none'
                  }}
                >
                  {loading ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-orange-500 font-bold hover:underline">
              <ArrowLeft className="w-4 h-4"/> Volver al Login
            </Link>
          </div>
        </div>
      </main>

      <Footer/>

    </div>
  );
}