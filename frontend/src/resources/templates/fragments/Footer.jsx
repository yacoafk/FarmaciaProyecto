import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Se agregó Link
import { Heart, Home, ShoppingBag, User } from 'lucide-react'; // Se agregaron los iconos faltantes

import "../../static/Footer.css";

export function Footer() {
    return (
        <footer className="main-footer">
            <div className="footer-container">
                <p className="footer-text">
                    © 2026 <span className="brand-highlight">MediExpress</span> - Tu bienestar es nuestra prioridad.
                </p>
            </div>
        </footer>
    );
}