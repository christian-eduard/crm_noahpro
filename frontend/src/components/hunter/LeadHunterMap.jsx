
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para actualizar el mapa cuando cambia la ubicación
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
};

// Componente para manejar clicks en el mapa
const LocationMarker = ({ position, setPosition, setLocationName }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            // Opcional: Podríamos hacer reverse geocoding aquí si quisiéramos mostrar el nombre
            setLocationName(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
        },
    });

    return position ? (
        <Marker position={position}>
            <Popup>Zona seleccionada</Popup>
        </Marker>
    ) : null;
};

const LeadHunterMap = ({ initialLocation, onLocationSelect, radius = 5000, forcedCenter }) => {
    const defaultCenter = [40.416775, -3.703790]; // Madrid por defecto
    const [position, setPosition] = useState(null);
    const [center, setCenter] = useState(defaultCenter);

    // React to forced center updates from parent
    useEffect(() => {
        if (forcedCenter) {
            setCenter(forcedCenter);
            setPosition({ lat: forcedCenter[0], lng: forcedCenter[1] });
        }
    }, [forcedCenter]);

    // Intentar geocodificar la ubicación inicial si es texto
    useEffect(() => {
        if (initialLocation && !initialLocation.includes(',')) {
            // Es un texto, en una app real usaríamos un servicio de geocoding
            // Por simplicidad, si es texto, no centramos automáticamente o usamos un mock
            // Si fuera lat,lng, lo parseamos
        } else if (initialLocation && initialLocation.includes(',')) {
            const [lat, lng] = initialLocation.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                const newPos = { lat, lng };
                setPosition(newPos);
                setCenter([lat, lng]);
            }
        }
    }, [initialLocation]);

    const handleLocationSelect = (newPos) => {
        setPosition(newPos);
        const locString = `${newPos.lat.toFixed(6)},${newPos.lng.toFixed(6)}`;
        if (onLocationSelect) {
            onLocationSelect(locString);
        }
    };

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 z-0 relative">
            <MapContainer
                center={center}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                    position={position}
                    setPosition={handleLocationSelect}
                    setLocationName={() => { }}
                />
                {position && (
                    <Circle
                        center={position}
                        radius={radius}
                        pathOptions={{ color: 'orange', fillColor: 'orange', fillOpacity: 0.2 }}
                    />
                )}
                <RecenterMap center={center} />
            </MapContainer>

            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg z-[400] text-xs max-w-xs">
                <p className="font-semibold mb-1 dark:text-white">Instrucciones:</p>
                <p className="text-gray-600 dark:text-gray-300">Haz clic en el mapa para seleccionar el centro de búsqueda.</p>
            </div>
        </div>
    );
};

export default LeadHunterMap;
