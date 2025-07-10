import { Bar } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const dataBar = {
  labels: [
    'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla',
    'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lima',
    'Lince', 'Los Olivos', 'Lurigancho', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac',
    'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
    'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
    'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar',
    'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
  ],
  datasets: [
    {
      label: 'Denuncias',
      data: [
        12, 18, 7, 5, 14, 3, 11, 2,
        20, 6, 13, 8, 9, 10, 65,
        4, 15, 7, 3, 6, 17, 2,
        1, 8, 12, 2, 1, 5,
        2, 9, 13, 21, 16,
        3, 19, 8, 7, 1,
        2, 18, 6, 14, 15
      ], // Puedes ajustar los datos según corresponda
      backgroundColor: '#dc2626',
    },
  ],
};

const Estadisticas = () => {
  return (
    <div className="w-full h-full text-white shadow">
      <Bar data={dataBar} options={{ indexAxis: 'y', maintainAspectRatio: false }} height={500} />
    </div>
  );
};

export default Estadisticas;