import { useState, useEffect } from "react";

import { Header } from './fragments/Header';
import { Footer } from './fragments/Footer';

import api from "../../api";

import "../static/Inicio.css";
import "../static/Header.css";
import "../static/Footer.css";
import "../static/Global.css";

import imagen1 from "/src/resources/static/assets/oferta2.png";
import imagen2 from "/src/resources/static/assets/oferta1.png";
import imagen3 from "/src/resources/static/assets/oferta4.png";
import imagen4 from "/src/resources/static/assets/imagen4.jpeg";

export function Inicio() {
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(0);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // 2. Datos locales (Sin llamadas a API por ahora)
  const offers = [
    {  image: imagen3, discount: 20, category: "Vitaminas" },
    {  image: imagen2, discount: 0, category: "Envío" },
    {  image: imagen1, discount: 15, category: "Medicamentos" },
    {  image: imagen4, discount: 25, category: "Suplementos" },
  ];


  interface Categoria {
  id: number;
  nombre: string;
  emoji?: string;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio_venta: number;
  categoria?: Categoria;
}

    useEffect(() => {
        fetchDatos();
    }, []);

const fetchDatos = async () => {
    try {

        const response = await api.get('/productos');
        const categoriasRes = await api.get('/categorias');

        setProductos(response.data);
        setCategorias(categoriasRes.data);

    } catch (error) {

        console.error("Error al cargar datos:", error);

    } finally {

        setLoading(false);

    }
};

  // 4. Auto-carrusel
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedOffer(prev => (prev + 1) % offers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [offers.length]);

// --- NUEVA LÓGICA: AGREGAR AL CARRITO ---
  const agregarAlCarrito = (producto: Producto) => {
    const carritoActual = JSON.parse(localStorage.getItem("carrito_mediexpress") || "[]");
    
    const itemExistente = carritoActual.find((item: any) => item.id === producto.id);

    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      carritoActual.push({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion || "Sin descripción disponible",
        precio: producto.precio_venta,
        imagen: producto.imagen || 'https://via.placeholder.com/150',
        cantidad: 1
      });
    }

    localStorage.setItem("carrito_mediexpress", JSON.stringify(carritoActual));
    window.dispatchEvent(new Event("cartUpdate"));
    alert(`${producto.nombre} agregado al carrito`);
  };



// --- LÓGICA DE FILTRADO COMBINADA (Categoría + Nombre) ---
const productosFiltrados = productos.filter(prod => {
  // 1. Filtrar por categoría (si hay una seleccionada)
  const coincideCategoria = categoriaSeleccionada 
    ? prod.categoria?.id === categoriaSeleccionada 
    : true;

  // 2. Filtrar por nombre (si el usuario escribió algo)
  const coincideBusqueda = prod.nombre
    .toLowerCase()
    .includes(busqueda.toLowerCase().trim());

  return coincideCategoria && coincideBusqueda;
});



return (

   <div className="home-container min-h-screen bg-gray-50">

    <Header />

    <main className="w-full px-6 py-10">

        {/* Carrusel */}
        <div className="carousel-container">

          {/* 🔥 CARRUSEL */}
          <div className="carousel-card fade-in">
            
            <img 
              src={offers[selectedOffer].image} 
              className="carousel-image"
            />

            <div className="carousel-overlay">

            </div>

          </div>
        </div>

        {/* 🏷️ SECCIÓN DE CATEGORÍAS (Reales de tu BD) */}
        <section className="mt-16 w-full flex flex-col items-center">


          <h2 className="section-title">Nuestras Categorías</h2>
          <div className="category-grid">
            {/* Opción para ver "Todos" */}
            <div 
              className={`category-card ${!categoriaSeleccionada ? 'active' : ''}`}
              onClick={() => setCategoriaSeleccionada(null)}
            >
              <div className="icon-circle bg-blue-100">🏠</div>
              <h4>Todas</h4>
            </div>

            {categorias.map((cat) => (
              <div 
                key={cat.id} 
                className={`category-card ${categoriaSeleccionada === cat.id ? 'active' : ''}`}
                onClick={() => setCategoriaSeleccionada(cat.id)}
              >
                <div className="icon-circle bg-orange-100">
                  {cat.emoji || "📦"}
                </div>
                <h4>{cat.nombre}</h4>
              </div>
            ))}
          </div>
        </section>



      {/* 💊 GRILLA DE PRODUCTOS */}
      <section className="mt-12">
        {/* 🌟 Contenedor alineado con Flexbox */}
        <div className="products-grid-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          
          <h3 className="products-grid-title" style={{ margin: 0 }}>
            {categoriaSeleccionada 
              ? `Resultados en ${categorias.find(c => c.id === categoriaSeleccionada)?.nombre}` 
              : "Todos nuestros productos"}
          </h3>

          {/* 🔍 BARRA DE BÚSQUEDA DEL CLIENTE (A la derecha) */}
          <div className="search-container" style={{ margin: 0 }}>
            <input
              type="text"
              placeholder="Buscar producto por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-search"
            />
          </div>

        </div>

          <div className="products-grid">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((prod) => (
                <div key={prod.id} className="product-card">
                  <div className="product-image-wrapper">
                    <img 
                      src={prod.imagen || 'https://via.placeholder.com/150'} 
                      alt={prod.nombre} 
                    />
                  </div>
                  <div className="product-info">
                    <span className="product-category-tag">
                      {prod.categoria?.nombre}
                    </span>
                    <h4>{prod.nombre}</h4>
                    <p className="product-price">S/ {prod.precio_venta.toFixed(2)}</p>
                    <button className="btn-add-cart" onClick={() => agregarAlCarrito(prod)}> Agregar</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No hay productos en esta categoría.</p>
            )}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}