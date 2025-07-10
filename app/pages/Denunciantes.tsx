import { useEffect, useState } from "react";
import { Plus, User } from "lucide-react";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { app } from "../firebase/firebase.config";

const Denunciantes = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [denunciantes, setDenunciantes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    correo: "",
    whatsapp: "",
    expediente: "",
  });

  const db = getFirestore(app);

  const fetchDenunciantes = async () => {
    const colRef = collection(db, "demandantes");
    const snapshot = await getDocs(colRef);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setDenunciantes(list);
  };

  useEffect(() => {
    fetchDenunciantes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const colRef = collection(db, "demandantes");
    await addDoc(colRef, formData);
    setShowModal(false);
    setFormData({
      nombre: "",
      apellido: "",
      dni: "",
      correo: "",
      whatsapp: "",
      expediente: "",
    });
    await fetchDenunciantes();
  };

  return (
    <section className="size-full p-6 text-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start justify-start">
        {/* Botón de agregar demandante, ahora con misma altura que cards */}
        <div
          onClick={() => setShowModal(true)}
          className="cursor-pointer min-h-[238px] p-6 border border-zinc-700 rounded-xl flex flex-col justify-center gap-3 bg-zinc-800 hover:bg-red-600 hover:text-white text-red-500 transition"
        >
          <Plus className="w-10 h-10 mx-auto" />
          <span className="text-center font-semibold text-lg">
            Agregar Demandante
          </span>
        </div>

        {/* Cards de demandantes */}
        {denunciantes.map((d) => (
        <div
          key={d.id}
          className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-md flex flex-col justify-between gap-3 min-h-[240px]"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <User className="text-red-500" />
              <h3 className="text-lg font-semibold">
                {d.nombre} {d.apellido}
              </h3>
            </div>
            <p><span className="text-red-500">DNI:</span> {d.dni}</p>
            <p><span className="text-red-500">Correo:</span> {d.correo}</p>
            <p><span className="text-red-500">WhatsApp:</span> {d.whatsapp}</p>
            <p><span className="text-red-500">Expediente:</span> {d.expediente}</p>
          </div>
          
          {/* Botón de Contactar */}
          {d.whatsapp && (
            <a
              href={`https://wa.me/${d.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red-600 -mt-10 p-2 text-white rounded hover:bg-red-700 transition text-center"
            >
              Contactar
            </a>
          )}
        </div>
      ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-800 rounded-xl shadow-lg p-6 w-full max-w-lg border border-zinc-700">
            <h2 className="text-2xl font-semibold mb-4 text-red-500">
              Nuevo Demandante
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["nombre", "apellido", "dni", "correo", "whatsapp", "expediente"].map((field) => (
                  <input
                    key={field}
                    type={field === "correo" ? "email" : "text"}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={(formData as any)[field]}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                    required
                    className="bg-zinc-900 border border-zinc-700 p-2 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-700 text-gray-200 rounded hover:bg-zinc-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Denunciantes;
