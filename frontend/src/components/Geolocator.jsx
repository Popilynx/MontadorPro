import React, { useEffect } from 'react';
import api from '../api/api';

const Geolocator = () => {
    useEffect(() => {
        const updateLocation = async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                await api.patch('/montadores/location', { latitude, longitude });
                console.log('Localização enviada:', latitude, longitude);
            } catch (err) {
                console.error('Erro ao enviar localização:', err);
            }
        };

        const handleError = (error) => {
            console.error('Erro de geolocalização:', error);
        };

        // Solicita permissão e começa a observar
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            });

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    return null; // Componente invisível
};

export default Geolocator;
