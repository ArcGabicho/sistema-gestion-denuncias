import { useState, useMemo, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Search, Pencil, Trash2, X, Check, LoaderCircle } from "lucide-react";
import { db } from "../firebase/firebase.config";

const ESTADOS = ["Todos", "Pendiente", "En proceso", "Resuelto"];

// Capitaliza la primera letra de un string
function capitalize(str: string) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Normaliza el estado para comparación y visualización
function normalizeEstado(estado: string) {
    if (!estado) return "";
    const e = estado.trim().toLowerCase();
    if (e === "pendiente") return "Pendiente";
    if (e === "en proceso" || e === "en_proceso" || e === "enproceso") return "En proceso";
    if (e === "resuelto") return "Resuelto";
    return capitalize(estado);
}

const Denuncias = () => {
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("Todos");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [denuncias, setDenuncias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editModal, setEditModal] = useState<{open: boolean, denuncia: any | null}>({open: false, denuncia: null});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deleteModal, setDeleteModal] = useState<{open: boolean, denuncia: any | null}>({open: false, denuncia: null});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        const fetchDenuncias = async () => {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "denuncias"));
            const docs = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.data().id || doc.id, // id consecutivo o firestore
                firestoreId: doc.id, // id real de firestore SIEMPRE
            }));
            setDenuncias(docs);
            setLoading(false);
        };
        fetchDenuncias();
    }, []);

    const resultados = useMemo(() => {
        const filtradas = denuncias.filter(d => {
            const estado = normalizeEstado(d.estado || d.status || "");
            const filtroNorm = normalizeEstado(filtro);
            const coincideEstado = filtroNorm === "Todos" || estado === filtroNorm;
            const coincideBusqueda =
                (d.titulo || d.title || "").toLowerCase().includes(busqueda.toLowerCase()) ||
                (d.tipo || d.crimeType || "").toLowerCase().includes(busqueda.toLowerCase()) ||
                (d.descripcion || d.description || "").toLowerCase().includes(busqueda.toLowerCase()) ||
                (d.ubicacion || d.location || "").toLowerCase().includes(busqueda.toLowerCase());
            return coincideEstado && coincideBusqueda;
        });
        // Ordena por id si existe
        filtradas.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        return filtradas.slice(0, 10);
    }, [busqueda, filtro, denuncias]);

    const handleBuscar = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
    };

    // Abrir modal de edición
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEdit = (denuncia: any) => {
        // Obtener fecha actual en formato DD/MM/YYYY
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();
        const currentDate = `${dd}/${mm}/${yyyy}`;

        setEditForm({
            title: denuncia.title || "",
            crimeType: denuncia.crimeType || "",
            description: denuncia.description || "",
            date: currentDate,
            location: denuncia.location || "",
            status: denuncia.status || "pendiente",
            firestoreId: denuncia.firestoreId,
            id: denuncia.id,
        });
        setEditModal({open: true, denuncia});
    };

    // Guardar cambios en firestore
    const handleSaveEdit = async () => {
        if (!editModal.denuncia) return;
        setSaving(true);
        const firestoreId = editModal.denuncia.firestoreId || editModal.denuncia.id;
        try {
            const ref = doc(db, "denuncias", firestoreId);
            await updateDoc(ref, {
                title: editForm.title,
                crimeType: editForm.crimeType,
                description: editForm.description,
                date: editForm.date,
                location: editForm.location,
                status: editForm.status,
                id: editForm.id,
            });
            setEditModal({open: false, denuncia: null});
            setToast({ type: "success", message: "Denuncia editada correctamente." });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setToast({ type: "error", message: "Error al editar la denuncia." });
        }
        setSaving(false);
        // Refrescar denuncias
        const snapshot = await getDocs(collection(db, "denuncias"));
        const docs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.data().id || doc.id,
            firestoreId: doc.id,
        }));
        setDenuncias(docs);
    };

    // Abrir modal de eliminar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDelete = (denuncia: any) => {
        setDeleteModal({open: true, denuncia});
    };

    // Confirmar eliminación
    const handleConfirmDelete = async () => {
        if (!deleteModal.denuncia) return;
        setDeleting(true);
        const firestoreId = deleteModal.denuncia.firestoreId || deleteModal.denuncia.id;
        try {
            await deleteDoc(doc(db, "denuncias", firestoreId));
            setDeleteModal({open: false, denuncia: null});
            setToast({ type: "success", message: "Denuncia eliminada correctamente." });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setToast({ type: "error", message: "Error al eliminar la denuncia." });
        }
        setDeleting(false);
        // Refrescar denuncias
        const snapshot = await getDocs(collection(db, "denuncias"));
        const docs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.data().id || doc.id,
            firestoreId: doc.id,
        }));
        setDenuncias(docs);
    };

    // Mostrar toast por 3 segundos
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    return (
        <section className="h-full p-4 md:p-12">
            {/* Toast notification */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded shadow-lg flex items-center gap-3
                        ${toast.type === "success" ? "bg-green-700 text-white" : "bg-red-700 text-white"}`}
                    role="alert"
                >
                    {toast.type === "success" ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <X className="w-5 h-5" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}
            <form
                className="flex flex-col md:flex-row gap-3 items-center mb-6"
                onSubmit={handleBuscar}
                autoComplete="off"
            >
                <div className="relative w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Buscar denuncia..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-zinc-700 bg-zinc-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-red-600 transition placeholder:text-zinc-400"
                    />
                    <Search className="absolute left-2 top-2.5 text-zinc-400 w-5 h-5 pointer-events-none" />
                </div>
                <select
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                    className="w-full md:w-auto px-3 py-2 border border-zinc-700 bg-zinc-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-red-600 transition"
                >
                    {ESTADOS.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                    ))}
                </select>
            </form>
            <div className="overflow-x-auto rounded-lg shadow-lg border border-zinc-700 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800">
                <table className="min-w-full text-sm text-left border-separate border-spacing-y-1">
                    <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-700">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">ID</th>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">Título</th>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">Tipo de delito</th>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">Descripción</th>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">Fecha</th>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">Ubicación</th>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">Estado</th>
                            <th className="px-4 py-3 font-semibold text-red-400 uppercase tracking-wider text-xs border-b border-zinc-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                                    Cargando denuncias...
                                </td>
                            </tr>
                        ) : resultados.length > 0 ? (
                            resultados.map(denuncia => {
                                const estado = normalizeEstado(denuncia.estado || denuncia.status);
                                let estadoColor = "text-white";
                                if (estado === "Pendiente") estadoColor = "text-yellow-400";
                                else if (estado === "Resuelto") estadoColor = "text-green-400";
                                else if (estado === "En proceso") estadoColor = "text-blue-400";
                                return (
                                    <tr
                                        key={denuncia.id}
                                        className="bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors border border-zinc-700 rounded-lg shadow-sm"
                                    >
                                        <td className="px-4 py-3 text-white font-mono">{denuncia.id}</td>
                                        <td className="px-4 py-3 text-white max-w-xs truncate">{denuncia.titulo || denuncia.title}</td>
                                        <td className="px-4 py-3 text-white">{capitalize(denuncia.tipo || denuncia.crimeType)}</td>
                                        <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">{denuncia.descripcion || denuncia.description}</td>
                                        <td className="px-4 py-3 text-zinc-400">{denuncia.fecha || denuncia.date}</td>
                                        <td className="px-4 py-3 text-zinc-300">{denuncia.ubicacion || denuncia.location}</td>
                                        <td className="px-4 py-3">
                                            <span className={`flex font-semibold whitespace-nowrap px-2 py-1 rounded ${estadoColor} bg-zinc-900/60`}>
                                                {estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button
                                                className="p-1 rounded hover:bg-red-950 focus:bg-red-950 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-transform duration-150 hover:scale-110"
                                                title="Editar"
                                                aria-label="Editar denuncia"
                                                tabIndex={0}
                                                onClick={() => handleEdit(denuncia)}
                                            >
                                                <span className="sr-only">Editar</span>
                                                <Pencil className="w-4 h-4 text-red-400" />
                                            </button>
                                            <button
                                                className="p-1 rounded hover:bg-red-950 focus:bg-red-950 focus:outline-none focus:ring-2 focus:ring-red-400 transition-transform duration-150 hover:scale-110"
                                                title="Eliminar"
                                                aria-label="Eliminar denuncia"
                                                tabIndex={0}
                                                onClick={() => handleDelete(denuncia)}
                                            >
                                                <span className="sr-only">Eliminar</span>
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                                    No hay denuncias que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de edición */}
            {editModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md relative">
                        <button
                            className="absolute top-2 right-2 text-zinc-400 hover:text-red-400"
                            onClick={() => setEditModal({open: false, denuncia: null})}
                        >
                            <X />
                        </button>
                        <h2 className="text-lg font-bold mb-4 text-white">Editar denuncia</h2>
                        <form
                            className="flex flex-col gap-3"
                            onSubmit={e => { e.preventDefault(); handleSaveEdit(); }}
                        >
                            <input
                                className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                                placeholder="Título"
                                value={editForm.title}
                                onChange={e => setEditForm({...editForm, title: e.target.value})}
                                required
                            />
                            <input
                                className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                                placeholder="Tipo de delito"
                                value={editForm.crimeType}
                                onChange={e => setEditForm({...editForm, crimeType: e.target.value})}
                                required
                            />
                            <textarea
                                className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                                placeholder="Descripción"
                                value={editForm.description}
                                onChange={e => setEditForm({...editForm, description: e.target.value})}
                                required
                            />
                            {/* Mostrar la fecha actual como texto, no input */}
                            <div className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white">
                                Fecha: {editForm.date}
                            </div>
                            <input
                                className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                                placeholder="Ubicación"
                                value={editForm.location}
                                onChange={e => setEditForm({...editForm, location: e.target.value})}
                                required
                            />
                            <select
                                className="p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                                value={editForm.status}
                                onChange={e => setEditForm({...editForm, status: e.target.value})}
                                required
                            >
                                {ESTADOS.filter(e => e !== "Todos").map(e => (
                                    <option key={e} value={e.toLowerCase()}>{e}</option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 disabled:opacity-60"
                                disabled={saving}
                            >
                                {saving ? (
                                    <LoaderCircle className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Guardar cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de eliminar */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-sm relative">
                        <button
                            className="absolute top-2 right-2 text-zinc-400 hover:text-red-400"
                            onClick={() => setDeleteModal({open: false, denuncia: null})}
                        >
                            <X />
                        </button>
                        <h2 className="text-lg font-bold mb-4 text-white">Eliminar denuncia</h2>
                        <p className="mb-6 text-zinc-300">
                            ¿Estás seguro de que deseas eliminar la denuncia <span className="font-bold">{deleteModal.denuncia?.titulo || deleteModal.denuncia?.title}</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex-1 disabled:opacity-60 flex items-center justify-center gap-2"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <LoaderCircle className="w-4 h-4 animate-spin" />
                                ) : null}
                                Sí, eliminar
                            </button>
                            <button
                                className="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded flex-1"
                                onClick={() => setDeleteModal({open: false, denuncia: null})}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Denuncias;