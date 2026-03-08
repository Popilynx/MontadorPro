import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones do Leaflet no Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const RealTimeMap = ({ montadores }) => {
    // Coordenadas iniciais (Florianópolis, SC)
    const center = [-27.5945, -48.5477];

    return (
        <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
            <MapContainer center={center} zoom={12} className="h-full w-full">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {montadores?.filter(m => m.latitude && m.longitude).map((m) => (
                    <Marker key={m.id} position={[parseFloat(m.latitude), parseFloat(m.longitude)]}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-slate-800 m-0">{m.nome}</p>
                                <p className="text-xs text-slate-500 m-0">{m.status.toUpperCase()}</p>
                                <p className="text-xs text-slate-400 m-0 mt-1">{m.os_ativas} OS ativa(s)</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default RealTimeMap;
