import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { FaMapMarkerAlt, FaBriefcase, FaGraduationCap, FaArrowLeft } from "react-icons/fa";
import axios from "axios";

// Fix leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const userIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const connectionIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const MapPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState("check"); // check, input, map
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyConnections, setNearbyConnections] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [manualLat, setManualLat] = useState("");
    const [manualLon, setManualLon] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const API_URL = "http://localhost:5001/api";

    // Check if user has location on mount
    useEffect(() => {
        checkUserLocation();
    }, []);

    const checkUserLocation = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/locations/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setUserLocation({
                    latitude: parseFloat(response.data.location.latitude),
                    longitude: parseFloat(response.data.location.longitude),
                });
                setStep("map");
                fetchNearbyConnections();
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setStep("input");
            } else {
                console.error("Error checking location:", err);
                setStep("input");
            }
        }
    };

    const fetchNearbyConnections = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/locations/nearby?radius=50`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setNearbyConnections(response.data.nearbyUsers);
                setUserLocation({
                    latitude: parseFloat(response.data.userLocation.latitude),
                    longitude: parseFloat(response.data.userLocation.longitude),
                });
            }
        } catch (err) {
            console.error("Error fetching nearby connections:", err);
            setError("Failed to fetch nearby connections");
        }
    };

    const handleGPSLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser. Please use manual input.");
            return;
        }

        setLoading(true);
        setError("");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await saveLocation(latitude, longitude, "gps");
            },
            (err) => {
                setLoading(false);

                // Provide specific error messages based on error code
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError("Location access denied. Please enable location permissions in your browser settings and try again, or use manual input.");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError("Location information unavailable. Please check your device's location services or use manual input.");
                        break;
                    case err.TIMEOUT:
                        setError("Location request timed out. Please try again or use manual input.");
                        break;
                    default:
                        setError("Unable to retrieve your location. Please use manual input.");
                }

                console.error("Geolocation error:", err.code, err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const handleManualLocation = async () => {
        const lat = parseFloat(manualLat);
        const lon = parseFloat(manualLon);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            setError("Please enter valid coordinates");
            return;
        }

        setLoading(true);
        setError("");
        await saveLocation(lat, lon, "manual");
    };

    const saveLocation = async (latitude, longitude, type) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${API_URL}/locations`,
                {
                    latitude,
                    longitude,
                    location_type: type,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                setUserLocation({ latitude, longitude });
                setStep("map");
                fetchNearbyConnections();
            }
        } catch (err) {
            setError("Failed to save location. Please try again.");
            console.error("Error saving location:", err);
        } finally {
            setLoading(false);
        }
    };

    const renderLocationInput = () => (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl shadow-lg p-6">
            {/* Back button */}
            <button
                onClick={() => navigate("/home")}
                className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
                <FaArrowLeft />
                <span>Back to Home</span>
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Set Your Location
            </h2>
            <p className="text-gray-600 text-center mb-6">
                To see nearby connections, please set your location first
            </p>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Get My Location (GPS) */}
                <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-[#C5B239] transition">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">Get My Location</h3>
                    <p className="text-sm text-gray-600 mb-4 text-center">Use your device's GPS</p>
                    <button
                        onClick={handleGPSLocation}
                        disabled={loading}
                        className="w-full bg-[#C5B239] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                        {loading ? "Getting Location..." : "Use GPS"}
                    </button>
                </div>

                {/* Manual Input */}
                <div className="bg-white rounded-xl p-6 shadow-md border-2 border-gray-200 hover:border-[#C5B239] transition">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">Manual Input</h3>
                    <p className="text-sm text-gray-600 mb-4 text-center">Enter coordinates manually</p>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                placeholder="e.g., 19.076"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5B239] text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-medium mb-1 text-sm">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={manualLon}
                                onChange={(e) => setManualLon(e.target.value)}
                                placeholder="e.g., 72.8777"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C5B239] text-sm"
                            />
                        </div>
                        <button
                            onClick={handleManualLocation}
                            disabled={loading}
                            className="w-full bg-[#C5B239] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Set Location"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMap = () => (
        <div className="h-full w-full relative">
            {/* Back button */}
            <button
                onClick={() => setStep("input")}
                className="absolute top-4 left-4 z-[1001] bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition"
            >
                <FaArrowLeft />
                <span>Change Location</span>
            </button>

            {/* Info panel */}
            <div className="absolute top-16 left-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <h3 className="font-bold text-gray-800 mb-2">Nearby Connections</h3>
                <p className="text-sm text-gray-600">
                    {nearbyConnections.length} connection{nearbyConnections.length !== 1 ? "s" : ""} within 50km
                </p>
            </div>

            {/* Selected user details */}
            {selectedUser && (
                <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-sm">
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                        {selectedUser.profile_image ? (
                            <img
                                src={selectedUser.profile_image}
                                alt={selectedUser.name}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-[#C5B239] flex items-center justify-center text-white text-2xl font-bold">
                                {selectedUser.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-gray-800">{selectedUser.name}</h3>
                            <p className="text-sm text-gray-600">{selectedUser.role}</p>
                        </div>
                    </div>

                    {selectedUser.current_position && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                            <FaBriefcase className="text-[#C5B239]" />
                            <span>{selectedUser.current_position}</span>
                        </div>
                    )}

                    {selectedUser.current_company && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                            <FaBriefcase className="text-[#C5B239]" />
                            <span>{selectedUser.current_company}</span>
                        </div>
                    )}

                    {selectedUser.college && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                            <FaGraduationCap className="text-[#C5B239]" />
                            <span>{selectedUser.college}</span>
                        </div>
                    )}

                    {selectedUser.bio && (
                        <p className="text-sm text-gray-600 mt-3">{selectedUser.bio}</p>
                    )}

                    <div className="text-xs text-gray-500 mt-3">
                        Distance: {selectedUser.distance_km?.toFixed(2)} km away
                    </div>
                </div>
            )}

            <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={11}
                className="h-full w-full"
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                />

                {/* User location marker */}
                <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
                    <Popup>
                        <div className="text-center">
                            <strong>You are here</strong>
                        </div>
                    </Popup>
                </Marker>

                {/* Nearby connections markers */}
                {nearbyConnections.map((conn) => (
                    <Marker
                        key={conn.user_id}
                        position={[parseFloat(conn.latitude), parseFloat(conn.longitude)]}
                        icon={connectionIcon}
                        eventHandlers={{
                            click: () => setSelectedUser(conn),
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <strong>{conn.name}</strong>
                                <br />
                                <span className="text-sm text-gray-600">{conn.role}</span>
                                <br />
                                <span className="text-xs text-gray-500">
                                    {conn.distance_km?.toFixed(2)} km away
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Nearby radius circle */}
                <Circle
                    center={[userLocation.latitude, userLocation.longitude]}
                    radius={50000} // 50km in meters
                    pathOptions={{
                        color: "#C5B239",
                        fillColor: "#C5B239",
                        fillOpacity: 0.1,
                    }}
                />
            </MapContainer>
        </div>
    );

    return (
        <div className="flex flex-col h-screen">
            <Navbar />

            <div className="pt-20 flex-1 p-4 bg-[#1a1a1a] overflow-auto">
                {step === "check" && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-white text-xl">Checking your location...</div>
                    </div>
                )}

                {step === "input" && renderLocationInput()}

                {step === "map" && userLocation && renderMap()}
            </div>
        </div>
    );
};

export default MapPage;
