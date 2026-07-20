import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Verifica que sea react-router-dom
import { Lock, User, Heart, Eye, EyeOff, Home , Shield } from "lucide-react";

import { Footer } from './fragments/Footer';
import api from "../../api"; // Tu configuración de axios

import "../static/Login.css";
import "../static/Global.css";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ correo: "", contrasena: "" });
  const [error, setError] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 

    try {
      const { correo, contrasena } = credentials; 
      
      const response = await api.post('/auth/login', { correo, contrasena });
      const user = response.data;

      console.log("CONSOLA DEPURACIÓN - Respuesta del backend:", user);

      if (user.success) {
        // Guardar datos
        localStorage.setItem("userEmail", correo);
        localStorage.setItem("userRole", user.rol);
        localStorage.setItem("user", JSON.stringify(user));
        
        // === GUARDAR TOKEN JWT ===
        if (user.token) {
          localStorage.setItem("token", user.token);
          console.log("✅ Token JWT guardado correctamente");
        }

        // Guardar ID
        if (user.id) {
          localStorage.setItem("userId", user.id.toString());
          console.log("✅ ID de usuario guardado:", user.id);
        }

        // Redirección según rol
        if (user.rol === 'ADMINISTRADOR'|| user.rol === 'admin') {
          navigate('/DashboardHome');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      if (err.response) {
        const status = err.response.status;
        if (status === 403) alert("Cuenta bloqueada temporalmente.");
        else if (status === 401) alert("Usuario o contraseña incorrectos.");
        else alert("Error en el servidor.");
      } else {
        alert("No se pudo conectar con el servidor.");
      }
    }
};

return (
    <div className="login-page-wrapper">
      {/* HEADER (Reutilizando el que ya arreglamos) */}

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

      {/* SECCIÓN CENTRAL DEL LOGIN */}
      <main className="login-main">
        <div className="login-card text-center">
          
          {/* 1. EL CORAZÓN DENTRO DEL CÍRCULO NARANJA */}
          <div className="logo-circle">
            <Heart />
          </div>

          {/* 2. TÍTULOS (MediExpress y Panel) */}
          <h1>MediExpress</h1>

          <form onSubmit={handleSubmit} className="space-y-1">
            
            {/* 3. CAMPO USUARIO */}
            <div>
              <label className="login-label">Usuario</label>
              <div className="input-group">
                <input
                  type="text"
                  className="login-input"
                  placeholder="Ingresa tu usuario"
                  value={credentials.correo} // AGREGAR ESTO
                  onChange={(e) => setCredentials({ ...credentials, correo: e.target.value })} // AGREGAR ESTO
                  required
                />
                {/* Icono de Persona DENTRO */}
                <User className="input-icon" />
              </div>
            </div>

            {/* 4. CAMPO CONTRASEÑA */}
            <div>
              <label className="login-label">Contraseña</label>
              <div className="input-group relative"> {/* Añadimos relative para posicionar el ojo */}
                <input
                  type={showPassword ? "text" : "password"} // <--- CAMBIO DINÁMICO
                  className="login-input pr-10" // pr-10 para que el texto no tape el ojo
                  placeholder="Ingresa tu contraseña"
                  value={credentials.contrasena}
                  onChange={(e) => setCredentials({ ...credentials, contrasena: e.target.value })}
                  required
                />
                
                {/* Icono de Candado (Izquierda) */}
                <Lock className="input-icon" />

                {/* BOTÓN DEL OJITO (Derecha) */}
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <br></br>
            <div className="mt-2 text-sm text-gray-600">
              ¿No recuerdas tu contraseña? <Link to="/recuperar" className="text-orange-500 font-bold">toca aquí</Link>
            </div>
            {/* 5. BOTÓN NARANJA SÓLIDO */}
            <button type="submit" className="login-button">
              Iniciar Sesión
            </button><br></br><br></br>
            <div className="mt-2 text-sm text-gray-600">
              ¿Aun no tienes cuenta? <Link to="/registro" className="text-orange-500 font-bold">Regístrate aquí</Link>
            </div>
          </form>
        </div>
      </main>


      <Footer/>

    </div>
  );
}