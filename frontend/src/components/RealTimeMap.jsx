import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// URLs fixas para evitar dependência de imports do Vite que podem falhar no runtime
const BLUE_ICON = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
const GOLD_ICON = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png';
const SHADOW_URL = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png';

const createIcon = (url) => new L.Icon({
    iconUrl: url,
    shadowUrl: SHADOW_URL,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = createIcon(BLUE_ICON);
const goldIcon = createIcon(GOLD_ICON);

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
        <div className="h-full w-full relative">
            <MapContainer 
                center={center} 
                zoom={13} 
                className="h-full w-full bg-slate-100"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {activeMontadores.map((m) => {
                    const isMe = Number(m.id) === Number(user.id);
                    const lat = parseFloat(m.lat);
                    const lng = parseFloat(m.lng);

                    return (
                        <Marker 
                            key={m.id} 
                            position={[lat, lng]}
                            icon={isMe ? goldIcon : blueIcon}
                        >
                            <Popup>
                                <div className="p-1 min-w-[150px]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${m.status === 'disponivel' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                        <p className="font-bold text-slate-800 m-0 leading-tight">
                                            {m.nome} {isMe && <span className="text-[10px] text-accent font-mono ml-1">(VOCÊ)</span>}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-mono text-slate-500 m-0 uppercase tracking-widest">{m.status}</p>
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[9px]">
                                        <span className="text-slate-400 font-mono italic">
                                            {lat.toFixed(4)}, {lng.toFixed(4)}
                                        </span>
                                        {isMe && <span className="text-accent font-bold px-1.5 py-0.5 bg-accent/10 rounded">MINHA POSIÇÃO</span>}
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
