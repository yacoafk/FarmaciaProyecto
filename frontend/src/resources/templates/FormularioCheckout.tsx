import { useEffect } from "react";
import React, { useState } from 'react';
import { MapPin, Store, CreditCard, Smartphone } from "lucide-react";
import "../static/FormularioCheckout.css";

interface FormularioCheckoutProps {
  metodoEntrega: 'domicilio' | 'tienda';
  setMetodoEntrega: (tipo: 'domicilio' | 'tienda') => void;
  metodoPago: 'yape_plin' | 'tarjeta';
  setMetodoPago: (tipo: 'yape_plin' | 'tarjeta') => void;
  distrito: string;
  setDistrito: (valor: string) => void;
  direccion: string;
  setDireccion: (valor: string) => void;
  onVolver: () => void;
}

export function FormularioCheckout({
  metodoEntrega,
  setMetodoEntrega,
  metodoPago,
  setMetodoPago,
  distrito,
  setDistrito,
  direccion,
  setDireccion,
  onVolver
}: FormularioCheckoutProps) {

  // ✅ SOLUCIÓN: Los estados de la tarjeta se declaran en la raíz del componente
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');
  const [cvv, setCvv] = useState('');

  // ✅ SOLUCIÓN: Las funciones de control también van en la raíz del componente
  const handleNumeroTarjetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorLimpio = e.target.value.replace(/[^\d]/g, '');
    setNumeroTarjeta(valorLimpio.slice(0, 16));
  };

  const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorLimpio = e.target.value.replace(/[^\d]/g, '');
    setFechaExpiracion(valorLimpio.slice(0, 4)); 
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorLimpio = e.target.value.replace(/[^\d]/g, '');
    setCvv(valorLimpio.slice(0, 4));
  };

  useEffect(() => {
    // 🔍 El useEffect ahora solo hace lo que le corresponde: cargar los datos del usuario
    const idUsuario = localStorage.getItem("userId"); 

    if (idUsuario && metodoEntrega === 'domicilio') {
      fetch(`http://localhost:8080/api/perfil/${idUsuario}`)
        .then((res) => {
          if (!res.ok) throw new Error("Error al obtener el perfil");
          return res.json();
        })
        .then((usuario) => {
          if (usuario.direccion) {
            setDireccion(usuario.direccion);
          }
          if (usuario.distrito) {
            setDistrito(usuario.distrito.toLowerCase());
          }
        })
        .catch((err) => console.error("Error cargando dirección automática:", err));
    }
  }, [metodoEntrega, setDireccion, setDistrito]);

  return (
    <div className="checkout-forms-wrapper">
      
      {/* 1. Forma de Entrega */}
      <div className="checkout-card">
        <h3 className="checkout-card-title">1. Forma de Entrega</h3>
        <div className="checkout-options-grid">
          <div 
            className={`checkout-option-box ${metodoEntrega === 'domicilio' ? 'active' : ''}`}
            onClick={() => setMetodoEntrega('domicilio')}
          >
            <MapPin size={24} />
            <div>
              <span className="option-title">Envío a Domicilio</span>
              <span className="option-desc">Recíbelo en tu dirección (S/ 7.90)</span>
            </div>
          </div>

          <div 
            className={`checkout-option-box ${metodoEntrega === 'tienda' ? 'active' : ''}`}
            onClick={() => setMetodoEntrega('tienda')}
          >
            <Store size={24} />
            <div>
              <span className="option-title">Recojo en Tienda</span>
              <span className="option-desc">Listo en la farmacia principal (Gratis)</span>
            </div>
          </div>
        </div>

        {/* Campos condicionales si elige Domicilio */}
        {metodoEntrega === 'domicilio' && (
          <div className="checkout-address-fields">
            <div className="form-group">
              <label>Distrito *</label>
              <select value={distrito} onChange={(e) => setDistrito(e.target.value)}>
                <option value="">Selecciona tu distrito</option>
                <option value="ancon">Ancón</option>
                <option value="ate">Ate</option>
                <option value="barranco">Barranco</option>
                <option value="brena">Breña</option>
                <option value="carabayllo">Carabayllo</option>
                <option value="chaclacayo">Chaclacayo</option>
                <option value="chorrillos">Chorrillos</option>
                <option value="cieneguilla">Cieneguilla</option>
                <option value="comas">Comas</option>
                <option value="el_agustino">El Agustino</option>
                <option value="independencia">Independencia</option>
                <option value="jesus_maria">Jesús María</option>
                <option value="la_molina">La Molina</option>
                <option value="la_victoria">La Victoria</option>
                <option value="lima">Lima (Cercado)</option>
                <option value="lince">Lince</option>
                <option value="los_olivos">Los Olivos</option>
                <option value="lurigancho_chosica">Lurigancho-Chosica</option>
                <option value="lurin">Lurín</option>
                <option value="magdalena_del_mar">Magdalena del Mar</option>
                <option value="miraflores">Miraflores</option>
                <option value="pachacamac">Pachacámac</option>
                <option value="pucusana">Pucusana</option>
                <option value="pueblo_libre">Pueblo Libre</option>
                <option value="puente_piedra">Puente Piedra</option>
                <option value="punta_hermosa">Punta Hermosa</option>
                <option value="punta_negra">Punta Negra</option>
                <option value="rimac">Rímac</option>
                <option value="san_bartolo">San Bartolo</option>
                <option value="san_borja">San Borja</option>
                <option value="san_isidro">San Isidro</option>
                <option value="san_juan_de_lurigancho">San Juan de Lurigancho</option>
                <option value="san_juan_de_miraflores">San Juan de Miraflores</option>
                <option value="san_luis">San Luis</option>
                <option value="san_martin_de_porres">San Martín de Porres</option>
                <option value="san_miguel">San Miguel</option>
                <option value="santa_anita">Santa Anita</option>
                <option value="santa_maria_del_mar">Santa María del Mar</option>
                <option value="santa_rosa">Santa Rosa</option>
                <option value="santiago_de_surco">Santiago de Surco</option>
                <option value="surquillo">Surquillo</option>
                <option value="villa_el_salvador">Villa El Salvador</option>
                <option value="villa_maria_del_triunfo">Villa María del Triunfo</option>
              </select>
            </div>
            <div className="form-group">
              <label>Dirección exacta *</label>
              <input 
                type="text" 
                placeholder="Av. Las Artes Norte 450, Dpto 301" 
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Campos condicionales si elige Tienda */}
        {metodoEntrega === 'tienda' && (
          <div className="checkout-pickup-container">
            <span className="checkout-pickup-title">Puede recogerlo en la tienda</span>
            <span className="checkout-pickup-address">Dirección exacta: Av. Los Incas 777 - Comas</span> 
          </div>
        )}
      </div>

      {/* 2. Método de Pago */}
      <div className="checkout-card">
        <h3 className="checkout-card-title">2. Elige cómo pagar</h3>
        <div className="checkout-options-grid">
          <div 
            className={`checkout-option-box ${metodoPago === 'yape_plin' ? 'active' : ''}`}
            onClick={() => setMetodoPago('yape_plin')}
          >
            <Smartphone size={24} />
            <div>
              <span className="option-title">Yape / Plin</span>
              <span className="option-desc">Código QR o transferencia directa</span>
            </div>
          </div>

          <div 
            className={`checkout-option-box ${metodoPago === 'tarjeta' ? 'active' : ''}`}
            onClick={() => setMetodoPago('tarjeta')}
          >
            <CreditCard size={24} />
            <div>
              <span className="option-title">Tarjeta de Crédito o Débito</span>
              <span className="option-desc">Visa, Mastercard, Amex, etc.</span>
            </div>
          </div>
        </div>

        {/* Campos del formulario de tarjeta (Solo aparecen si elige tarjeta) */}
        {metodoPago === 'tarjeta' && (
          <div className="card-form-container">
            <div className="form-group">
              <label className="form-label">Número de tarjeta</label>
              <input 
                type="text" 
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={numeroTarjeta}
                onChange={handleNumeroTarjetaChange}
                className="form-input"
              />
            </div>
            
            <div className="form-row-double">
              <div className="form-group">
                <label className="form-label">Vencimiento (MM/AA)</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="MM/AA"
                  value={fechaExpiracion}
                  onChange={handleFechaChange}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">CVV</label>
                <input 
                  type="password" 
                  inputMode="numeric"
                  placeholder="123"
                  value={cvv}
                  onChange={handleCvvChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enlace para regresar */}
      <button className="btn-back-to-cart" onClick={onVolver}>
        ← Volver a modificar el carrito
      </button>
    </div>
  );
}