import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingBag, User, LogOut } from 'lucide-react';

import "../../static/Header.css";

export function Header() {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Cada vez que el componente se cargue, leemos los datos específicos del Login
    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        const role = localStorage.getItem('userRole');
        
        if (email && role) {
            setUserEmail(email);
            setUserRole(role);
        }
    }, []);

    const handleLogout = () => {
        if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
            // Limpiamos los nombres exactos que usa tu Login.tsx
            localStorage.removeItem('userEmail'); 
            localStorage.removeItem('userRole'); 
            localStorage.removeItem('userId'); 

            // Limpiamos los estados locales
            setUserEmail(null);
            setUserRole(null);

            // Redirigimos al inicio limpios
            navigate('/');
            window.location.reload();
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-orange-500 to-orange-700 shadow-lg transition-all duration-300">
            <div className="header-container mx-auto px-6 py-3 max-w-[1400px] grid grid-cols-3 items-center">
                
                {/* 1. LADO IZQUIERDO: BRANDING */}
                <div className="header-left">
                    <Link to="/" className="flex items-center gap-2 group transition-transform active:scale-95">
                        <Heart className="w-8 h-8 text-white fill-white group-hover:animate-pulse" />
                        <span className="brand-title text-white text-2xl font-extrabold tracking-tighter">
                            MediExpress
                        </span>
                    </Link>
                </div>

                {/* 2. CENTRO */}
                <div className="header-center flex justify-center">
                    {/* Espacio para futuras implementaciones */}
                </div>
                
                {/* 3. LADO DERECHO: ACCIONES */}
                <div className="header-right flex justify-end gap-6">
                    <Link to="/carrito" className="nav-link group">
                        <ShoppingBag className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
                        <span className="hidden md:block font-medium">Carrito</span>
                    </Link>

                    {/* Si existe un correo en el estado, significa que hay alguien logueado */}
                    {userEmail ? (
                        <>
                            <Link to="/perfil" className="nav-link group">
                                <User className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
                                <span className="hidden md:block font-medium">Mi perfil</span>
                            </Link>

                        </>
                    ) : (
                        /* Si NO hay usuario logueado, mostramos "Iniciar Sesión" */
                        <Link to="/login" className="nav-link group">
                            <User className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
                            <span className="hidden md:block font-medium">Iniciar Sesión</span>
                        </Link>
                    )}
                </div>

            </div>  
        </header>
    );
}