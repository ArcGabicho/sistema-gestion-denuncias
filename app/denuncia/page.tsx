/* eslint-disable @typescript-eslint/no-require-imports */
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { db, storage } from "../firebase/firebase.config";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

// Lazy-load react-leaflet
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });

const Denuncia = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        crimeType: "",
        date: "",
        location: "",
        evidence: null as File | null,
        whatsapp: "",
    });
    const [showModal, setShowModal] = useState(false);
    const [evidenceUrl, setEvidenceUrl] = useState<string>("");

    useEffect(() => {
        const loadLeafletIcons = async () => {
            if (typeof window !== "undefined") {
                const L = await import("leaflet");

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                delete (L.Icon.Default.prototype as any)._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
                    iconUrl: require("leaflet/dist/images/marker-icon.png"),
                    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
                });
            }
        };

        const getDireccion = async (lat: number, lon: number) => {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=es`
            );
            const data = await response.json();
            return data.display_name || `${lat}, ${lon}`;
        };

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
        }

        loadLeafletIcons();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        setFormData((prev) => ({ ...prev, evidence: files?.[0] ?? null }));
    };

    const saveDenuncia = async (data: typeof formData) => {
        try {
            const { evidence, ...denunciaSinArchivo } = data;
            const snapshot = await getDocs(collection(db, "denuncias"));
            const nextId = snapshot.size + 1;

            // 1. Guarda la denuncia y obtén el ID
            const docRef = await addDoc(collection(db, "denuncias"), {
                ...denunciaSinArchivo,
                status: "pendiente",
                timestamp: new Date(),
                id: nextId,
            });

            // 2. Si hay evidencia, súbela a una carpeta con el ID de la denuncia
            let evidenceUrl = "";
            if (evidence && evidence instanceof File) {
                const evidenceRef = ref(storage, `denuncias/${docRef.id}/${evidence.name}`);
                await uploadBytes(evidenceRef, evidence);
                evidenceUrl = await getDownloadURL(evidenceRef);

                await updateDoc(doc(db, "denuncias", docRef.id), {
                    evidenceUrl,
                });

                setEvidenceUrl(evidenceUrl); // <-- Agrega esto
            }

            toast.success("Denuncia guardada correctamente");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.message || "Error al guardar la denuncia");
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
                        <label htmlFor="crimeType" className="text-sm font-medium">Tipo de Falta</label>
                        <select
                            id="crimeType"
                            value={formData.crimeType}
                            onChange={handleInputChange}
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">Seleccione el tipo de falta o delito</option>
                            <option value="ruidos">Ruidos molestos fuera del horario permitido</option>
                            <option value="espacios">Uso indebido de espacios comunes</option>
                            <option value="obras">Obras sin autorización</option>
                            <option value="mascotas">Maltrato a mascotas</option>
                            <option value="conflictos">Conflictos entre vecinos</option>
                            <option value="sustancias">Consumo de sustancias prohibidas en áreas comunes</option>
                            <option value="reglamento">Incumplimiento del reglamento interno</option>
                            <option value="estacionamiento">Estacionamiento en zonas no permitidas</option>
                            <option value="daños">Daños a la propiedad común</option>
                            <option value="basura">Disposición inadecuada de basura</option>
                            <option value="apropiacion">Apropiación de áreas comunes</option>
                            <option value="ingreso">Ingreso no autorizado de personas</option>
                            <option value="amenazas">Amenazas o agresiones verbales</option>
                            <option value="cuotas">Negativa al pago de cuotas o multas</option>
                            <option value="objetos">Colocación de objetos en zonas comunes</option>
                            <option value="animales">Tenencia de animales no permitidos</option>
                            <option value="seguridad">Mal uso del sistema de seguridad</option>
                            <option value="vandalismo">Actos de vandalismo</option>
                            <option value="comercial">Actividades comerciales no autorizadas</option>
                            <option value="eventos">Organización de eventos sin autorización</option>
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
            <div className="hidden lg:block w-4/6 h-screen relative">
                {location ? (
                    <div className="absolute inset-0 w-full h-full">
                        <MapContainer center={[location.lat, location.lng]} zoom={15} className="w-full h-full z-0">
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
                        {evidenceUrl && (
                            <div className="mb-8">
                                <p className="font-semibold mb-2">Evidencia enviada:</p>
                                    {formData.evidence?.type?.startsWith("image/") && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={evidenceUrl} alt="Evidencia" className="max-h-64 rounded mb-2" />
                                    )}
                                {formData.evidence?.type?.startsWith("video/") && (
                                    <video controls className="max-h-64 rounded mb-2">
                                        <source src={evidenceUrl} />
                                        Tu navegador no soporta la reproducción de video.
                                    </video>
                                )}
                                {formData.evidence && !formData.evidence.type?.startsWith("image/") && !formData.evidence.type?.startsWith("video/") && (
                                    <a
                                        href={evidenceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 underline"
                                    >
                                        Ver documento adjunto
                                    </a>
                                )}
                            </div>
                        )}
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