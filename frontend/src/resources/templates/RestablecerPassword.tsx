import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, Heart, Home, Eye, EyeOff, ArrowLeft  } from "lucide-react";


import { Footer } from './fragments/Footer';

import api from "../../api";

import "../static/Login.css";
import "../static/Global.css";

export function RestablecerPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const token = searchParams.get("token"); // Lee el token de la URL

  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevaContrasena !== confirmar) return alert("Las contraseñas no coinciden");

    try {
      await api.post('/auth/resetear-password', { token, nuevaContrasena });
      alert("Contraseña actualizada con éxito.");
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al restablecer");
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
    <div className="logo-circle"><Heart /></div>
    <h1>Nueva Contraseña</h1>
    <p className="login-subtitle">Ingresa tu nueva clave de acceso</p> <br />

    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* CAMPO: NUEVA CONTRASEÑA */}
      <div className="input-group relative">
        <input
          type={showPassword ? "text" : "password"}
          className="login-input w-full"
          style={{ paddingRight: '45px' }}
          placeholder="Nueva contraseña (mín. 8)"
          value={nuevaContrasena}
          onChange={(e) => setNuevaContrasena(e.target.value)}
          required
        />
        <Lock className="input-icon" />
        
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div> <br />

      {/* CAMPO: CONFIRMAR CONTRASEÑA */}
      <div className="input-group relative">
        <input
          type={showConfirm ? "text" : "password"}
          className="login-input w-full"
          style={{ paddingRight: '45px' }}
          placeholder="Confirmar contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          required
        />
        <Lock className="input-icon" />

        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div> <br />

      <button type="submit" className="login-button">
        Actualizar Contraseña
      </button>
    </form>
  </div>
</main>
     
    <Footer/>

    </div>
  );
}