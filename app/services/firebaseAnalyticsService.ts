import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/app/utils/firebase';
import { AnalysisContext } from './openaiService';

export interface DenunciaData {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  ubicacion: {
    direccion: string;
    coordenadas: {
      lat: number;
      lng: number;
    };
  };
  fechaCreacion: Timestamp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evidencias: any[];
  anonima: boolean;
}

export class FirebaseAnalyticsService {
  async getAnalysisContext(): Promise<AnalysisContext> {
    try {
      // Obtener todas las denuncias públicas
      const denunciasSnapshot = await getDocs(collection(db, 'denunciasPublicas'));
      const denuncias: DenunciaData[] = denunciasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DenunciaData));

      // Calcular estadísticas
      const totalDenuncias = denuncias.length;
      
      // Denuncias por categoría
      const denunciasPorCategoria = denuncias.reduce((acc, denuncia) => {
        acc[denuncia.categoria] = (acc[denuncia.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Denuncias por estado
      const denunciasPorEstado = denuncias.reduce((acc, denuncia) => {
        acc[denuncia.estado] = (acc[denuncia.estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calcular tendencias recientes (últimos 30 días vs anteriores 30 días)
      const ahora = new Date();
      const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
      const hace60Dias = new Date(ahora.getTime() - 60 * 24 * 60 * 60 * 1000);

      const denunciasRecientes = denuncias.filter(d => 
        d.fechaCreacion.toDate() >= hace30Dias
      );
      const denunciasAnteriores = denuncias.filter(d => 
        d.fechaCreacion.toDate() >= hace60Dias && d.fechaCreacion.toDate() < hace30Dias
      );

      const tendenciasRecientes = this.calcularTendencias(denunciasRecientes, denunciasAnteriores);

      // Calcular zonas conflictivas
      const zonasConflictivas = this.calcularZonasConflictivas(denuncias);

      // Estadísticas adicionales
      const denunciasUltimaSemana = denuncias.filter(d => 
        d.fechaCreacion.toDate() >= new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      const estadisticas = {
        promedioResolucion: this.calcularPromedioResolucion(denuncias),
        satisfaccionPromedio: 0, // Por implementar cuando tengamos datos de satisfacción
        denunciasUltimaSemana,
        crecimientoMensual: ((denunciasRecientes.length - denunciasAnteriores.length) / Math.max(denunciasAnteriores.length, 1)) * 100
      };

      return {
        totalDenuncias,
        denunciasPorCategoria,
        denunciasPorEstado,
        tendenciasRecientes,
        zonasConflictivas,
        estadisticas
      };
    } catch (error) {
      console.error('Error fetching analysis context:', error);
      // Retornar datos por defecto en caso de error
      return {
        totalDenuncias: 0,
        denunciasPorCategoria: {},
        denunciasPorEstado: {},
        tendenciasRecientes: [],
        zonasConflictivas: [],
        estadisticas: {
          promedioResolucion: 0,
          satisfaccionPromedio: 0,
          denunciasUltimaSemana: 0,
          crecimientoMensual: 0
        }
      };
    }
  }

  private calcularTendencias(
    recientes: DenunciaData[], 
    anteriores: DenunciaData[]
  ): { descripcion: string; cambio: number; periodo: string }[] {
    const tendencias: { descripcion: string; cambio: number; periodo: string }[] = [];

    // Tendencia general
    const cambioGeneral = ((recientes.length - anteriores.length) / Math.max(anteriores.length, 1)) * 100;
    tendencias.push({
      descripcion: `Cambio general en el volumen de denuncias`,
      cambio: cambioGeneral,
      periodo: 'últimos 30 días'
    });

    // Tendencias por categoría
    const categoriasRecientes = recientes.reduce((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoriasAnteriores = anteriores.reduce((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.keys(categoriasRecientes).forEach(categoria => {
      const actual = categoriasRecientes[categoria] || 0;
      const anterior = categoriasAnteriores[categoria] || 0;
      if (anterior > 0) {
        const cambio = ((actual - anterior) / anterior) * 100;
        if (Math.abs(cambio) > 20) { // Solo mostrar cambios significativos
          tendencias.push({
            descripcion: `Denuncias de ${categoria}`,
            cambio,
            periodo: 'últimos 30 días'
          });
        }
      }
    });

    return tendencias.slice(0, 5); // Máximo 5 tendencias
  }

  private calcularZonasConflictivas(
    denuncias: DenunciaData[]
  ): { zona: string; cantidad: number; coordenadas?: string }[] {
    // Agrupar por zona (usando dirección como aproximación)
    const zonas = denuncias.reduce((acc, denuncia) => {
      const zona = this.extraerZona(denuncia.ubicacion.direccion);
      if (!acc[zona]) {
        acc[zona] = {
          cantidad: 0,
          coordenadas: `${denuncia.ubicacion.coordenadas.lat},${denuncia.ubicacion.coordenadas.lng}`
        };
      }
      acc[zona].cantidad++;
      return acc;
    }, {} as Record<string, { cantidad: number; coordenadas: string }>);

    // Convertir a array y ordenar por cantidad
    return Object.entries(zonas)
      .map(([zona, data]) => ({
        zona,
        cantidad: data.cantidad,
        coordenadas: data.coordenadas
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10); // Top 10 zonas
  }

  private extraerZona(direccion: string): string {
    // Simplificación: extraer las primeras palabras de la dirección
    const partes = direccion.split(',');
    if (partes.length >= 2) {
      return partes.slice(0, 2).join(',').trim();
    }
    return direccion;
  }

  private calcularPromedioResolucion(denuncias: DenunciaData[]): number {
    const denunciasResueltas = denuncias.filter(d => d.estado === 'resuelto');
    if (denunciasResueltas.length === 0) return 0;

    // Por ahora retornamos un valor estimado
    // En el futuro podríamos agregar fechas de resolución
    return 5; // días promedio
  }

  async getDenunciasPorFiltro(filtro: {
    categoria?: string;
    estado?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  }): Promise<DenunciaData[]> {
    try {
      let q = query(collection(db, 'denunciasPublicas'));

      if (filtro.categoria) {
        q = query(q, where('categoria', '==', filtro.categoria));
      }

      if (filtro.estado) {
        q = query(q, where('estado', '==', filtro.estado));
      }

      if (filtro.fechaInicio) {
        q = query(q, where('fechaCreacion', '>=', Timestamp.fromDate(filtro.fechaInicio)));
      }

      if (filtro.fechaFin) {
        q = query(q, where('fechaCreacion', '<=', Timestamp.fromDate(filtro.fechaFin)));
      }

      q = query(q, orderBy('fechaCreacion', 'desc'), limit(100));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DenunciaData));
    } catch (error) {
      console.error('Error fetching filtered denuncias:', error);
      return [];
    }
  }
}

export const firebaseAnalyticsService = new FirebaseAnalyticsService();
