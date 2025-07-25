"use client";

import Estadisticas from "../components/Estadisticas";
import dynamic from 'next/dynamic';

const MapaCalor = dynamic(() => import('../components/MapaCalor'), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

const Inicio = () => {
  return (
    <section className="flex flex-col xl:flex-row items-center justify-center min-h-screen w-full p-6 gap-6">
      <div className="w-full xl:w-[600px] h-[500px]">
        <Estadisticas />
      </div>
      <div className="w-full xl:w-[600px] h-[500px]">
        <MapaCalor />
      </div>
    </section>
  );
};

export default Inicio;