import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaMapMarkerAlt } from "react-icons/fa";


// Custom marker icon
const customIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Mock nearby connections
const nearbyConnections = [
    { name: "Justin Gethje", location: [19.075, 72.8777] },
    { name: "Kiara Kapoor", location: [19.2, 72.9] },
    { name: "Vineet Arora", location: [19.1, 72.88] },
    { name: "Max Holloway", location: [19.05, 72.85] },
];

// Component to programmatically fly to a location
const FlyToLocation = ({ position }) => {
    const map = useMap();
    if (position) {
        map.flyTo(position, 15); // Zoom into the person
    }
    return null;
};

const MapPage = () => {
    const [userLocation, setUserLocation] = useState([19.076, 72.8777]);
    const [showMap, setShowMap] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null); // Selected person

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation([position.coords.latitude, position.coords.longitude]);
            });
        }
    }, []);

    return (
        <div className="flex flex-col h-screen">
            <Navbar />

            <div className="pt-25 flex-1 p-4 bg-[#1a1a1a] overflow-auto">
                {!showMap ? (
                    <div className="w-full max-w-md mx-auto bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl shadow-lg p-6 flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                            Nearby Connections
                        </h2>
                        <ul className="flex flex-col gap-4">
                            {nearbyConnections.map((conn, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-300 hover:shadow-lg hover:scale-105 transition-transform duration-200 bg-white"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Optional placeholder avatar */}
                                        <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center text-white font-semibold text-lg">
                                            {conn.name.charAt(0)}
                                        </div>
                                        <span className="font-medium text-gray-700">{conn.name}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedLocation(conn.location);
                                            setShowMap(true);
                                        }}
                                        className="bg-[#C5B239] p-3 rounded-full text-white hover:opacity-90 transition"
                                    >
                                        <FaMapMarkerAlt />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                ) : (
                <div className="h-full w-full relative">
                    {/* Back button */}
                    <button
                        onClick={() => {
                            setShowMap(false);
                            setSelectedLocation(null);
                        }}
                        className="absolute top-4 right-4 z-[1000] bg-[#C5B239] text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition pointer-events-auto"
                    >
                        Back
                    </button>

                    <MapContainer
                        center={selectedLocation || userLocation}
                        zoom={13}
                        className="h-full w-full"
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                        />

                        {selectedLocation && <FlyToLocation position={selectedLocation} />}

                        {/* User location */}
                        <Marker position={userLocation} icon={customIcon}>
                            <Popup>You are here</Popup>
                        </Marker>

                        {/* Nearby connections */}
                        {nearbyConnections.map((conn, idx) => (
                            <Marker key={idx} position={conn.location} icon={customIcon}>
                                <Popup>{conn.name}</Popup>
                            </Marker>
                        ))}

                        {/* Nearby radius */}
                        <Circle
                            center={userLocation}
                            radius={2000}
                            pathOptions={{
                                color: "#C5B239",
                                fillColor: "#C5B239",
                                fillOpacity: 0.2,
                            }}
                        />
                    </MapContainer>
                </div>

                )}
            </div>
        </div>
    );
};

export default MapPage;
