import { useEffect, useState } from "react";
import { MessageCircle, Edit, Trash2, X, Check, LoaderCircle, AlertTriangle, Search, Filter } from "lucide-react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { app } from "../firebase/firebase.config";

interface Contacto {
  id: string;
  firestoreId: string;
  title: string;
  whatsapp: string;
}

const Denunciantes = () => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [filteredContactos, setFilteredContactos] = useState<Contacto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{open: boolean, contacto: Contacto | null}>({open: false, contacto: null});
  const [deleteModal, setDeleteModal] = useState<{open: boolean, contacto: Contacto | null}>({open: false, contacto: null});
  const [editForm, setEditForm] = useState({title: "", whatsapp: ""});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const db = getFirestore(app);

  const fetchContactos = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, "denuncias");
      const snapshot = await getDocs(colRef);
      const list = snapshot.docs
        .map((doc) => ({
          id: doc.data().id || doc.id,
          firestoreId: doc.id,
          title: doc.data().title || "",
          whatsapp: doc.data().whatsapp || "",
        }))
        .filter(item => item.whatsapp && item.whatsapp.trim() !== ""); // Solo contactos con WhatsApp
      setContactos(list);
    } catch (error) {
      console.error("Error al cargar contactos:", error);
      setToast({ type: "error", message: "Error al cargar contactos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar contactos según término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContactos(contactos);
    } else {
      const filtered = contactos.filter(contacto =>
        contacto.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contacto.whatsapp.includes(searchTerm) ||
        contacto.id.toString().includes(searchTerm)
      );
      setFilteredContactos(filtered);
    }
  }, [contactos, searchTerm]);

  // Abrir modal de edición
  const handleEdit = (contacto: Contacto) => {
    setEditForm({
      title: contacto.title,
      whatsapp: contacto.whatsapp,
    });
    setEditModal({open: true, contacto});
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    if (!editModal.contacto) return;
    setSaving(true);
    try {
      const ref = doc(db, "denuncias", editModal.contacto.firestoreId);
      await updateDoc(ref, {
        title: editForm.title,
        whatsapp: editForm.whatsapp,
      });
      setEditModal({open: false, contacto: null});
      setToast({ type: "success", message: "Contacto actualizado correctamente" });
      await fetchContactos(); // Refrescar lista
    } catch (error) {
      console.error("Error al actualizar:", error);
      setToast({ type: "error", message: "Error al actualizar contacto" });
    } finally {
      setSaving(false);
    }
  };

  // Abrir modal de eliminar
  const handleDelete = (contacto: Contacto) => {
    setDeleteModal({open: true, contacto});
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deleteModal.contacto) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "denuncias", deleteModal.contacto.firestoreId));
      setDeleteModal({open: false, contacto: null});
      setToast({ type: "success", message: "Contacto eliminado correctamente" });
      await fetchContactos(); // Refrescar lista
    } catch (error) {
      console.error("Error al eliminar:", error);
      setToast({ type: "error", message: "Error al eliminar contacto" });
    } finally {
      setDeleting(false);
    }
  };

  // Mostrar toast por 3 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <section className="size-full p-6 text-white flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="w-8 h-8 animate-spin text-red-400 mx-auto mb-4" />
          <p className="text-zinc-400">Cargando contactos...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="size-full p-6 text-white">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-lg shadow-lg flex items-center gap-3
            ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
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

      {/* Navbar de navegación */}
      <div className="bg-gradient-to-r from-zinc-900/90 to-zinc-800/90 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-zinc-700/50 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Título y contador */}
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3">
              <MessageCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Contactos WhatsApp
              </h1>
              <p className="text-zinc-400 text-sm">
                {filteredContactos.length} de {contactos.length} contactos
              </p>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por título, número o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-80 pl-10 pr-4 py-3 bg-zinc-800/80 border border-zinc-600/50 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Filtros adicionales */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-zinc-400" />
              <span className="text-sm text-zinc-400">
                {filteredContactos.length > 0 ? "Mostrando resultados" : "Sin resultados"}
              </span>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {contactos.length > 0 && (
          <div className="mt-6 pt-6 border-t border-zinc-700/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{contactos.length}</p>
                <p className="text-sm text-zinc-400">Total contactos</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{filteredContactos.length}</p>
                <p className="text-sm text-zinc-400">Resultados filtrados</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {searchTerm ? Math.round((filteredContactos.length / contactos.length) * 100) : 100}%
                </p>
                <p className="text-sm text-zinc-400">Coincidencias</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredContactos.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          {searchTerm ? (
            <>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                No se encontraron contactos
              </h3>
              <p className="text-zinc-500 mb-4">
                No hay contactos que coincidan con &quot;{searchTerm}&quot;.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                No hay contactos disponibles
              </h3>
              <p className="text-zinc-500">
                Los contactos aparecerán aquí cuando se registren denuncias con WhatsApp.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContactos.map((contacto) => (
            <div
              key={contacto.firestoreId}
              className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-zinc-600"
            >
              {/* Header con ID */}
              <div className="flex items-center justify-between mb-4">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2">
                  <MessageCircle className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-xs text-zinc-500 font-mono">#{contacto.id}</span>
              </div>

              {/* Título */}
              <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 min-h-[3.5rem]">
                {contacto.title}
              </h3>

              {/* WhatsApp */}
              <div className="mb-6">
                <p className="text-sm text-zinc-400 mb-1">WhatsApp</p>
                <p className="text-green-400 font-medium">{contacto.whatsapp}</p>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                {/* Botón de contactar */}
                <a
                  href={`https://wa.me/${contacto.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola! Me comunico en relación a: "${contacto.title}". ¿Podrían proporcionarme más información? Gracias.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar</span>
                </a>

                {/* Botones de editar y eliminar */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(contacto)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(contacto)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-md relative border border-zinc-700">
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-red-400 transition-colors"
              onClick={() => setEditModal({open: false, contacto: null})}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-white">Editar contacto</h2>
            <form
              className="space-y-4"
              onSubmit={e => { e.preventDefault(); handleSaveEdit(); }}
            >
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Título
                </label>
                <input
                  className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título del contacto"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  WhatsApp
                </label>
                <input
                  className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de WhatsApp"
                  value={editForm.whatsapp}
                  onChange={e => setEditForm({...editForm, whatsapp: e.target.value})}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
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
          <div className="bg-zinc-900 rounded-xl p-6 w-full max-w-sm relative border border-zinc-700">
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-red-400 transition-colors"
              onClick={() => setDeleteModal({open: false, contacto: null})}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="bg-red-500/20 border border-red-500/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-3 text-white">Eliminar contacto</h2>
              <p className="mb-6 text-zinc-300">
                ¿Estás seguro de que deseas eliminar el contacto de{" "}
                <span className="font-semibold text-white">
                  {deleteModal.contacto?.title}
                </span>?
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : null}
                  Sí, eliminar
                </button>
                <button
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 rounded-lg transition-all"
                  onClick={() => setDeleteModal({open: false, contacto: null})}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Denunciantes;
