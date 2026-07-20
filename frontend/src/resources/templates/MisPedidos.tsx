import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './fragments/Header';
import { Footer } from './fragments/Footer';
import api from "../../api"; 

// Importación corregida según tu estructura de carpetas
import "../static/DashboardPedidos.css";
import "../static/DashboardVentas.css";
import "../static/RegistrarMovimiento.css";

interface DetallePedido {
    id?: number;
    cantidad: number;
    // Agregamos el producto mapeado tal como viene de la base de datos
    producto?: {
        id: number;
        nombre: string;
        precio_venta: number; // 👈 Los pedidos suelen jalar el precio directo del catálogo
    };
}

interface Pedido {
    id: number;
    usuario?: {
        id: number;
        username?: string;
        nombre?: string;
    } | null;
    fecha: string;
    total: number;
    estado: string; // PENDIENTE, PREPARANDO, ENVIADO, ENTREGADO, CANCELADO
    detalles?: DetallePedido[]; // 👈 Los detalles del pedido
}


export function MisPedidos() {
    const navigate = useNavigate();

    // Estados de datos de la API
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);

    // Estados para el filtrado por fechas
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    useEffect(() => {
        fetchPedidos();
    }, []);


    const fetchPedidos = async (desde?: string, hasta?: string) => {
        try {
            const usuarioId = localStorage.getItem("userId");

            if (!usuarioId) {
                alert("No se encontró la sesión del usuario.");
                return;
            }

            // Configuración de Query Params dinámicos
            let url = `/pedidos/usuario/${usuarioId}`;
            if (desde && hasta) {
                url += `?inicio=${desde}&fin=${hasta}`;
            }

            const response = await api.get(url);
            setPedidos(response.data);
            setPedidoSeleccionado(null);

        } catch (error) {
            console.error("Error al cargar pedidos:", error);
        }
    };

    const cancelarPedido = async () => {
        if (!pedidoSeleccionado) {
            alert("Por favor, seleccione un pedido.");
            return;
        }

        const confirmar = window.confirm(
            `¿Está seguro de que desea CANCELAR el pedido #${String(pedidoSeleccionado.id).padStart(3, '0')}?\n` +
            `Esto anulará el proceso de envío y gestionará el inventario asignado.`
        );

        if (!confirmar) return;

        try {
            await api.put(`/pedidos/${pedidoSeleccionado.id}/cancelar`);
            alert("¡Pedido cancelado correctamente!");
            fetchPedidos(fechaDesde, fechaHasta);
        } catch (error) {
            console.error(error);
            alert("No se pudo cancelar el pedido.");
        }
    };

    // Ejecutar búsqueda por fechas
    const handleBuscarPorFechas = () => {
        if (!fechaDesde || !fechaHasta) {
            alert("Por favor, seleccione ambas fechas para aplicar el filtro.");
            return;
        }
        if (new Date(fechaDesde) > new Date(fechaHasta)) {
            alert("La fecha inicial ('Desde') no puede ser posterior a la fecha final ('Hasta').");
            return;
        }
        fetchPedidos(fechaDesde, fechaHasta);
    };

    // Restablecer el panel
    const handleLimpiarFiltro = () => {
        setFechaDesde('');
        setFechaHasta('');
        fetchPedidos(); // Carga el historial completo
    };

    return (
        <div className="ventas-container"> {/* Usa el mismo container de ventas */}

            <Header />

            <div className="ventas-content">
                {/* SIDEBAR CON LOS MISMOS BOTONES Y DISEÑO DE VENTAS */}
                <aside className="ventas-sidebar">
                    <button
                        className="btn-anular"
                        onClick={cancelarPedido}
                        style={{
                            backgroundColor: pedidoSeleccionado ? '#e74c3c' : '#95a5a6',
                            color: 'white',
                            marginTop: '15px',
                            cursor: pedidoSeleccionado ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!pedidoSeleccionado}
                    >
                        Cancelar mi Pedido
                    </button>

                    {/* SECCIÓN DEL FILTRO DE FECHAS EN PEDIDOS */}
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

                    {/* Botón dinámico para limpiar la búsqueda */}
                    {(fechaDesde || fechaHasta) && (
                        <button 
                            className="btn-buscar" 
                            style={{ backgroundColor: '#ffffff', marginTop: '5px' }} 
                            onClick={handleLimpiarFiltro}
                        >
                            Limpiar Filtro
                        </button>
                    )}

                </aside>

                {/* CUERPO PRINCIPAL CON TABLAS */}
                <main className="ventas-main">
                    {/* TABLA PRINCIPAL DE PEDIDOS SOLICITADOS */}
                    <div className="table-wrapper">
                        <h3>Historial de mis Pedidos </h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID Pedido</th>
                                    <th>Cliente / Usuario</th>
                                    <th>Fecha Solicitud</th>
                                    <th>Total a Pagar</th>
                                    <th>Estado Actual</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '10px' }}>No hay pedidos registrados en este rango.</td>
                                    </tr>
                                ) : (
                                    pedidos.map(p => {
                                        const isSelected = pedidoSeleccionado?.id === p.id;
                                        
                                        // Estilo de color dinámico según el estado del pedido
                                        let estadoColor = '#7f8c8d';
                                        if (p.estado === 'PENDIENTE') estadoColor = '#e67e22';
                                        if (p.estado === 'PREPARANDO') estadoColor = '#f1c40f';
                                        if (p.estado === 'ENVIADO') estadoColor = '#3498db';
                                        if (p.estado === 'ENTREGADO') estadoColor = '#2ecc71';
                                        if (p.estado === 'CANCELADO') estadoColor = '#e74c3c';

                                        return (
                                            <tr
                                                key={p.id}
                                                onClick={() => setPedidoSeleccionado(p)}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#ebf5fb' : '',
                                                    fontWeight: isSelected ? 'bold' : 'normal'
                                                }}
                                                className={isSelected ? "fila-seleccionada" : ""}
                                            >
                                                <td>{String(p.id).padStart(3, '0')}</td>
                                                <td>{p.usuario?.nombre || p.usuario?.username || 'Cliente Externo'}</td>
                                                <td>{p.fecha ? new Date(p.fecha).toLocaleString() : 'Fecha no disponible'}</td>
                                                <td style={{ fontWeight: 'bold', color: '#27ae60' }}>
                                                    S/. {(p.total || 0).toFixed(2)}
                                                </td>
                                                <td style={{ fontWeight: 'bold', color: estadoColor }}>
                                                    {p.estado}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* TABLA INFERIOR: DETALLES DEL PEDIDO SELECCIONADO */}
                    <div className="table-wrapper">
                        <h3>
                            {pedidoSeleccionado
                                ? `Productos del Pedido #${String(pedidoSeleccionado.id).padStart(3, '0')}`
                                : 'Seleccione un pedido para ver sus artículos'}
                        </h3>

                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre del Producto</th>
                                    <th>Cantidad Solicitada</th>
                                    <th>Precio Unitario</th>
                                    <th>Sub Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!pedidoSeleccionado ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '15px', color: '#7f8c8d' }}>
                                            Ningún pedido seleccionado en la tabla superior.
                                        </td>
                                    </tr>
                                ) : !pedidoSeleccionado.detalles || pedidoSeleccionado.detalles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '15px', color: '#e74c3c' }}>
                                            Este pedido no registra artículos asociados.
                                        </td>
                                    </tr>
                                ) : (
                                    pedidoSeleccionado.detalles.map((d, index) => {
                                        // 💡 Extracción segura usando la nueva interfaz DetallePedido
                                        const precUnit = d.producto?.precio_venta || 0;
                                        const subT = precUnit * d.cantidad;
                                        
                                        return (
                                            <tr key={d.id || index}>
                                                <td>{d.producto?.nombre || `Producto ID: ${d.producto?.id || 'Desconocido'}`}</td>
                                                <td>{d.cantidad} u.</td>
                                                <td>S/. {precUnit.toFixed(2)}</td>
                                                <td style={{ fontWeight: 'bold' }}>S/. {subT.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>

            <Footer />

        </div>
    );
}