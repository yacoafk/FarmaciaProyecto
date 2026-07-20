import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, LogOut } from 'lucide-react'; // Importamos LogOut de lucide-react

import "../../static/DashboardHeader.css";

export function DashboardHeader() {
    const navigate = useNavigate();
    const [hora, setHora] = useState(new Date().toLocaleTimeString());

    // Lógica para el reloj en tiempo real
    useEffect(() => {
        const timer = setInterval(() => {
            setHora(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        if (window.confirm("¿Seguro que deseas cerrar sesión?")) {
            localStorage.removeItem('userEmail'); 
            localStorage.removeItem('userRole'); 
            localStorage.removeItem('userId'); 
        
            sessionStorage.removeItem('userEmail');
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('userId');

            navigate('/'); 
            window.location.reload();
        }
    };
    
    return (
        <header className="admin-header">
            <div className="header-brand">
                <div 
                    className="flex-items-center cursor-pointer" 
                    onClick={() => navigate('/DashboardHome')}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <Heart className="w-8 h-8 text-white fill-white" />
                    <span className="brand-title text-white">MediExpress</span>
                </div>
                {/* Agregamos una clase específica al reloj */}
                <span className="admin-clock hide-on-mobile">{hora}</span>
            </div>

            <div className="header-actions">
                <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
                    <LogOut size={18} />
                    {/* Envolvemos el texto en un span para ocultarlo en móvil */}
                    <span className="logout-text">Salir</span>
                </button>
            </div>
        </header>
    );
}