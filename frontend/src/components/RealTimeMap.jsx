import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ── Fix crítico: o Leaflet detecta o caminho dos ícones via meta da URL do CSS,
// mas o Vite re-escreve os caminhos. Precisamos sobrescrever manualmente.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const GOLD_ICON = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const BLUE_ICON = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Componente interno para invalidar o tamanho do mapa após render
// (resolve o bug onde o mapa fica em tamanho 0 dentro de flex containers)
const MapInvalidator = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const RealTimeMap = ({ montadores }) => {
    const user = JSON.parse(localStorage.getItem('montador') || '{}');
    const defaultCenter = [-27.5945, -48.5477];

    // Filtrar montadores com coordenadas válidas
    const activeMontadores = (montadores || []).filter(m =>
        m.lat !== null && m.lat !== undefined &&
        m.lng !== null && m.lng !== undefined &&
        !isNaN(parseFloat(m.lat)) && !isNaN(parseFloat(m.lng))
    );

    const firstWithLoc = activeMontadores[0];
    const center = firstWithLoc
        ? [parseFloat(firstWithLoc.lat), parseFloat(firstWithLoc.lng)]
        : defaultCenter;

    return (
        <div style={{ height: '100%', width: '100%', minHeight: '300px' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%', minHeight: '300px', borderRadius: '1rem' }}
                scrollWheelZoom={false}
            >
                {/* CartoDB Voyager — HTTPS nativo, sem rate-limit agressivo, visual neutro e bonito */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
                    subdomains="abcd"
                    maxZoom={20}
                    crossOrigin="anonymous"
                />

                {/* Componente que força o mapa a recalcular o tamanho */}
                <MapInvalidator />

                {activeMontadores.map((m) => {
                    const isMe = Number(m.id) === Number(user.id);
                    const lat = parseFloat(m.lat);
                    const lng = parseFloat(m.lng);

                    return (
                        <Marker
                            key={m.id}
                            position={[lat, lng]}
                            icon={isMe ? GOLD_ICON : BLUE_ICON}
                        >
                            <Popup>
                                <div style={{ padding: '4px', minWidth: '150px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: m.status === 'disponivel' ? '#10b981' : '#94a3b8'
                                        }} />
                                        <p style={{ fontWeight: 'bold', color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
                                            {m.nome} {isMe && <span style={{ fontSize: '10px', color: '#C9A84C', fontFamily: 'monospace', marginLeft: '4px' }}>(VOCÊ)</span>}
                                        </p>
                                    </div>
                                    <p style={{ fontSize: '9px', fontFamily: 'monospace', color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        {m.status}
                                    </p>
                                    <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px' }}>
                                        <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontStyle: 'italic' }}>
                                            {lat.toFixed(4)}, {lng.toFixed(4)}
                                        </span>
                                        {isMe && (
                                            <span style={{ color: '#C9A84C', fontWeight: 'bold', padding: '1px 6px', backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: '4px' }}>
                                                MINHA POSIÇÃO
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default RealTimeMap;

