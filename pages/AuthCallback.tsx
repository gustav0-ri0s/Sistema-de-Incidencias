
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            // Extraer parámetros desde window.location.hash
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);

            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            const returnTo = params.get('returnTo') || '/';

            if (access_token && refresh_token) {
                try {
                    const { error } = await supabase.auth.setSession({
                        access_token,
                        refresh_token,
                    });

                    if (error) throw error;

                    // Limpiar el hash
                    window.history.replaceState(null, '', window.location.pathname);

                    // Redirigir al usuario
                    navigate(returnTo, { replace: true });
                } catch (error) {
                    console.error('Error setting session:', error);
                    // Redirigir al portal en caso de error
                    window.location.href = `${import.meta.env.VITE_PORTAL_URL}/login?error=session_error`;
                }
            } else {
                // Si no hay tokens, redirigir al portal
                window.location.href = `${import.meta.env.VITE_PORTAL_URL}/login`;
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-brand-light">
            <div className="w-16 h-16 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-black text-brand-turquoise uppercase tracking-widest text-xs">Autenticando...</p>
        </div>
    );
};

export default AuthCallback;
