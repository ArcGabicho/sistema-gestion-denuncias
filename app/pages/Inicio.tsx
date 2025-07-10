import Estadisticas from "../components/Estadisticas";
import dynamic from 'next/dynamic';

const MapaCalor = dynamic(() => import('../components/MapaCalor'), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});

const Inicio = () => {
    return (
        <section className="flex flex-row items-center justify-center h-screen p-8 gap-4">
            <div className="w-[600px] h-[500px] flex-shrink-0 pl-20">
                <Estadisticas />
            </div>
            <div className="w-[600px] h-[500px] flex-shrink-0 pr-20">
                <MapaCalor />
            </div>
        </section>
    );
}

export default Inicio;