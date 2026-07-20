import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, Heart, Home, Eye, EyeOff, Mail, Fingerprint, Phone } from "lucide-react";

import { Footer } from './fragments/Footer';
import api from "../../api"; // Tu configuración de axios

import "../static/Login.css";
import "../static/Global.css";

export function Registro() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estado para controlar la visibilidad del cuadro flotante
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Referencia para saber la posición exacta en pantalla del campo Password
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });

  // Estado del formulario vinculado a la BD y Spring
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    correo: "",
    dni: "",
    telefono: "", // Opcional
    contrasena: "",
    rol: "Usuario"
  });

  // Estado separado para confirmar la contraseña
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [error, setError] = useState("");
 
  // Estado para rastrear qué requisitos se van cumpliendo en tiempo real
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  // Efecto para pintar el fondo de la pantalla sin romper otras vistas
  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "var(--bg-soft2)";

    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  // Función para capturar la posición del input al hacer focus
  const handleFocus = () => {
    if (passwordInputRef.current) {
      const rect = passwordInputRef.current.getBoundingClientRect();
      // Calculamos la posición a la derecha del input sumando el scroll actual de la página
      setTooltipCoords({
        top: rect.top + window.scrollY + rect.height / 2,
        left: rect.right + window.scrollX + 15 // 15px de separación
      });
    }
    setShowTooltip(true);
  };

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

  // Validar criterios de contraseña
  const esContrasenaValida =
    passwordCriteria.length &&
    passwordCriteria.uppercase &&
    passwordCriteria.number &&
    passwordCriteria.specialChar;

  // Validar que las dos contraseñas ingresadas sean idénticas
  const contrasenasCoinciden = formData.contrasena === confirmarContrasena && confirmarContrasena !== "";

  // Validar que todos los campos requeridos estén llenos y correctos
  const formularioCompleto =
    formData.nombre.trim() !== "" &&
    formData.apellidos.trim() !== "" &&
    formData.correo.trim() !== "" &&
    formData.dni.trim().length >= 8 &&
    esContrasenaValida &&
    contrasenasCoinciden;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formularioCompleto) {
      alert("Por favor, completa todos los campos correctamente.");
      return;
    }

    try {
      const response = await api.post('/auth/registro', formData);
      if (response.status === 200) {
        alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
        navigate('/login');
      }
    } catch (err: any) {
      if (err.response) {
        const mensajeError = err.response.data.message || "Error al registrarse";
        alert(mensajeError);
      } else {
        alert("No se pudo conectar con el servidor.");
      }
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* HEADER REUTILIZADO */}
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

      {/* SECCIÓN CENTRAL DEL REGISTRO */}
      <main className="login-main">
        <div className="login-card text-center">
          
          <div className="logo-circle" style={{ marginBottom: '-20px' }}>
            <Heart />
          </div>

          <h1>Crea tu Cuenta</h1>
          <p className="login-subtitle" style={{ marginBottom: '-10px' }}>Únete a MediExpress hoy</p> <br />

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* CAMPO NOMBRE */}
            <div style={{ marginBottom: '6px' }}>
              <label className="login-label">Nombres</label>
              <div className="input-group">
                <input
                  type="text"
                  className="login-input"
                  placeholder="Nombres"
                  value={formData.nombre}
                  onChange={(e) => {
                    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");
                    setFormData({ ...formData, nombre: soloLetras });
                  }}
                  required maxLength={60}
                />
                <User className="input-icon" />
              </div>
            </div>

                        {/* CAMPO APELLIDOS */}
            <div style={{ marginBottom: '6px' }}>
              <label className="login-label">Apellidos</label>
              <div className="input-group">
                <input
                  type="text"
                  className="login-input"
                  placeholder="Apellidos"
                  value={formData.apellidos}
                  onChange={(e) => {
                    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "");
                    setFormData({ ...formData, apellidos: soloLetras });
                  }}
                  required maxLength={60}
                />
                <User className="input-icon" />
              </div>
            </div>

            {/* CAMPO CORREO */}
            <div style={{ marginBottom: '6px' }}>
              <label className="login-label">Correo Electrónico</label>
              <div className="input-group">
                <input
                  type="email"
                  className="login-input"
                  placeholder="Correo"
                  value={formData.correo}
                  onChange={(e) => setFormData({...formData, correo: e.target.value})}
                  required
                />
                <Mail className="input-icon" />
              </div>
            </div>

            {/* CAMPO: DNI */}
            <div style={{ marginBottom: '6px' }}>
              <label className="login-label">DNI</label>
              <div className="input-group">
                <input
                  type="text"
                  className="login-input"
                  placeholder="Ingresar Dni"
                  value={formData.dni}
                  onChange={(e) => {
                    const soloNumeros = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, dni: soloNumeros });
                  }}
                  required 
                  maxLength={8}
                />
                <Fingerprint className="input-icon" />
              </div>
            </div>

            {/* CAMPO: TELÉFONO */}
            <div style={{ marginBottom: '6px' }}>
              <label className="login-label">Teléfono <span className="text-gray-400 font-normal text-xs">(Opcional)</span></label>
              <div className="input-group">
                <input
                  type="text"
                  className="login-input"
                  placeholder="Ingresar número de teléfono"
                  value={formData.telefono}
                  onChange={(e) => {
                    let valor = e.target.value.replace(/\D/g, "");
                    if (valor.length > 0 && valor[0] !== '9') {
                      valor = '';
                    }
                    if (valor.length <= 9) {
                      setFormData({ ...formData, telefono: valor });
                    }
                  }}
                />
                <Phone className="input-icon" />
              </div>
            </div>

            {/* CAMPO PASSWORD */}
            <div style={{ marginBottom: '6px' }}>
              <label className="login-label">Contraseña</label>
              <div className="input-group relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  className="login-input w-full"
                  style={{ paddingRight: '45px' }}
                  placeholder="Contraseña"
                  value={formData.contrasena}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={() => setShowTooltip(false)}
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

            {/* CAMPO CONFIRMAR PASSWORD */}
            <div style={{ marginBottom: '6px' }}>
              <label className="login-label">Confirmar Contraseña</label>
              <div className="input-group relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="login-input w-full"
                  style={{ paddingRight: '45px' }}
                  placeholder="Repetir contraseña"
                  value={confirmarContrasena}
                  onChange={(e) => setConfirmarContrasena(e.target.value)}
                  required
                />
                <Lock className="input-icon" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Mensaje sutil debajo de confirmar contraseña */}
              {confirmarContrasena.length > 0 && (
                <p className={`${contrasenasCoinciden ? "text-green-600" : "text-red-500"} text-left text-[11px] mt-1 ml-1 font-medium`}>
                  {contrasenasCoinciden ? "" : "✕ Las contraseñas no coinciden."}
                </p>
              )}
            </div>

            {/* BOTÓN REGISTRARSE */}
            <button
              type="submit"
              disabled={!formularioCompleto}
              className={`login-button mt-4 transition-all duration-300 ${
                formularioCompleto
                  ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
              }`}
              style={{
                marginBottom: '6px',
                backgroundColor: formularioCompleto ? '#f97316' : '#e5e7eb',
                color: formularioCompleto ? '#ffffff' : '#9ca3af'
              }}
            >
              Registrarse
            </button>

            <div className="mt-4 text-sm text-gray-600">
              ¿Ya tienes cuenta? <Link to="/login" className="text-orange-500 font-bold">Inicia sesión aquí</Link>
            </div>
          </form>
        </div>
      </main>

      {/* 🌟 TOOLTIP FLOTANTE ABSOLUTO CON RESPECTO A LA PANTALLA (FIXED) 🌟 */}
      {showTooltip && (
        <div 
          style={{
            position: 'fixed',
            top: `${tooltipCoords.top}px`,
            left: `${tooltipCoords.left}px`,
            transform: 'translateY(-50%)',
            zIndex: 99999, // Prioridad total sobre cualquier contenedor
            width: '290px',
            backgroundColor: '#edf2f7', // Gris exacto de la referencia
            padding: '16px',
            borderRadius: '14px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            pointerEvents: 'none' // Evita interferir con el mouse del usuario
          }}
        >
          <p style={{ color: '#4a5568', fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
            La contraseña debe cumplir:
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

      {/* FOOTER REUTILIZADO */}
      <Footer/>
    </div>
  );
}