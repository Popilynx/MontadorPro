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

// Ícone dourado: SVG inline — sem dependência de CDN externo (evita bloqueio CSP)
const GOLD_ICON = L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="25" height="37">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24S24 21 24 12C24 5.37 18.63 0 12 0z"
        fill="#C9A84C" stroke="#8B6914" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`,
    iconSize: [25, 37],
    iconAnchor: [12, 37],
    popupAnchor: [1, -34],
});

// Ícone azul: SVG inline também, para consistência
const BLUE_ICON = L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="25" height="37">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24S24 21 24 12C24 5.37 18.63 0 12 0z"
        fill="#2563EB" stroke="#1E40AF" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/>
    </svg>`,
    iconSize: [25, 37],
    iconAnchor: [12, 37],
    popupAnchor: [1, -34],
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

