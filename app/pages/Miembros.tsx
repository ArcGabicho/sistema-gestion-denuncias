"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/utils/firebase";
import { User } from "@/app/interfaces/User";
import { Comunidad } from "@/app/interfaces/Comunidad";
import { 
    Users, 
    Search, 
    MoreVertical, 
    Edit, 
    Trash2, 
    Shield, 
    UserCheck, 
    Mail,
    Phone,
    Calendar,
    Filter,
    Download,
    UserPlus
} from "lucide-react";
import * as XLSX from "xlsx";
import Image from "next/image";
import toast from 'react-hot-toast';

const Miembros = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [comunidad, setComunidad] = useState<Comunidad | null>(null);
    const [miembros, setMiembros] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState<"all" | "admin" | "member">("all");
    const [showActions, setShowActions] = useState<string | null>(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // Obtener datos del usuario actual
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = { id: userDoc.id, ...userDoc.data() } as User;
                    setCurrentUser(userData);

                    // Obtener datos de la comunidad
                    if (userData.comunidadId) {
                        const comunidadDoc = await getDoc(doc(db, "comunidades", userData.comunidadId));
                        if (comunidadDoc.exists()) {
                            const comunidadData = { id: comunidadDoc.id, ...comunidadDoc.data() } as Comunidad;
                            setComunidad(comunidadData);

                            // Cargar los miembros de la comunidad
                            await loadMiembros(userData.comunidadId);
                        }
                    }
                }
            } catch (error) {
                console.error("Error cargando datos:", error);
                toast.error("Error al cargar los datos");
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleInviteMember = () => {
        if (!comunidad?.invitationCode) {
            toast.error("No se encontró el código de la comunidad");
            return;
        }
        const mensaje = `¡Únete a nuestra comunidad! Usa el código: ${comunidad.invitationCode}`;
        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank");
    };

    const handleExportMembers = () => {
        if (miembros.length === 0) {
            toast.error("No hay miembros para exportar");
            return;
        }
        const data = miembros.map(m => ({
            Nombre: `${m.name} ${m.lastname}`,
            Email: m.email,
            Teléfono: m.phone || "",
            Rol: m.role === "admin" ? "Administrador" : "Miembro",
            Estado: m.isActive ? "Activo" : "Inactivo",
            Registro: formatDate(m.createdAt)
        }));
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Miembros");
        XLSX.writeFile(workbook, "miembros_comunidad.xlsx");
        toast.success("Miembros exportados correctamente");
    };

    const loadMiembros = async (comunidadId: string) => {
        try {
            // Consulta a Firestore para obtener los usuarios de la comunidad
            const miembrosQuery = query(
                collection(db, "users"),
                where("comunidadId", "==", comunidadId) // Filtrar por comunidadId
            );
            const miembrosSnapshot = await getDocs(miembrosQuery);

            // Mapear los datos de los usuarios
            const miembrosData: User[] = miembrosSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];

            // Actualizar el estado con los miembros obtenidos
            setMiembros(miembrosData);
        } catch (error) {
            console.error("Error cargando miembros:", error);
            toast.error("Error al cargar los miembros");
        }
    };

    const handleChangeRole = async (userId: string, newRole: 'admin' | 'member') => {
        try {
            await updateDoc(doc(db, "users", userId), {
                role: newRole,
                updatedAt: new Date()
            });
            
            setMiembros(prev => prev.map(miembro => 
                miembro.id === userId ? { ...miembro, role: newRole } : miembro
            ));
            
            toast.success(`Rol actualizado a ${newRole === 'admin' ? 'Administrador' : 'Miembro'}`);
            setShowActions(null);
        } catch (error) {
            console.error("Error actualizando rol:", error);
            toast.error("Error al actualizar el rol");
        }
    };

    const handleToggleStatus = async (userId: string, isActive: boolean) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                isActive: !isActive,
                updatedAt: new Date()
            });
            
            setMiembros(prev => prev.map(miembro => 
                miembro.id === userId ? { ...miembro, isActive: !isActive } : miembro
            ));
            
            toast.success(`Usuario ${!isActive ? 'activado' : 'desactivado'} correctamente`);
            setShowActions(null);
        } catch (error) {
            console.error("Error actualizando estado:", error);
            toast.error("Error al actualizar el estado");
        }
    };

    const handleDeleteMember = async (userId: string, userName: string) => {
        if (currentUser?.id === userId) {
            toast.error("No puedes eliminarte a ti mismo");
            return;
        }

        if (window.confirm(`¿Estás seguro de que quieres eliminar a ${userName}? Esta acción no se puede deshacer.`)) {
            try {
                await deleteDoc(doc(db, "users", userId));
                setMiembros(prev => prev.filter(miembro => miembro.id !== userId));
                toast.success("Miembro eliminado correctamente");
                setShowActions(null);
            } catch (error) {
                console.error("Error eliminando miembro:", error);
                toast.error("Error al eliminar el miembro");
            }
        }
    };

    const formatDate = (timestamp: { toDate?: () => Date; seconds?: number } | undefined) => {
        if (!timestamp) return "No disponible";
        const date = timestamp.toDate ? timestamp.toDate() : new Date((timestamp.seconds || 0) * 1000);
        return date.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const filteredMiembros = miembros.filter(miembro => {
        const matchesSearch = 
            miembro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            miembro.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            miembro.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = filterRole === "all" || miembro.role === filterRole;
        
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-zinc-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 min-h-screen bg-zinc-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-6 text-white border border-red-700/50 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <Users className="h-8 w-8 mr-3" />
                            Gestión de Miembros
                        </h1>
                        <p className="text-red-100">
                            {comunidad?.nombre} - {miembros.length} miembros registrados
                        </p>
                    </div>
                    {currentUser?.role === 'admin' && (
                        <div className="flex gap-3">
                            <button onClick={handleInviteMember} className="flex items-center px-4 py-2 bg-zinc-800/50 backdrop-blur-sm rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-700/50">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invitar Miembro
                            </button>
                            <button onClick={handleExportMembers} className="flex items-center px-4 py-2 bg-zinc-800/50 backdrop-blur-sm rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-700/50">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Barra de navegación y filtros */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-zinc-700/50">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                    {/* Búsqueda */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido o email..."
                            className="w-full pl-12 pr-4 py-3 bg-zinc-700/50 border-2 border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400 transition-all duration-200 text-white placeholder-zinc-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filtro por rol */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-zinc-300">
                            <Filter className="h-5 w-5 text-red-400" />
                            <span className="font-medium text-sm">Filtrar:</span>
                        </div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value as "all" | "admin" | "member")}
                            className="px-4 py-3 bg-zinc-700/50 border-2 border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400 transition-all duration-200 text-white font-medium min-w-[160px]"
                        >
                            <option value="all">Todos los roles</option>
                            <option value="admin">Administradores</option>
                            <option value="member">Miembros</option>
                        </select>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="flex gap-6">
                        <div className="text-center bg-zinc-700/30 rounded-lg px-4 py-3 border border-zinc-600/50 shadow-sm">
                            <p className="font-bold text-xl text-red-400">{miembros.filter(m => m.role === 'admin').length}</p>
                            <p className="text-zinc-300 text-sm font-medium">Administradores</p>
                        </div>
                        <div className="text-center bg-zinc-700/30 rounded-lg px-4 py-3 border border-zinc-600/50 shadow-sm">
                            <p className="font-bold text-xl text-green-400">{miembros.filter(m => m.isActive).length}</p>
                            <p className="text-zinc-300 text-sm font-medium">Activos</p>
                        </div>
                        <div className="text-center bg-zinc-700/30 rounded-lg px-4 py-3 border border-zinc-600/50 shadow-sm">
                            <p className="font-bold text-xl text-blue-400">{filteredMiembros.length}</p>
                            <p className="text-zinc-300 text-sm font-medium">Mostrados</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de miembros */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-zinc-700/50">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-700/50 border-b border-zinc-600/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                                    Miembro
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                                    Contacto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                                    Registro
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-zinc-800/30 divide-y divide-zinc-700/50">
                            {filteredMiembros.map((miembro) => (
                                <tr key={miembro.id} className="hover:bg-zinc-700/30 transition-colors">
                                    {/* Información del miembro */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {miembro.avatarUrl ? (
                                                    <Image 
                                                        className="h-10 w-10 rounded-full object-cover" 
                                                        src={miembro.avatarUrl} 
                                                        alt={`${miembro.name} ${miembro.lastname}`}
                                                        width={40}
                                                        height={40}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                                                        <span className="text-red-300 font-medium text-sm">
                                                            {miembro.name.charAt(0)}{miembro.lastname.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">
                                                    {miembro.name} {miembro.lastname}
                                                    {currentUser?.id === miembro.id && (
                                                        <span className="ml-2 px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                                                            Tú
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contacto */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-white flex items-center">
                                            <Mail className="h-4 w-4 mr-2 text-zinc-400" />
                                            {miembro.email}
                                        </div>
                                        {miembro.phone && (
                                            <div className="text-sm text-zinc-400 flex items-center mt-1">
                                                <Phone className="h-4 w-4 mr-2 text-zinc-500" />
                                                {miembro.phone}
                                            </div>
                                        )}
                                    </td>

                                    {/* Rol */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            miembro.role === 'admin' 
                                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        }`}>
                                            {miembro.role === 'admin' ? (
                                                <>
                                                    <Shield className="h-3 w-3 mr-1" />
                                                    Administrador
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="h-3 w-3 mr-1" />
                                                    Miembro
                                                </>
                                            )}
                                        </span>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            miembro.isActive 
                                                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full mr-1 ${
                                                miembro.isActive ? 'bg-green-400' : 'bg-red-400'
                                            }`}></div>
                                            {miembro.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>

                                    {/* Fecha de registro */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-zinc-500" />
                                            {formatDate(miembro.createdAt)}
                                        </div>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {currentUser?.role === 'admin' ? (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowActions(showActions === miembro.id ? null : miembro.id)}
                                                    className="text-zinc-400 hover:text-zinc-300 transition-colors"
                                                >
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>

                                                {showActions === miembro.id && (
                                                <div className="absolute right-0 top-8 bg-zinc-700/90 backdrop-blur-sm rounded-lg shadow-xl border border-zinc-600/50 py-1 z-10 min-w-[180px]">
                                                    <button
                                                        onClick={() => handleChangeRole(miembro.id, miembro.role === 'admin' ? 'member' : 'admin')}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600/50"
                                                        disabled={currentUser?.id === miembro.id}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        {miembro.role === 'admin' ? 'Hacer Miembro' : 'Hacer Admin'}
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleToggleStatus(miembro.id, miembro.isActive)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-600/50"
                                                        disabled={currentUser?.id === miembro.id}
                                                    >
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                        {miembro.isActive ? 'Desactivar' : 'Activar'}
                                                    </button>

                                                    <hr className="my-1 border-zinc-600/50" />
                                                    
                                                    <button
                                                        onClick={() => handleDeleteMember(miembro.id, `${miembro.name} ${miembro.lastname}`)}
                                                        className="flex items-center w-full px-4 py-2 text-sm text-red-300 hover:bg-red-500/20"
                                                        disabled={currentUser?.id === miembro.id}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        ) : (
                                            <span className="text-zinc-500 text-sm">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Estado vacío */}
                {filteredMiembros.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="h-16 w-16 text-zinc-500 mx-auto mb-4" />
                        <p className="text-zinc-300 text-lg">No se encontraron miembros</p>
                        <p className="text-zinc-400 text-sm mt-1">
                            {searchTerm || filterRole !== "all" 
                                ? "Intenta ajustar tus filtros de búsqueda" 
                                : "La comunidad aún no tiene miembros registrados"
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Miembros;