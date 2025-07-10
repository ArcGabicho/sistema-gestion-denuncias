/* eslint-disable @typescript-eslint/no-require-imports */
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { db } from "../firebase/firebase.config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { LoaderCircle } from "lucide-react";

const Denuncia = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        crimeType: string;
        date: string;
        location: string;
        evidence: File | null;
        whatsapp: string;
    }>({
        title: "",
        description: "",
        crimeType: "",
        date: "",
        location: "",
        evidence: null,
        whatsapp: "",
    });

    const [showModal, setShowModal] = useState(false);

    const getDireccion = async (lat: number, lon: number) => {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`
        );
        const data = await response.json();
        return data.display_name || `${lat}, ${lon}`;
    };

    useEffect(() => {
        const setDireccion = async (lat: number, lng: number) => {
            const direccion = await getDireccion(lat, lng);
            setFormData((prev) => ({ ...prev, location: direccion }));
        };

        const currentDate = new Date().toLocaleDateString();
        setFormData((prev) => ({ ...prev, date: currentDate }));

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                    setDireccion(position.coords.latitude, position.coords.longitude);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
        iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
        iconUrl: require("leaflet/dist/images/marker-icon.png"),
        shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    });

    const saveDenuncia = async (data: typeof formData) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { evidence, ...denunciaSinArchivo } = data;

            // 1. Obtener el número actual de denuncias
            const snapshot = await getDocs(collection(db, "denuncias"));
            const nextId = snapshot.size + 1;

            // 2. Guardar la denuncia con el campo id consecutivo
            await addDoc(collection(db, "denuncias"), {
                ...denunciaSinArchivo,
                status: "pendiente",
                timestamp: new Date(),
                id: nextId,
            });

            toast.success("Denuncia guardada correctamente");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error("Error al guardar la denuncia");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await saveDenuncia(formData);
        setIsLoading(false);
        setShowModal(true);
    };

    return (
        <main className="flex flex-col lg:flex-row h-screen">
            <div className="w-full lg:w-2/6 py-16 px-8 md:py-10 md:px-10">
                <h1 className="text-2xl font-bold mb-4">Formulario de Denuncia</h1>
                <form className="space-y-2" onSubmit={handleSubmit}>
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
                            <option value="alimentos">Pensión de Alimentos</option>
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
                        <label htmlFor="whatsapp" className="text-sm font-medium">Contacto WhatsApp</label>
                        <input
                            type="text"
                            id="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleInputChange}
                            placeholder="Ej: 987654321"
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
                        className="w-full bg-gradient-to-r from-red-500 to-red-800 text-white py-2 rounded-md hover:bg-red-700 transition duration-200 flex items-center justify-center"
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <LoaderCircle className="mr-2 size-4 animate-spin flex items-center justify-center" />
                        )}
                        Enviar Denuncia
                    </button>
                </form>
            </div>
            <div className="hidden lg:block w-4/6 relative">
                {location ? (
                    <div className="absolute inset-0 w-full h-full">
                        <MapContainer center={[location.lat, location.lng]} zoom={15} className="w-full h-full" style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
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
                                onClick={() => {
                                    setShowModal(false);
                                    setFormData({
                                        title: "",
                                        description: "",
                                        crimeType: "",
                                        date: new Date().toLocaleDateString(),
                                        location: location ? `${location.lat}, ${location.lng}` : "",
                                        evidence: null,
                                        whatsapp: "",
                                    });
                                }}
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