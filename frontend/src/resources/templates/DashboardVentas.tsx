import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from './fragments/DashboardHeader';
import api from "../../api"; 

import "../static/DashboardVentas.css";
import "../static/RegistrarMovimiento.css";

// Interface para el detalle que viene dentro de la venta
interface DetalleVenta {
    id?: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    producto?: {
        id: number;
        nombre: string;
    };
}

interface DashboardVentas {
    id: number; 
    usuario?: {
        id: number;
        username?: string; 
        nombre?: string;
    } | null;
    fecha: string;
    total: number;
    detalles?: DetalleVenta[]; 
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

interface ItemCarrito {
    id: number;
    nombre: string;
    cantidad: number;
    precioUnid: number;
    subTotal: number;
}


export function DashboardVentas() {
    const navigate = useNavigate();
    
    // Estados de datos de la API
    const [ventas, setVentas] = useState<DashboardVentas[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    
    // Guarda la venta de la que queremos ver sus productos
    const [ventaSeleccionada, setVentaSeleccionada] = useState<DashboardVentas | null>(null);
    
    // Estados del modal de registro de ventas
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

    // Estados para el filtrado por fechas
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        fetchDatos();
    }, []);

    const fetchDatos = async (desde?: string, hasta?: string) => {
        try {
            const prodResponse = await api.get('/productos');
            setProductos(prodResponse.data);

            let url = '/ventas';
            const params: any = {};

            if (desde && hasta) {
                params.inicio = desde;
                params.fin = hasta;
            }

            const ventasResponse = await api.get(url, { params });
            setVentas(ventasResponse.data);
            setVentaSeleccionada(null);
        } catch (error) {
            console.error("Error al cargar datos:", error);
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

    // FUNCIÓN PARA EXPORTAR EXCEL (CORREGIDA CON INYECCIÓN DE TOKEN JWT)
    const handleExportarExcel = async () => {
        try {
            const token = localStorage.getItem("token"); // Se agrega el token para evitar el 403

            const response = await api.get('/ventas/exportar', { 
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'reporte_ventas.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al exportar Excel de ventas:", error);
            alert("No se pudo generar el reporte de Excel. Verifique sus permisos.");
        }
    };

    const totalGeneral = carrito.reduce((sum, item) => sum + item.subTotal, 0);

    const handleSaveVenta = async () => {
        try {
            const loggedInUserId = localStorage.getItem("userId");
            
            if (!loggedInUserId) {
                alert("No se detectó una sesión activa de usuario. Por favor, vuelva a iniciar sesión.");
                return;
            }

            const ahora = new Date();
            const fechaFormateada = ahora.toISOString().split('.')[0]; 
            const token = localStorage.getItem("token");
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const detallesVenta = carrito.map(item => ({
                cantidad: item.cantidad,
                precioUnitario: item.precioUnid,
                subtotal: item.subTotal,
                producto: {
                    id: item.id 
                }
            }));

            const nuevaVenta = {
                fecha: fechaFormateada,
                total: totalGeneral,
                usuario: {
                    id: parseInt(loggedInUserId, 10)
                },
                detalles: detallesVenta 
            };

            const response = await api.post('/ventas', nuevaVenta, config);
            
            if (response.status === 200 || response.status === 201) {
                alert("¡Venta registrada con éxito en el sistema!");
                setCarrito([]);        
                setIsModalOpen(false);  
                fetchDatos();           
            }

        } catch (err: any) {
            console.error("Error al registrar la venta:", err);
            if (err.response && err.response.data) {
                alert(`Error en el servidor: ${err.response.data.detail || 'Verifique los datos.'}`);
            } else {
                alert("Hubo un problema de conexión al registrar la venta.");
            }
        }
    };

    const handleEliminarVenta = async () => {
    if (!ventaSeleccionada) return;

    const confirmar = window.confirm(`¿Estás seguro de anular la venta #${String(ventaSeleccionada.id).padStart(3, '0')}?`);
    if (!confirmar) return;

    try {
        const response = await api.delete(`/ventas/${ventaSeleccionada.id}`);

        if (response.status === 200) {
            alert("¡Venta anulada correctamente!");
            fetchDatos();
        }
    } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "No se pudo anular la venta.");
    }
};

    const handleBuscarPorFechas = () => {
        if (!fechaDesde || !fechaHasta) {
            alert("Por favor, seleccione ambas fechas para aplicar el filtro.");
            return;
        }
        if (new Date(fechaDesde) > new Date(fechaHasta)) {
            alert("La fecha inicial ('Desde') no puede ser posterior a la fecha final ('Hasta').");
            return;
        }
        fetchDatos(fechaDesde, fechaHasta);
    };

    const handleLimpiarFiltro = () => {
        setFechaDesde('');
        setFechaHasta('');
        fetchDatos(); 
    };
    
    const productosFiltrados = busqueda === '' ? [] : productos.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="ventas-container">
            <DashboardHeader />

            <div className="ventas-content">
                <aside className="ventas-sidebar">
                    <button className="btn-actualizar" style={{ backgroundColor: '#2980b9', color: 'white' }} onClick={() => setIsModalOpen(true)}>
                        🛒 Nueva Venta
                    </button>
                    <button 
                        className="btn-anular"
                        onClick={handleEliminarVenta}
                        style={{
                            backgroundColor: ventaSeleccionada ? '#e74c3c' : '#95a5a6',
                            color: 'white',
                            cursor: ventaSeleccionada ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!ventaSeleccionada}
                    >
                        Anular Venta
                    </button>

                    <div className="filter-group" style={{ marginTop: '15px' }}>
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

                    {(fechaDesde || fechaHasta) && (
                        <button 
                            className="btn-buscar" 
                            style={{ backgroundColor: '#ffffff', marginTop: '5px' }} 
                            onClick={handleLimpiarFiltro}
                        >
                            Limpiar Filtro
                        </button>
                    )}

                    <button className="btn-buscar" onClick={handleExportarExcel}>Exportar Excel</button>
                    {/* CORREGIDO: Apunta al endpoint correcto de ventas en lugar de productos */}
                    <button onClick={() => descargarReportePdf('/ventas/exportar-pdf', 'Reporte_Ventas.pdf')} className="btn-pdf">Exportar a PDF</button>
                    <button className="btn-cerrar" onClick={() => navigate('/DashboardHome')}>Cerrar</button>
                </aside>

<main className="ventas-main">
    {/* ================= SECCIÓN: HISTORIAL DE VENTAS ================= */}
    <div className="table-wrapper">
        <h3>Historial de Ventas</h3>
        
        {/* Vista de Tabla (Se ocultará en móvil) */}
        <table className="tabla-escritorio">
            <thead>
                <tr>
                    <th>ID_Venta</th>
                    <th>Usuario</th>
                    <th>Fecha y Hora</th>
                    <th>Total Cobrado</th>
                </tr>
            </thead>
            <tbody>
                {ventas.length === 0 ? (
                    <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '10px' }}>No hay ventas registradas.</td>
                    </tr>
                ) : (
                    ventas.map(v => {
                        const isSelected = ventaSeleccionada?.id === v.id;
                        return (
                            <tr 
                                key={v.id} 
                                onClick={() => setVentaSeleccionada(v)} 
                                style={{ 
                                    cursor: 'pointer', 
                                    backgroundColor: isSelected ? '#ebf5fb' : '',
                                    fontWeight: isSelected ? 'bold' : 'normal'
                                }}
                                className={isSelected ? "fila-seleccionada" : ""}
                            >
                                <td>{String(v.id).padStart(3, '0')}</td>
                                <td>{v.usuario?.nombre || v.usuario?.username || 'Empleado Activo'}</td>
                                <td>{v.fecha ? new Date(v.fecha).toLocaleString() : 'Fecha no registrada'}</td>
                                <td style={{ fontWeight: 'bold', color: '#27ae60' }}>
                                    S/. {(v.total || 0).toFixed(2)}
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>

        {/* Vista de Tarjetas (Solo se mostrará en móvil) */}
        <div className="tarjetas-movil">
            {ventas.length === 0 ? (
                <p className="no-data">No hay ventas registradas.</p>
            ) : (
                ventas.map(v => {
                    const isSelected = ventaSeleccionada?.id === v.id;
                    return (
                        <div 
                            key={v.id}
                            className={`tarjeta-venta ${isSelected ? "tarjeta-seleccionada" : ""}`}
                            onClick={() => setVentaSeleccionada(v)}
                        >
                            <div className="tarjeta-header">
                                <span className="tarjeta-id">ID: #{String(v.id).padStart(3, '0')}</span>
                                <span className="tarjeta-total">S/. {(v.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="tarjeta-body">
                                <p><strong>Usuario:</strong> {v.usuario?.nombre || v.usuario?.username || 'Empleado Activo'}</p>
                                <p><strong>Fecha:</strong> {v.fecha ? new Date(v.fecha).toLocaleString() : 'Fecha no registrada'}</p>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
    
    {/* ================= SECCIÓN: DETALLES DE LA VENTA ================= */}
    <div className="table-wrapper">
        <h3>
            {ventaSeleccionada 
                ? `Artículos de la Venta #${String(ventaSeleccionada.id).padStart(3, '0')}` 
                : "Seleccione una venta para ver sus artículos"}
        </h3>
        
        {/* Vista de Tabla (Se ocultará en móvil) */}
        <table className="tabla-escritorio">
            <thead>
                <tr>
                    <th>Nombre del Producto</th>
                    <th>Cantidad Vendida</th>
                    <th>Precio Unitario</th>
                    <th>Sub Total</th>
                </tr>
            </thead>
            <tbody>
                {!ventaSeleccionada ? (
                    <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '15px', color: '#7f8c8d' }}>
                            Ninguna venta seleccionada en la tabla superior.
                        </td>
                    </tr>
                ) : !ventaSeleccionada.detalles || ventaSeleccionada.detalles.length === 0 ? (
                    <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '15px', color: '#e74c3c' }}>
                            Esta venta no contiene artículos en el sistema.
                        </td>
                    </tr>
                ) : (
                    ventaSeleccionada.detalles.map((d, index) => (
                        <tr key={d.id || index}>
                            <td>{d.producto?.nombre || `Producto ID: ${d.producto?.id || 'Desconocido'}`}</td>
                            <td>{d.cantidad} u.</td>
                            <td>S/. {(d.precioUnitario || 0).toFixed(2)}</td>
                            <td style={{ fontWeight: 'bold' }}>S/. {(d.subtotal || 0).toFixed(2)}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>

        {/* Vista de Tarjetas (Solo se mostrará en móvil) */}
        <div className="tarjetas-movil">
            {!ventaSeleccionada ? (
                <p className="no-data-select">Ninguna venta seleccionada en la sección superior.</p>
            ) : !ventaSeleccionada.detalles || ventaSeleccionada.detalles.length === 0 ? (
                <p className="no-data-error">Esta venta no contiene artículos en el sistema.</p>
            ) : (
                ventaSeleccionada.detalles.map((d, index) => (
                    <div key={d.id || index} className="tarjeta-articulo">
                        <div className="tarjeta-header-articulo">
                            <strong>{d.producto?.nombre || 'Producto Desconocido'}</strong>
                        </div>
                        <div className="tarjeta-body-articulo">
                            <p><span>Cantidad:</span> {d.cantidad} u.</p>
                            <p><span>Precio Unid:</span> S/. {(d.precioUnitario || 0).toFixed(2)}</p>
                            <p className="tarjeta-subtotal"><span>Subtotal:</span> S/. {(d.subtotal || 0).toFixed(2)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
</main>
            </div>

            {/* ================= MODAL DE REGISTRO DE VENTA ================= */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>🧾 Registro de Venta</h2>
                        <hr />

                        <div className="modal-buscador-container">
                            <label>💻 Buscar Producto:</label>
                            <input 
                                type="text" 
                                placeholder="Escriba el nombre del artículo a añadir..." 
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="modal-input-buscar"
                            />
                            
                            {productosFiltrados.length > 0 && (
                                <ul className="modal-resultados-busqueda">
                                    {productosFiltrados.map(prod => (
                                        <li key={prod.id} onClick={() => agregarAlCarrito(prod)}>
                                            {prod.nombre} (Stock: {prod.stock}) - S/. {prod.precio_venta.toFixed(2)} ➕
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="modal-table-wrapper">
                            <table className="modal-tabla">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Producto</th>
                                        <th style={{ width: '20%' }}>Cantidad</th>
                                        <th style={{ width: '15%' }}>Prec. Unit.</th>
                                        <th style={{ width: '15%' }}>Subtotal</th>
                                        <th style={{ width: '10%' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {carrito.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{textAlign: 'center', color: '#95a5a6', padding: '20px'}}>
                                                El carrito está vacío. Use el buscador de arriba.
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
                                                <td>S/. {item.precioUnid.toFixed(2)}</td>
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

                        <div className="modal-totales-seccion">
                            <div className="total-row">
                                <span>TOTAL COMPRA GENERAL:</span>
                                <strong className="total-precio">S/. {totalGeneral.toFixed(2)}</strong>
                            </div>
                        </div>

                        <div className="modal-acciones">
                            <button type="button" className="btn-modal-cancelar" onClick={() => { setIsModalOpen(false); setCarrito([]); }}>
                                Cancelar Registro
                            </button>
                            <button 
                                type="button"
                                className="btn-modal-registrar" 
                                onClick={handleSaveVenta}
                                disabled={carrito.length === 0}
                            >
                                Guardar y Registrar Venta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}