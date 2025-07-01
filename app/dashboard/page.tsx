"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Search } from 'lucide-react';
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setUserLocation(null);
        }
      );
    }
  }, []);

  const estadisticas = [
    { titulo: "Total de Denuncias", color: "bg-gradient-to-r from-red-500 to-red-800", valor: 10 },
    { titulo: "Denuncias Pendientes", color: "bg-gradient-to-r from-red-500 to-red-800", valor: 5 },
    { titulo: "Denuncias Resueltas", color: "bg-gradient-to-r from-red-500 to-red-800", valor: 4 },
    { titulo: "Denuncias Recurrentes", color: "bg-gradient-to-r from-red-500 to-red-800", valor: 1 },
  ];

  const denuncias = [
    { id: 1, titulo: "Robo de celular en la vía pública", descripcion: "Un sujeto arrebató un celular a una joven en la Av. Túpac Amaru.", tipo: "Robo", fecha: "2024-06-01", estatus: "Pendiente" },
    { id: 2, titulo: "Estafa en mercado", descripcion: "Vendedor ofreció productos falsificados en el mercado Unicachi.", tipo: "Estafa", fecha: "2024-05-28", estatus: "Resuelta" },
    { id: 3, titulo: "Violencia familiar", descripcion: "Vecinos reportan gritos y golpes en una vivienda de la Urb. El Ermitaño.", tipo: "Violencia", fecha: "2024-05-25", estatus: "Pendiente" },
    { id: 4, titulo: "Venta de drogas cerca a colegio", descripcion: "Se observa a personas sospechosas vendiendo sustancias ilícitas cerca del colegio Fe y Alegría.", tipo: "Drogas", fecha: "2024-05-20", estatus: "Recurrente" },
    { id: 5, titulo: "Acoso callejero", descripcion: "Mujer denuncia acoso por parte de un mototaxista en la Av. Industrial.", tipo: "Acoso", fecha: "2024-05-18", estatus: "Resuelta" },
    { id: 6, titulo: "Corrupción en trámites municipales", descripcion: "Solicitan coima para agilizar trámites en la municipalidad.", tipo: "Corrupción", fecha: "2024-05-15", estatus: "Pendiente" },
    { id: 7, titulo: "Robo a mano armada en tienda", descripcion: "Dos sujetos armados asaltaron una tienda en la Av. Izaguirre.", tipo: "Robo", fecha: "2024-05-10", estatus: "Resuelta" },
    { id: 8, titulo: "Secuestro de menor", descripcion: "Se reporta la desaparición de un menor en la zona de Payet.", tipo: "Secuestro", fecha: "2024-05-08", estatus: "Pendiente" },
    { id: 9, titulo: "Abuso de autoridad policial", descripcion: "Policía agredió verbalmente a un ciudadano durante intervención.", tipo: "Abuso", fecha: "2024-05-05", estatus: "Resuelta" },
    { id: 10, titulo: "Estafa telefónica", descripcion: "Intento de estafa mediante llamada telefónica a adulto mayor.", tipo: "Estafa", fecha: "2024-05-01", estatus: "Pendiente" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 h-screen">
      {/* Bloque 1: Estadísticas y lista de denuncias */}
      <div className="col-span-3 p-12">
        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4 mb-4 h-[10rem]">
          {estadisticas.map((stat, index) => (
            <div key={index} className={`${stat.color} text-white p-4 rounded shadow flex flex-col items-center justify-center`}>
              <span className="text-2xl font-bold">{stat.valor}</span>
              <span className="text-base mt-2 text-center">{stat.titulo}</span>
            </div>
          ))}
        </div>
        {/* Barra de búsqueda y botones de filtro */}
        <div className="flex items-center justify-between mt-16 mb-10">
          <span className="text-lg font-semibold">
            Lista de Denuncias
          </span>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Buscar denuncias..."
              className="border p-2 rounded w-[20rem]"
            />
            <button className="bg-gradient-to-r from-red-500 to-red-800 text-white p-2 rounded">
              <Search />
            </button>
          </div>
        </div>
        {/* Lista de denuncias */}
        <div className="bg-black rounded-lg shadow-inner max-h-[25rem] overflow-y-auto border border-gray-200">
          <table className="w-full">
            <thead className="sticky top-0 backdrop-blur z-10">
              <tr className="font-normal">
                <th className="p-2">Denuncia ID</th>
                <th className="p-2">Título</th>
                <th className="p-2">Descripción</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {denuncias.map((denuncia) => (
                <tr key={denuncia.id} className="bg-black backdrop-blur-md rounded-lg shadow-md hover:bg-white/20 transition">
                  <td className="p-4">{denuncia.id}</td>
                  <td className="p-4">{denuncia.titulo}</td>
                  <td className="p-4">{denuncia.descripcion}</td>
                  <td className="p-4">{denuncia.tipo}</td>
                  <td className="p-4">{denuncia.fecha}</td>
                  <td className="p-4">{denuncia.estatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Bloque 2: Mapa */}
      <div className="col-span-1">
        <MapContainer center={[-11.9911, -77.0551]} zoom={14} className="h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;
