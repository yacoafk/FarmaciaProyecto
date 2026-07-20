import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";

import { Header } from './fragments/Header';
import { Footer } from './fragments/Footer';
import { FormularioCheckout } from './FormularioCheckout'; 

import api from "../../api"; 

import "../static/Global.css";
import "../static/Carrito.css"; 

interface CartItem {
  id: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  imagen: string;
}

export function Carrito() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [paso, setPaso] = useState<'carrito' | 'checkout'>('carrito');
  
  // Estado para controlar pantallas de carga o deshabilitar botones al procesar
  const [cargando, setCargando] = useState(false);


  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);

  // Estados del Formulario
  const [metodoEntrega, setMetodoEntrega] = useState<'domicilio' | 'tienda'>('domicilio');
  const [metodoPago, setMetodoPago] = useState<'yape_plin' | 'tarjeta'>('yape_plin');
  const [direccion, setDireccion] = useState('');
  const [distrito, setDistrito] = useState('');

  useEffect(() => {
    obtenerCarritoLocal();
  }, []);

  const obtenerCarritoLocal = () => {
    const datosLocales = localStorage.getItem("carrito_mediexpress");
    if (datosLocales) {
      setItems(JSON.parse(datosLocales));
    }
  };

  const guardarCarrito = (nuevoCarrito: CartItem[]) => {
    setItems(nuevoCarrito);
    localStorage.setItem("carrito_mediexpress", JSON.stringify(nuevoCarrito));
    window.dispatchEvent(new Event("cartUpdate"));
  };

  const cambiarCantidad = (id: number, incremento: number) => {
    const nuevoCarrito = items.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + incremento;
        return { ...item, cantidad: nuevaCantidad > 0 ? nuevaCantidad : 1 };
      }
      return item;
    });
    guardarCarrito(nuevoCarrito);
  };

  const eliminarItem = (id: number) => {
    const nuevoCarrito = items.filter(item => item.id !== id);
    guardarCarrito(nuevoCarrito);
  };
// === AGREGA ESTA FUNCIÓN AQUÍ ===
  const manejarContinuarCompra = () => {
    const loggedInUserId = localStorage.getItem("userId");
    
    if (!loggedInUserId) {
      // Si no hay sesión, activa la ventana flotante de advertencia
      setMostrarModalLogin(true);
    } else {
      // Si el usuario está autenticado, avanza normalmente al formulario
      setPaso('checkout');
    }
  };
  // Cálculos
  const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const costoEnvio = metodoEntrega === 'domicilio' && items.length > 0 ? 7.90 : 0;
  const totalGeneral = subtotal + costoEnvio;

// ==========================================
  // CONEXIÓN CON EL BACKEND PEDIDOS (Lógica Sincronizada con Dashboard)
  // ==========================================
  const procesarPagoFinal = async () => {
    // 1. Validaciones previas en el Frontend (Dirección)
    if (metodoEntrega === 'domicilio' && (!direccion || !distrito)) {
      alert("Por favor, completa los datos de tu dirección de entrega.");
      return;
    }

    // 2. Validación estricta del Usuario Logueado (Igual a la lógica que te funciona)
    const loggedInUserId = localStorage.getItem("userId");
    
    if (!loggedInUserId) {
      alert("No se detectó una sesión activa de usuario. Por favor, vuelva a iniciar sesión.");
      return;
    }

    // Construcción de la dirección final
    const direccionFinal = metodoEntrega === 'domicilio' 
      ? `${direccion} - ${distrito}` 
      : 'Recojo en tienda';

    // Construcción de las observaciones
    const observacionesFinal = `Pago mediante: ${metodoPago === 'yape_plin' ? 'Yape/Plin' : 'Tarjeta'}`;

    // 3. Estructurar el JSON limpio usando el ID validado de manera idéntica al bueno
    const nuevaVentaPedido = {
      usuario: {
        id: parseInt(loggedInUserId, 10)
      },
      direccionEnvio: direccionFinal,
      observaciones: observacionesFinal,
      detalles: items.map(item => ({
        cantidad: item.cantidad,
        producto: {
          id: item.id
        }
      }))
    };

    try {
      setCargando(true);

      // 4. Petición HTTP POST al controlador de pedidos
      const response = await api.post('/pedidos', nuevaVentaPedido);

      // 5. Manejo de respuesta exitosa
      if (response.status === 200 || response.status === 201) {
        const pedidoCreado = response.data;
        
        alert(`¡Pedido N° ${pedidoCreado.id || 'Exitoso'} registrado con éxito en el sistema!`);
        
        // Limpiar el estado del carrito local tras la compra
        guardarCarrito([]);
        setPaso('carrito');
      }

    } catch (err: any) {
      console.error("Error al registrar el pedido:", err);
      
      if (err.response && err.response.data) {
        const mensajeError = typeof err.response.data === 'string' 
          ? err.response.data 
          : (err.response.data.message || err.response.data.detail || 'Verifique los datos o el stock disponible.');
          
        alert(`Error en el servidor: ${mensajeError}`);
      } else {
        alert("Hubo un problema de conexión al comunicar con Spring Boot.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="carrito-container">

      <Header />

      <h1 className="carrito-title">
        {paso === 'carrito' ? 'Mi Carrito' : 'Finalizar Compra'}
      </h1>
      
      <main className="cart-main-container">      
        <div className="cart-layout">
          
          {/* COLUMNA IZQUIERDA COMPACTA */}
          <div className="cart-left-column">
            {paso === 'carrito' ? (
              items.length === 0 ? (
                <div className="cart-empty-section">
                  <ShoppingBag size={48} />
                  <p className="cart-empty-text">Tu carrito está vacío.</p>
                  <Link to="/" className="btn-go-shop">Ir a comprar</Link>
                </div>
              ) : (
                <div className="cart-items-list">
                  {items.map((item) => (
                    <div key={item.id} className="cart-item-row">
                      <div className="cart-item-img-container">
                        <img src={item.imagen} alt={item.nombre} className="cart-item-img" />
                      </div>

                      <div className="cart-item-details">
                        <h3 className="cart-item-name">{item.nombre}</h3>
                        <p className="cart-item-description">{item.descripcion}</p>
                        <span className="cart-item-unit-price">Precio unitario: S/ {item.precio.toFixed(2)}</span>
                      </div>

                      <div className="cart-item-actions">
                        <div className="quantity-controls">
                          <button className="btn-qty" onClick={() => cambiarCantidad(item.id, -1)}>
                            <Minus size={16} />
                          </button>
                          <span className="qty-number">{item.cantidad}</span>
                          <button className="btn-qty" onClick={() => cambiarCantidad(item.id, 1)}>
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="cart-item-subtotal">
                          S/ {(item.precio * item.cantidad).toFixed(2)}
                        </div>

                        <button className="btn-delete-item" onClick={() => eliminarItem(item.id)} title="Eliminar producto">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <FormularioCheckout 
                metodoEntrega={metodoEntrega}
                setMetodoEntrega={setMetodoEntrega}
                metodoPago={metodoPago}
                setMetodoPago={setMetodoPago}
                distrito={distrito}
                setDistrito={setDistrito}
                direccion={direccion}
                setDireccion={setDireccion}
                onVolver={() => setPaso('carrito')}
              />
            )}
          </div>
      
          {/* COLUMNA DERECHA (RESUMEN) */}
          <aside className="cart-right-column">
            <div className="carrito-summary-card">
              <h2 className="summary-title">Resumen de Compra</h2>
              
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>

              {metodoEntrega === 'domicilio' && (
                <div className="summary-row">
                  <span>Costo de envío:</span>
                  <span>S/ {costoEnvio.toFixed(2)}</span>
                </div>
              )}
              
              <div className="divider"></div>
              
              <div className="total-row">
                <span className="total-label">Total:</span>
                <span className="total-value">S/ {totalGeneral.toFixed(2)}</span>
              </div>
              
              <div className="cart-action-buttons">
                {paso === 'carrito' ? (
                  <button 
                    className="btn-payment-now" 
                    onClick={manejarContinuarCompra}
                    disabled={items.length === 0}
                  >
                    CONTINUAR COMPRA
                  </button>
                ) : (
                  <button 
                    // 💡 Añadida clase condicional para opacidad cuando procesa
                    className={`btn-final-pay ${cargando ? 'btn-disabled' : ''}`} 
                    onClick={procesarPagoFinal}
                    disabled={cargando || items.length === 0} 
                  >
                    {cargando ? 'PROCESANDO...' : (
                      metodoPago === 'yape_plin' 
                        ? `PAGAR S/ ${totalGeneral.toFixed(2)} CON YAPE/PLIN` 
                        : `PAGAR S/ ${totalGeneral.toFixed(2)} CON TARJETA`
                    )}
                  </button>
                )}
              </div>

            </div>
          </aside>

        </div>
      </main>

      <Footer/>

      // === AGREGA ESTE BLOQUE DE AQUÍ HASTA EL FINAL ===
      {mostrarModalLogin && (
        <div className="modal-login-overlay">
          <div className="modal-login-card">
            <div className="modal-login-icon">⚠️</div>
            <h2>Inicio de Sesión Requerido</h2>
            <p>Para poder procesar tu pedido en <strong>MediExpress</strong> y gestionar el envío correctamente, necesitas contar con una sesión activa.</p>
            <div className="modal-login-actions">
              <button className="btn-modal-close" onClick={() => setMostrarModalLogin(false)}>
                Regresar al Carrito
              </button>
              <Link to="/login" className="btn-modal-go-login">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}