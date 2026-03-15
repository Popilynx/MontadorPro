import React, { useEffect } from 'react';
import api from '../api/api';

const Geolocator = () => {
    useEffect(() => {
        const updateLocation = async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                await api.patch('/montadores/location', { latitude, longitude });
                console.log('%c[GPS] Localização enviada com sucesso:', 'color: #10b981; font-weight: bold;', latitude, longitude);
            } catch (err) {
                console.error('[GPS] Erro ao enviar localização para o servidor:', err);
            }
        };

        const handleError = (error) => {
            let errorMsg = 'Erro desconhecido';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Permissão negada pelo usuário (Verifique se o site tem permissão para usar GPS)';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Informação de localização indisponível';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'Tempo esgotado ao tentar obter localização';
                    break;
                default:
                    errorMsg = error.message;
            }
            console.warn(`%c[GPS] ${errorMsg}`, 'color: #f59e0b; font-weight: bold;');
        };

        if (navigator.geolocation) {
            console.log('%c[GPS] Iniciando rastreamento...', 'color: #3b82f6; font-weight: bold;');
            const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 5000
            });

            return () => {
                console.log('[GPS] Parando rastreamento.');
                navigator.geolocation.clearWatch(watchId);
            };
        } else {
            console.error('[GPS] Navegador não suporta geolocalização.');
        }
    }, []);

    return null; // Componente invisível
};

export default Geolocator;
