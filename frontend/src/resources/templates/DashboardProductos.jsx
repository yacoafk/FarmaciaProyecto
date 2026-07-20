import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, X, Eye } from 'lucide-react';

import { DashboardHeader } from './fragments/DashboardHeader';
import "../static/DashboardProductos.css";
import "../static/Dashboard.css";

import api from "../../api";

export function DashboardProductos() {

    const navigate = useNavigate();

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [busqueda, setBusqueda] = useState('');

    // Estado del formulario
    const [formData, setFormData] = useState({
        id: null,
        nombre: '',
        descripcion: '',
        precio_compra: '',
        precio_venta: '',
        stock: '',
        stockMin: '', 
        imagen: '',   
        visibilidad: true,
        categoria: { id: '' }
    });

    // Controla la búsqueda reactiva limpiando espacios vacíos
    useEffect(() => {
        fetchDatos();
    }, [busqueda]);

    const fetchDatos = async () => {
        try {
            // codificamos el parámetro por seguridad ante caracteres especiales
            const urlProductos = busqueda.trim() ? `/productos?nombre=${encodeURIComponent(busqueda)}` : '/productos';

            const response = await api.get(urlProductos);
            const categoriasRes = await api.get('/categorias');

            // Aseguramos que la respuesta sea un array antes de setear para evitar fallos de .map()
            setProductos(Array.isArray(response.data) ? response.data : []);
            setCategorias(categoriasRes.data || []);

        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    };

    // FUNCIÓN PARA DESCARGAR EL REPORTE EN PDF (CORREGIDA: Se removieron tipos de TypeScript de los parámetros)
    const descargarReportePdf = async (endpoint, nombreArchivo) => {
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

    const handleExportarExcel = async () => {
        try {
            const response = await api.get('/productos/exportar', {
                responseType: 'blob' // Esencial para archivos binarios como Excel
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventario_productos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al exportar Excel de productos:", error);
        }
    };

    // Crear categoría
    const handleCrearCategoria = async () => {
        const nombre = prompt("Nombre de la nueva categoría:");
        if (!nombre) return;

        const emoji = prompt("Emoji para la categoría (ej: 💊):") || "📦";

        try {
            const response = await api.post('/categorias', {
                nombre,
                emoji
            });

            const nuevaCat = response.data;
            setCategorias([...categorias, nuevaCat]);

            setFormData({
                ...formData,
                categoria: { id: nuevaCat.id }
            });

            alert("Categoría creada con éxito");

        } catch (error) {
            console.error("Error detallado:", error);
            if (error.response) {
                alert(`Error: ${error.response.data.message || "No se pudo crear la categoría"}`);
            } else {
                alert("No se pudo conectar con el servidor.");
            }
        }
    };

    // Guardar producto
    const handleSave = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post('/productos', formData);

            if (response.status === 200 || response.status === 201) {
                alert("Producto guardado con éxito");
                fetchDatos();
                closeModal();
                setFormData({
                    id: null,
                    nombre: '',
                    descripcion: '',
                    precio_compra: '',
                    precio_venta: '',
                    stock: '',
                    stockMin: '',
                    imagen: '',
                    visibilidad: true,
                    categoria: { id: '' }
                });
            }
        } catch (error) {
            console.error("Error al guardar:", error);
            if (error.response) {
                alert(`Error: ${error.response.data.message || 'No se pudo guardar el producto'}`);
            } else {
                alert("Error de conexión con el servidor.");
            }
        }
    };

    // Borrado Lógico (Alternar visibilidad)
    const handleDelete = async (id) => {
        if (!window.confirm("¿Deseas eliminar este producto?")) return;
        try {
            await api.patch(`/productos/${id}/visibilidad`);
            fetchDatos();
            alert("Estado actualizado");
        } catch (error) {
            alert("No se pudo eliminar el producto. Comprueba tus permisos.");
        }
    };

    const openModal = (prod = null) => {
        if (prod) {
            setFormData({
                id: prod.id,
                nombre: prod.nombre || '',
                descripcion: prod.descripcion || '',
                precio_compra: prod.precio_compra || '',
                precio_venta: prod.precio_venta || '',
                stock: prod.stock || '',
                stockMin: prod.stockMin || '', 
                imagen: prod.imagen || '',     
                visibilidad: prod.visibilidad ?? true,
                categoria: { id: prod.categoria?.id || '' }
            });
        } else {
            setFormData({
                id: null, nombre: '', descripcion: '', precio_compra: '',
                precio_venta: '', stock: '', stockMin: '', imagen: '',
                visibilidad: true, categoria: { id: '' }
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="productos-container">

            <DashboardHeader />

            <main className="productos-full-content">

                <div className="table-toolbar">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="input-search"
                        />
                    </div>
                    <div className="toolbar-actions-group">
                        <button onClick={handleExportarExcel} className="btn-confirm">
                            Exportar Excel
                        </button>
                        <button onClick={() => descargarReportePdf('/productos/exportar-pdf', 'Inventario.pdf')} className="btn-confirm">
                            Exportar a PDF
                        </button>
                        <button className="btn-confirm" onClick={() => openModal()}>
                            <Plus size={18} /> Nuevo Producto
                        </button>
                    </div>
                </div>

                {/* VISTA DE TABLA: Se oculta automáticamente en móviles mediante CSS */}
                <div className="table-wrapper tabla-escritorio">
                    <table>
                        <thead>
                            <tr>
                                <th>Imagen</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Stock / Min</th>
                                <th>P. Venta</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productos.map((prod) => (
                                <tr key={prod.id} style={{ opacity: prod.visibilidad ? 1 : 0.5 }}>
                                    <td>
                                        <img 
                                            src={prod.imagen || 'https://via.placeholder.com/50'} 
                                            alt={prod.nombre} 
                                            className="img-tabla-mini" 
                                        />
                                    </td>
                                    <td className="text-bold">
                                        {prod.nombre}
                                        {!prod.visibilidad && <span className="badge-oculto"> (Oculto)</span>}
                                    </td>
                                    <td>
                                        <span className="cat-tag">
                                            {prod.categoria?.emoji} {prod.categoria?.nombre}
                                        </span>
                                    </td>
                                    <td className={prod.stock <= prod.stockMin ? "low-stock" : ""}>
                                        {prod.stock} / <small>{prod.stockMin}</small>
                                    </td>
                                    <td className="text-price">s/{prod.precio_venta}</td>
                                    <td className="actions-cell">
                                        <button onClick={() => openModal(prod)} className="btn-icon-edit"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(prod.id)} className="btn-icon-delete">
                                            {prod.visibilidad ? <Trash2 size={18} /> : <Eye size={18} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* VISTA DE TARJETAS: Se activa automáticamente en móviles mediante CSS */}
                <div className="tarjetas-productos-movil">
                    {productos.map((prod) => (
                        <div 
                            key={prod.id} 
                            className="tarjeta-prod-item" 
                            style={{ opacity: prod.visibilidad ? 1 : 0.5 }}
                        >
                            <div className="tarjeta-prod-header">
                                <img 
                                    src={prod.imagen || 'https://via.placeholder.com/50'} 
                                    alt={prod.nombre} 
                                    className="tarjeta-prod-img" 
                                />
                                <div className="tarjeta-prod-detalles-principales">
                                    <h4 className="text-bold">
                                        {prod.nombre}
                                        {!prod.visibilidad && <span className="badge-oculto" style={{fontSize: '12px', color: '#78716c'}}> (Oculto)</span>}
                                    </h4>
                                    <span className="cat-tag">
                                        {prod.categoria?.emoji} {prod.categoria?.nombre}
                                    </span>
                                </div>
                            </div>

                            <div className="tarjeta-prod-body">
                                <div className="tarjeta-prod-fila">
                                    <span className="text-muted">Stock / Mínimo:</span>
                                    <span className={prod.stock <= prod.stockMin ? "low-stock" : "text-bold"}>
                                        {prod.stock} / <small style={{color: '#78716c'}}>{prod.stockMin}</small> {prod.stock <= prod.stockMin && '⚠️'}
                                    </span>
                                </div>
                                <div className="tarjeta-prod-fila">
                                    <span className="text-muted">Precio Venta:</span>
                                    <span className="text-price">s/{prod.precio_venta}</span>
                                </div>
                            </div>

                            <div className="tarjeta-prod-actions">
                                <button onClick={() => openModal(prod)} className="btn-icon-edit flex-grow-btn">
                                    <Edit size={16} /> Editar
                                </button>
                                <button onClick={() => handleDelete(prod.id)} className="btn-icon-delete flex-grow-btn">
                                    {prod.visibilidad ? <Trash2 size={16} /> : <Eye size={16} />} Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

            </main>

            {/* MODAL (Se mantiene intacto) */}
            {isModalOpen && (
                <div
                    className="modal-overlay"
                    onClick={(e) => e.target.className === 'modal-overlay' && closeModal()}
                >
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>{formData.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={closeModal} className="btn-close">
                                <X />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="modal-form">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    required
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>URL de la Imagen</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={formData.imagen}
                                    onChange={(e) => setFormData({ ...formData, imagen: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Stock Actual</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        required
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock Mínimo (Alerta)</label>
                                    <input
                                        type="number"
                                        value={formData.stockMin}
                                        required
                                        onChange={(e) => setFormData({ ...formData, stockMin: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Descripción</label>
                                <input
                                    type="text"
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Precio Compra</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_compra}
                                        required
                                        onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Precio Venta</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio_venta}
                                        required
                                        onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Categoría</label>
                                <div className="select-with-action">
                                    <select
                                        value={formData.categoria.id}
                                        required
                                        onChange={(e) => setFormData({ ...formData, categoria: { id: e.target.value } })}
                                    >
                                        <option value="">Seleccione...</option>
                                        {categorias.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.emoji} {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <button type="button" className="btn-add-inline" onClick={handleCrearCategoria}>
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn-cancel">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-confirm">
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}