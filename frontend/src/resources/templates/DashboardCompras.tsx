import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from './fragments/DashboardHeader';

import "../static/DashboardMovimiento.css";
import api from "../../api"; 


// ================= INTERFACES SINCRONIZADAS =================
interface DetalleCompra {
    id?: number;
    cantidad: number;
    precioCompra: number;
    subtotal: number;
    producto?: {
        id: number;
        nombre: string;
    };
}

interface Compra {
    id: number; 
    usuario?: {
        id: number;
        username?: string; 
        nombre?: string;
    } | null;
    fecha: string;
    proveedor: string;
    total: number;
    detalles?: DetalleCompra[]; 
}

interface Categoria {
    id: number;
    nombre: string;
    emoji?: string;
}

interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    precio_venta: number;
    stock: number;
    categoria?: Categoria;
}

interface ItemCarritoCompra {
    id: number;
    nombre: string;
    cantidad: number;
    precioCosto: number; // Precio al que le compramos al proveedor
    subTotal: number;
}

export function DashboardCompras() {
    const navigate = useNavigate();
    
    // Estados de datos de la API
    const [compras, setCompras] = useState<Compra[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    
    // Guarda la compra seleccionada para ver el desglose en la tabla inferior
    const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
    
    // Estados del modal de registro de compras (Ingreso de Mercadería)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [carrito, setCarrito] = useState<ItemCarritoCompra[]>([]);

    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async (desde?: string, hasta?: string) => {
    try {
        const prodResponse = await api.get('/productos');
        setProductos(prodResponse.data);
        
        // Construir la URL dinámicamente si hay filtros de fecha
        let url = '/compras';
        if (desde && hasta) {
            url += `?inicio=${desde}&fin=${hasta}`;
        }
        
        const comprasResponse = await api.get(url);
        setCompras(comprasResponse.data);
        setCompraSeleccionada(null);
    } catch (error) {
        console.error("Error al cargar datos desde Spring Boot:", error);
    }
    };

    // FUNCIÓN PARA DESCARGAR EL REPORTE EN PDF (CORREGIDA)
    const descargarReportePdf = async (endpoint: string, nombreArchivo: string) => {
        try {
            const token = localStorage.getItem("token"); // Obtenemos tu Token JWT

            const response = await api.get(endpoint, {
                responseType: 'blob', // OBLIGATORIO para leer flujos binarios de PDF
                headers: {
                    'Authorization': `Bearer ${token}` // Evita el error 403 Forbidden
                }
            });

            // Crear una URL del objeto binario del PDF
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', nombreArchivo); 
            document.body.appendChild(link);
            link.click();
            
            // Limpiar el DOM
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar el archivo PDF:", error);
            alert("No se pudo generar el documento PDF. Comprueba tus accesos.");
        }
    };

    // Función para el botón "Buscar"
    const handleBuscarPorFechas = () => {
        if (!fechaDesde || !fechaHasta) {
            alert("Por favor, seleccione ambas fechas para realizar el filtro.");
            return;
        }
        if (new Date(fechaDesde) > new Date(fechaHasta)) {
            alert("La fecha de inicio ('Desde') no puede ser mayor que la fecha final ('Hasta').");
            return;
        }
        fetchDatos(fechaDesde, fechaHasta);
    };

    // Opcional: Un botón para limpiar el filtro si lo deseas
    const handleLimpiarFiltro = () => {
        setFechaDesde('');
        setFechaHasta('');
        fetchDatos(); // Vuelve a cargar todas las compras
    };

    const agregarAlCarrito = (prod: Producto) => {
        const existe = carrito.find(item => item.id === prod.id);
        if (existe) {
            // En compras no hay límite de stock máximo (estamos abasteciendo el negocio)
            cambiarCantidad(prod.id, existe.cantidad + 1);
        } else {
            setCarrito([...carrito, {
                id: prod.id,
                nombre: prod.nombre,
                cantidad: 1,
                precioCosto: 0.0, // Se inicializa en 0 para que el usuario digite el costo real del proveedor
                subTotal: 0.0
            }]);
        }
        setBusqueda(''); 
    };

    const cambiarCantidad = (id: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return; 

        setCarrito(carrito.map(item => 
            item.id === id 
                ? { ...item, cantidad: nuevaCantidad, subTotal: nuevaCantidad * item.precioCosto }
                : item
        ));
    };

    const cambiarPrecioCosto = (id: number, nuevoPrecio: number) => {
        if (nuevoPrecio < 0) return;

        setCarrito(carrito.map(item => 
            item.id === id 
                ? { ...item, precioCosto: nuevoPrecio, subTotal: item.cantidad * nuevoPrecio }
                : item
        ));
    };

    const eliminarDelCarrito = (id: number) => {
        setCarrito(carrito.filter(item => item.id !== id));
    };

    // Calcula la inversión/total general del lote de mercadería
    const totalGeneral = carrito.reduce((sum, item) => sum + item.subTotal, 0);

    const handleSaveCompra = async () => {
        try {
            const loggedInUserId = localStorage.getItem("userId");
            
            if (!loggedInUserId) {
                alert("No se detectó una sesión activa de usuario. Por favor, vuelva a iniciar sesión.");
                return;
            }
            if (!proveedor.trim()) {
                alert("Por favor, ingrese el nombre del proveedor o distribuidor.");
                return;
            }

            const ahora = new Date();
            const fechaFormateada = ahora.toISOString().split('.')[0]; 

            // Estructura limpia que espera recibir tu DTO / Entidad en Spring Boot
            const detallesCompra = carrito.map(item => ({
                cantidad: item.cantidad,
                precioCompra: item.precioCosto,
                subtotal: item.subTotal,
                producto: {
                    id: item.id 
                }
            }));

            const nuevaCompra = {
                fecha: fechaFormateada,
                proveedor: proveedor,
                total: totalGeneral,
                usuario: {
                    id: parseInt(loggedInUserId, 10)
                },
                detalles: detallesCompra 
            };

            const response = await api.post('/compras', nuevaCompra);
            
            if (response.status === 200 || response.status === 201) {
                alert("¡Compra e ingreso de stock registrados con éxito!");
                setCarrito([]);        
                setProveedor('');
                setIsModalOpen(false);  
                fetchDatos(); // Refresca las tablas automáticamente         
            }

        } catch (err: any) {
            console.error("Error al registrar la compra:", err);
            if (err.response && err.response.data) {
                alert(`Error en el servidor: ${err.response.data.detail || 'Verifique los datos de la compra.'}`);
            } else {
                alert("Hubo un problema de conexión al registrar la compra.");
            }
        }
    };

const handleExportarExcel = async () => {
        try {
            // CORREGIDO: Usar los estados reales del componente
            // Si deseas exportar usando el filtro actual, usamos 'fechaDesde' y 'fechaHasta'
            // Opcional: Si están vacías, puedes decidir si mandar strings vacíos o alertar al usuario.
            const response = await api.get(`/compras/exportar?inicio=${fechaDesde}&fin=${fechaHasta}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `reporte_compras_${fechaDesde || 'inicio'}_a_${fechaHasta || 'fin'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al exportar Excel de compras:", error);
        }
    };

    const handleEliminarCompra = async () => {
        if (!compraSeleccionada) {
            alert("Por favor, seleccione una orden de compra de la tabla primero.");
            return;
        }

        const confirmar = window.confirm(
            `¿Está completamente seguro de anular la Compra #${String(compraSeleccionada.id).padStart(3, '0')}?\n` +
            `Esta acción RESTARÁ el stock de los productos ingresados de forma permanente.`
        );

        if (!confirmar) return;

        try {
            const response = await api.delete(`/compras/${compraSeleccionada.id}`);
            
            if (response.status === 200) {
                alert("¡Compra anulada y stock revertido con éxito!");
                fetchDatos(); // Refresca las tablas y limpia la selección
            }
        } catch (err: any) {
            console.error("Error al eliminar la compra:", err);
            if (err.response && err.response.data) {
                alert(`Error en el servidor: ${err.response.data}`);
            } else {
                alert("Hubo un problema de conexión al intentar eliminar la compra.");
            }
        }
    };

    const productosFiltrados = busqueda === '' ? [] : productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

 return (
        <div className="compras-container">
            <DashboardHeader />

            <div className="compras-content">
                <aside className="compras-sidebar">
                    <button className="btn-actualizar" style={{backgroundColor: '#27ae60', color: 'white'}} onClick={() => setIsModalOpen(true)}>
                        📦 Nueva Compra
                    </button>
                    <button className="btn-anular" 
                        onClick={handleEliminarCompra}
                        style={{
                            backgroundColor: compraSeleccionada ? '#e74c3c' : '#95a5a6', 
                            color: 'white',
                            cursor: compraSeleccionada ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!compraSeleccionada}
                    >Anular Compra</button>
                    
                    {/* ZONA DEL FILTRO ACTUALIZADA */}
                    <div className="filter-group">
                        <label>Desde:</label>
                        <input 
                            type="date" 
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                        <label>Hasta:</label>
                        <input 
                            type="date" 
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>
                    
                    <button className="btn-buscar" onClick={handleBuscarPorFechas}>Buscar</button>
                    
                    {/* Botón extra recomendado para regresar al estado inicial sin recargar la página */}
                    {(fechaDesde || fechaHasta) && (
                        <button 
                            className="btn-buscar" 
                            style={{backgroundColor: '#ffffff', marginTop: '5px'}} 
                            onClick={handleLimpiarFiltro}
                        >
                            Limpiar Filtro
                        </button>
                    )}
                    <button className="btn-buscar" onClick={handleExportarExcel}>Exportar Excel</button>
                    <button onClick={() => descargarReportePdf('/productos/exportar-pdf', 'Inventario.pdf')} className="btn-pdf">Exportar a PDF</button>
                    <button className="btn-cerrar" onClick={() => navigate('/DashboardHome')}>Cerrar</button>
                </aside>

                <main className="compras-main">
                    {/* ================= TABLA 1: HISTORIAL DE COMPRAS ================= */}
                    <div className="table-wrapper">
                        <h3>Historial de Órdenes de Compra</h3>
                        
                        {/* Vista de Tabla Tradicional (Visible en Escritorio) */}
                        <table className="tabla-escritorio">
                            <thead>
                                <tr>
                                    <th>ID_Compra</th>
                                    <th>Proveedor</th>
                                    <th>Recibido por</th>
                                    <th>Fecha y Hora</th>
                                    <th>Total Invertido</th>
                                </tr>
                            </thead>
                            <tbody>
                                {compras.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '10px' }}>No hay compras registradas en el sistema.</td>
                                    </tr>
                                ) : (
                                    compras.map(c => {
                                        const isSelected = compraSeleccionada?.id === c.id;
                                        return (
                                            <tr 
                                                key={c.id} 
                                                onClick={() => setCompraSeleccionada(c)}
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    backgroundColor: isSelected ? '#ebf5fb' : '',
                                                    fontWeight: isSelected ? 'bold' : 'normal'
                                                }}
                                                className={isSelected ? "fila-seleccionada" : ""}
                                            >
                                                <td>{String(c.id).padStart(3, '0')}</td>
                                                <td style={{ fontWeight: '500' }}>{c.proveedor}</td>
                                                <td>{c.usuario?.nombre || c.usuario?.username || 'Administrador'}</td>
                                                <td>{c.fecha ? new Date(c.fecha).toLocaleString() : 'Fecha no registrada'}</td>
                                                <td style={{ fontWeight: 'bold', color: '#2980b9' }}>
                                                    S/. {(c.total || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {/* Vista de Tarjetas Optimizada para Móvil */}
                        <div className="tarjetas-movil">
                            {compras.length === 0 ? (
                                <div className="no-data">No hay compras registradas en el sistema.</div>
                            ) : (
                                compras.map(c => {
                                    const isSelected = compraSeleccionada?.id === c.id;
                                    return (
                                        <div 
                                            key={c.id}
                                            className={`tarjeta-compra ${isSelected ? 'tarjeta-seleccionada' : ''}`}
                                            onClick={() => setCompraSeleccionada(c)}
                                        >
                                            <div className="tarjeta-header">
                                                <span className="tarjeta-id">ID: #{String(c.id).padStart(3, '0')}</span>
                                                <span className="tarjeta-total-compra">S/. {(c.total || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="tarjeta-body">
                                                <p><strong>Proveedor:</strong> {c.proveedor}</p>
                                                <p><strong>Recibido por:</strong> {c.usuario?.nombre || c.usuario?.username || 'Administrador'}</p>
                                                <p><strong>Fecha:</strong> {c.fecha ? new Date(c.fecha).toLocaleString() : 'Fecha no registrada'}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                    
                    {/* ================= TABLA 2: DETALLES DE ARTÍCULOS ================= */}
                    <div className="table-wrapper" style={{ marginTop: '20px' }}>
                        <h3>
                            {compraSeleccionada 
                                ? `Artículos de la Orden de Compra #${String(compraSeleccionada.id).padStart(3, '0')}` 
                                : "Seleccione una orden de compra para ver sus artículos"}
                        </h3>

                        {/* Vista de Tabla Tradicional (Visible en Escritorio) */}
                        <table className="tabla-escritorio">
                            <thead>
                                <tr>
                                    <th>Nombre del Producto</th>
                                    <th>Cantidad Ingresada</th>
                                    <th>Costo Compra Unitario</th>
                                    <th>Sub Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!compraSeleccionada ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '15px', color: '#7f8c8d' }}>
                                            Ninguna orden de compra seleccionada en la tabla superior.
                                        </td>
                                    </tr>
                                ) : !compraSeleccionada.detalles || compraSeleccionada.detalles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '15px', color: '#e74c3c' }}>
                                            Esta compra no contiene desglose de artículos en el sistema.
                                        </td>
                                    </tr>
                                ) : (
                                    compraSeleccionada.detalles.map((d, index) => (
                                        <tr key={d.id || index}>
                                            <td>{d.producto?.nombre || `Producto ID: ${d.producto?.id || 'Desconocido'}`}</td>
                                            <td>{d.cantidad} u.</td>
                                            <td>S/. {(d.precioCompra || 0).toFixed(2)}</td>
                                            <td style={{ fontWeight: 'bold' }}>S/. {(d.subtotal || 0).toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Vista de Tarjetas de Detalles Optimizada para Móvil */}
                        <div className="tarjetas-movil">
                            {!compraSeleccionada ? (
                                <div className="no-data-select">Ninguna orden de compra seleccionada en la tabla superior.</div>
                            ) : !compraSeleccionada.detalles || compraSeleccionada.detalles.length === 0 ? (
                                <div className="no-data-error">Esta compra no contiene desglose de artículos en el sistema.</div>
                            ) : (
                                compraSeleccionada.detalles.map((d, index) => (
                                    <div key={d.id || index} className="tarjeta-articulo">
                                        <div className="tarjeta-header-articulo">
                                            {d.producto?.nombre || `Producto ID: ${d.producto?.id}`}
                                        </div>
                                        <div className="tarjeta-body-articulo">
                                            <p><span>Cantidad:</span> <strong>{d.cantidad} u.</strong></p>
                                            <p><span>Costo Unitario:</span> <strong>S/. {(d.precioCompra || 0).toFixed(2)}</strong></p>
                                            <p className="tarjeta-subtotal"><span>Subtotal:</span> <strong>S/. {(d.subtotal || 0).toFixed(2)}</strong></p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* ================= MODAL DE REGISTRO DE COMPRA ================= */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>📦 Registro e Ingreso de Mercadería</h2>
                        <hr />

                        {/* INPUT PARA DATOS DEL PROVEEDOR */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>🏢 Proveedor / Distribuidor:</label>
                            <input 
                                type="text"
                                placeholder="Ej. Novatech Distribuciones S.A.C."
                                value={proveedor}
                                onChange={(e) => setProveedor(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #bdc3c7' }}
                            />
                        </div>

                        {/* BUSCADOR INTERACTIVO DE PRODUCTOS EXISTENTES */}
                        <div className="modal-buscador-container">
                            <label style={{ fontWeight: 'bold' }}>💻 Buscar Producto a Abastecer:</label>
                            <input 
                                type="text" 
                                placeholder="Escriba el nombre del artículo para añadirlo..." 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="modal-input-buscar"
                            />
                            
                            {productosFiltrados.length > 0 && (
                                <ul className="modal-resultados-busqueda">
                                    {productosFiltrados.map(prod => (
                                        <li key={prod.id} onClick={() => agregarAlCarrito(prod)}>
                                            {prod.nombre} (Stock actual: {prod.stock}) - S/. {prod.precio_venta.toFixed(2)} ➕
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* LISTA DEL LOTE ACTUAL DE LA COMPRA */}
                        <div className="modal-table-wrapper">
                            <table className="modal-tabla">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Producto</th>
                                        <th style={{ width: '20%' }}>Cantidad</th>
                                        <th style={{ width: '20%' }}>Costo Compra (S/.)</th>
                                        <th style={{ width: '15%' }}>Subtotal</th>
                                        <th style={{ width: '5%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carrito.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{textAlign: 'center', color: '#95a5a6', padding: '20px'}}>
                                                La lista de reabastecimiento está vacía. Busque productos arriba.
                                            </td>
                                        </tr>
                                    ) : (
                                        carrito.map(item => (
                                            <tr key={item.id}>
                                                <td><strong>{item.nombre}</strong></td>
                                                <td>
                                                    <input 
                                                        type="number" 
                                                        value={item.cantidad} 
                                                        min="1"
                                                        onChange={(e) => cambiarCantidad(item.id, parseInt(e.target.value) || 1)}
                                                        style={{ width: '65px', padding: '5px', textAlign: 'center', borderRadius: '4px', border: '1px solid #bdc3c7' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input 
                                                        type="number" 
                                                        value={item.precioCosto || ''} 
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="0.00"
                                                        onChange={(e) => cambiarPrecioCosto(item.id, parseFloat(e.target.value) || 0)}
                                                        style={{ width: '85px', padding: '5px', textAlign: 'right', borderRadius: '4px', border: '1px solid #bdc3c7' }}
                                                    />
                                                </td>
                                                <td>S/. {item.subTotal.toFixed(2)}</td>
                                                <td>
                                                    <button type="button" className="btn-eliminar-item" onClick={() => eliminarDelCarrito(item.id)}>❌</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* SECCIÓN DE TOTALES */}
                        <div className="modal-totales-seccion">
                            <div className="total-row">
                                <span>TOTAL INVERSIÓN GENERAL:</span>
                                <strong className="total-precio" style={{ color: '#2980b9' }}>S/. {totalGeneral.toFixed(2)}</strong>
                            </div>
                        </div>

                        {/* ACCIONES DEL MODAL */}
                        <div className="modal-acciones">
                            <button type="button" className="btn-modal-cancelar" onClick={() => { setIsModalOpen(false); setCarrito([]); setProveedor(''); }}>
                                Cancelar Registro
                            </button>
                            <button 
                                type="button"
                                className="btn-modal-registrar" 
                                style={{ backgroundColor: '#2980b9' }}
                                onClick={handleSaveCompra}
                                disabled={carrito.length === 0 || !proveedor.trim()}
                            >
                                Guardar e Incrementar Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}