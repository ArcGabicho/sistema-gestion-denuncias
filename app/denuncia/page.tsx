"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

const Denuncia = () => {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        crimeType: string;
        date: string;
        location: string;
        evidence: File | null;
    }>({
        title: "",
        description: "",
        crimeType: "",
        date: "",
        location: "",
        evidence: null,
    });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Set the current date
        const currentDate = new Date().toLocaleDateString();
        setFormData((prev) => ({ ...prev, date: currentDate }));

        // Get the user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = `${position.coords.latitude}, ${position.coords.longitude}`;
                    setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                    setFormData((prev) => ({ ...prev, location: loc }));
                },
                (error) => {
                    console.error("Error getting location:", error);
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setFormData((prev) => ({ ...prev, evidence: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, evidence: null }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowModal(true);
    };

    return (
        <main className="flex flex-col lg:flex-row h-screen">
            <div className="w-full lg:w-2/6 py-20 px-8 md:py-14 md:px-10">
                <h1 className="text-2xl font-bold mb-4">Formulario de Denuncia</h1>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="flex flex-col">
                        <label htmlFor="title" className="text-sm font-medium">Título</label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="Ingrese el título de la denuncia"
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="crimeType" className="text-sm font-medium">Tipo de Delito</label>
                        <select
                            id="crimeType"
                            value={formData.crimeType}
                            onChange={handleInputChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">Seleccione el tipo de delito</option>
                            <option value="robo">Robo</option>
                            <option value="estafa">Estafa</option>
                            <option value="violencia">Violencia</option>
                            <option value="acoso">Acoso</option>
                            <option value="drogas">Poseción de drogas</option>
                            <option value="corrupción">Corrupción</option>
                            <option value="abuso">Abuso de Autoridad</option>
                            <option value="homicidio">Homicidio</option>
                            <option value="secuestro">Secuestro</option>
                            <option value="violacion">Violación</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="description" className="text-sm font-medium">Descripción</label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Ingrese la descripción de la denuncia"
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={4}
                        ></textarea>
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="date" className="text-sm font-medium">Fecha de la Denuncia</label>
                        <input
                            type="text"
                            id="date"
                            value={formData.date}
                            readOnly
                            className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-black"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="location" className="text-sm font-medium">Ubicación</label>
                        <input
                            type="text"
                            id="location"
                            value={formData.location}
                            readOnly
                            className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-black"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="evidence" className="text-sm font-medium">Evidencia</label>
                        <input
                            type="file"
                            id="evidence"
                            onChange={handleFileChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-500 to-red-800 text-white py-2 rounded-md hover:bg-red-700 transition duration-200"
                    >
                        Enviar Denuncia
                    </button>
                </form>
            </div>
            <div className="hidden lg:block w-4/6 relative">
                {location ? (
                    <div className="absolute inset-0 w-full h-full">
                        <MapContainer center={[location.lat, location.lng]} zoom={15} className="w-full h-full" style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={[location.lat, location.lng]}>
                                <Popup>Tu ubicación</Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                ) : (
                    <p className="text-center mt-20">Obteniendo ubicación...</p>
                )}
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-black p-10 rounded-lg shadow-2xl max-w-2xl w-full relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-3xl font-bold focus:outline-none"
                            aria-label="Cerrar"
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-center">Denuncia Enviada</h2>
                        <div className="space-y-2 mb-8">
                            <p><strong>Título:</strong> {formData.title}</p>
                            <p><strong>Tipo de Delito:</strong> {formData.crimeType}</p>
                            <p><strong>Descripción:</strong> {formData.description}</p>
                            <p><strong>Fecha:</strong> {formData.date}</p>
                            <p><strong>Ubicación:</strong> {formData.location}</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-gradient-to-r from-red-500 to-red-800 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200 w-full"
                            >
                                Realizar otra denuncia
                            </button>
                            <Link
                                href="/"
                                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200 w-full text-center"
                            >
                                Volver a inicio
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Denuncia;