import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from './fragments/DashboardHeader';
import api from "../../api"; 

import "../static/DashboardPedidos.css";

interface DetallePedido {
    id?: number;
    cantidad: number;
    producto?: {
        id: number;
        nombre: string;
        precio_venta: number; 
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
    detalles?: DetallePedido[]; 
}

export function DashboardPedidos() {
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
            let url = '/pedidos';
            if (desde && hasta) {
                url += `?inicio=${desde}&fin=${hasta}`;
            }

            const response = await api.get(url);
            setPedidos(response.data);
            setPedidoSeleccionado(null);
        } catch (error) {
            console.error("Error al cargar pedidos desde Spring Boot:", error);
        }
    };

    const descargarReportePdf = async (endpoint: string, nombreArchivo: string) => {
        try {
            const token = localStorage.getItem("token");
            let urlFinal = endpoint;
            if (fechaDesde && fechaHasta) {
                urlFinal += `?inicio=${fechaDesde}&fin=${fechaHasta}`;
            }

            const response = await api.get(urlFinal, {
                responseType: 'blob',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', nombreArchivo); 
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al descargar el archivo PDF:", error);
            alert("No se pudo generar el documento PDF. Comprueba tus accesos.");
        }
    };

    const descargarExcel = async () => {
        try {
            let url = '/pedidos/exportar';
            if (fechaDesde && fechaHasta) {
                url += `?inicio=${fechaDesde}&fin=${fechaHasta}`;
            }

            const response = await api.get(url, { responseType: 'blob' });
            const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = urlBlob;
            link.setAttribute('download', 'reporte_pedidos.xlsx'); 
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(urlBlob);
        } catch (error) {
            console.error("Error al descargar el archivo Excel", error);
            alert("No se pudo descargar el reporte en Excel.");
        }
    };

    const actualizarEstado = async (nuevoEstado: string) => {
        if (!pedidoSeleccionado) {
            alert("Por favor, seleccione un pedido primero.");
            return;
        }

        try {
            await api.put(
                `/pedidos/${pedidoSeleccionado.id}/estado`,
                null,
                { params: { nuevoEstado } }
            );
            alert(`¡Estado del pedido actualizado a ${nuevoEstado} correctamente!`);
            fetchPedidos(fechaDesde, fechaHasta);
        } catch (error) {
            console.error(error);
            alert("No se pudo actualizar el estado del pedido.");
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

    const handleLimpiarFiltro = () => {
        setFechaDesde('');
        setFechaHasta('');
        fetchPedidos(); 
    };

    // Helper para mapear estilos dinámicos de estado a las badges de tu CSS
    const getEstadoClass = (estado: string) => {
        if (estado === 'ENTREGADO') return 'badge-status entregado';
        if (estado === 'CANCELADO') return 'badge-status cancelado';
        if (estado === 'PENDIENTE') return 'badge-status pendiente';
        return 'badge-status en-proceso'; // PREPARANDO o ENVIADO
    };

    return (
        <div className="pedidos-container"> 
            <DashboardHeader />

            <div className="pedidos-content">
                {/* SIDEBAR DE CONTROLES */}
                <aside className="pedidos-sidebar">
                    <div className="control-box">
                        <label htmlFor="estado-pedido" className="label-title">
                            Cambiar Estado del Pedido:
                        </label>
                        <select
                            id="estado-pedido"
                            className="select-estado"
                            style={{
                                backgroundColor: !pedidoSeleccionado 
                                    ? '#95a5a6' 
                                    : pedidoSeleccionado.estado === 'PREPARANDO' ? '#f39c12'
                                    : pedidoSeleccionado.estado === 'ENVIADO' ? '#3498db'
                                    : pedidoSeleccionado.estado === 'ENTREGADO' ? '#2ecc71'
                                    : '#34495e',
                            }}
                            disabled={!pedidoSeleccionado}
                            value={pedidoSeleccionado?.estado || ""}
                            onChange={(e) => {
                                if (e.target.value) actualizarEstado(e.target.value);
                            }}
                        >
                            {!pedidoSeleccionado && <option value="">Seleccione un pedido...</option>}
                            {pedidoSeleccionado?.estado === 'PENDIENTE' && (
                                <option value="PENDIENTE">⏳ Pendiente</option>
                            )}
                            <option value="PREPARANDO">👨‍🍳 Preparando</option>
                            <option value="ENVIADO">🚚 Enviado</option>
                            <option value="ENTREGADO">✅ Entregado</option>
                        </select>
                    </div>

                    <button
                        className="btn-anular"
                        onClick={cancelarPedido}
                        style={{
                            backgroundColor: pedidoSeleccionado ? '#e74c3c' : '#95a5a6',
                            cursor: pedidoSeleccionado ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!pedidoSeleccionado}
                    >
                        Cancelar Pedido
                    </button>

                    <div className="filter-group">
                        <label>Desde:</label>
                        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                        <label>Hasta:</label>
                        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                    </div>

                    <button className="btn-buscar" onClick={handleBuscarPorFechas}>Buscar</button>

                    {(fechaDesde || fechaHasta) && (
                        <button className="btn-limpiar" onClick={handleLimpiarFiltro}>
                            Limpiar Filtro
                        </button>
                    )}
                    
                    <button className="btn-excel" onClick={descargarExcel}>Exportar Excel</button>
                    <button className="btn-pdf" onClick={() => descargarReportePdf('/pedidos/exportar-pdf', 'reporte_pedidos.pdf')}>Exportar a PDF</button>
                    <button className="btn-cerrar" onClick={() => navigate('/DashboardHome')}>Cerrar</button>
                </aside>

                {/* AREA DE CONTENIDO PRINCIPAL */}
                <main className="pedidos-main">
                    
                    {/* ==========================================
                        1. VISTA DE TABLA (SOLO ESCRITORIO)
                       ========================================== */}
                    <div className="table-wrapper desktop-only">
                        <h3>Historial de Pedidos Web</h3>
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
                                        <td colSpan={5}>No hay pedidos registrados en este rango.</td>
                                    </tr>
                                ) : (
                                    pedidos.map(p => {
                                        const isSelected = pedidoSeleccionado?.id === p.id;
                                        return (
                                            <tr
                                                key={p.id}
                                                onClick={() => setPedidoSeleccionado(p)}
                                                className={isSelected ? "fila-seleccionada" : ""}
                                            >
                                                <td>#{String(p.id).padStart(3, '0')}</td>
                                                <td>{p.usuario?.nombre || p.usuario?.username || 'Cliente Externo'}</td>
                                                <td>{p.fecha ? new Date(p.fecha).toLocaleString() : 'Fecha no disponible'}</td>
                                                <td className="total-text">S/. {(p.total || 0).toFixed(2)}</td>
                                                <td>
                                                    <span className={getEstadoClass(p.estado)}>{p.estado}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ==========================================
                        2. VISTA DE TARJETAS (SOLO DISPOSITIVOS MÓVILES)
                       ========================================== */}
                    <div className="mobile-cards-container mobile-only">
                        <h3>Historial de Pedidos Web</h3>
                        {pedidos.length === 0 ? (
                            <p className="no-data-msg">No hay pedidos registrados en este rango.</p>
                        ) : (
                            pedidos.map(p => {
                                const isSelected = pedidoSeleccionado?.id === p.id;
                                return (
                                    <div 
                                        key={p.id} 
                                        className={`pedido-card-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setPedidoSeleccionado(p)}
                                    >
                                        <div className="card-header-row">
                                            <span className="card-id">Pedido #{String(p.id).padStart(3, '0')}</span>
                                            <span className={getEstadoClass(p.estado)}>{p.estado}</span>
                                        </div>
                                        <div className="card-body-row">
                                            <p><strong>Cliente:</strong> {p.usuario?.nombre || p.usuario?.username || 'Cliente Externo'}</p>
                                            <p><strong>Fecha:</strong> {p.fecha ? new Date(p.fecha).toLocaleDateString() : 'N/A'}</p>
                                            <div className="card-total-box">
                                                <span>Total:</span>
                                                <span className="card-total-val">S/. {(p.total || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="card-selection-indicator">
                                            {isSelected ? "⚡ Seleccionado para gestión" : "👉 Toca para gestionar u/o ver artículos"}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ==========================================
                        3. DETALLE DE PRODUCTOS ADQUIRIDOS (VISTA MIXTA)
                       ========================================== */}
                    <div className="table-wrapper products-details-section">
                        <h3>
                            {pedidoSeleccionado
                                ? `Productos del Pedido #${String(pedidoSeleccionado.id).padStart(3, '0')}`
                                : 'Seleccione un pedido para ver sus artículos'}
                        </h3>

                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre del Producto</th>
                                    <th>Cantidad</th>
                                    <th>P. Unitario</th>
                                    <th>Sub Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!pedidoSeleccionado ? (
                                    <tr>
                                        <td colSpan={4} style={{ color: '#7f8c8d' }}>
                                            Ningún pedido seleccionado.
                                        </td>
                                    </tr>
                                ) : !pedidoSeleccionado.detalles || pedidoSeleccionado.detalles.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ color: '#e74c3c' }}>
                                            Este pedido no registra artículos asociados.
                                        </td>
                                    </tr>
                                ) : (
                                    pedidoSeleccionado.detalles.map((d, index) => {
                                        const precUnit = d.producto?.precio_venta || 0;
                                        const subT = precUnit * d.cantidad;
                                        return (
                                            <tr key={d.id || index}>
                                                <td data-label="Producto">{d.producto?.nombre || `ID: ${d.producto?.id}`}</td>
                                                <td data-label="Cantidad">{d.cantidad} u.</td>
                                                <td data-label="P. Unitario">S/. {precUnit.toFixed(2)}</td>
                                                <td data-label="Sub Total" style={{ fontWeight: 'bold', color: '#ff7300' }}>S/. {subT.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}