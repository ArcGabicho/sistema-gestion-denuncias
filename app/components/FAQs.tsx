"use client";

import { useState } from "react"
import { motion } from "framer-motion";
import {
  HelpCircle,
  ShieldQuestion,
  FileQuestion,
  UserCircle,
  ChevronDown,
} from "lucide-react";

const faqs = [
  {
    question: "¿Cómo sé si mi denuncia fue recibida?",
    answer:
      "Si la denuncia fue hecha sin formar parte de una comunidad, tu denuncia podrá verse en el portal público de denuncias. Si perteneces a una comunidad, podrás verla en la pestaña de denuncias.",
    icon: HelpCircle,
  },
  {
    question: "¿Puedo adjuntar documentos?",
    answer:
      "Sí puedes, en el momento que hagas tu denuncia el formulario te dará una opción de subir evidencias como documentos, fotos o videos.",
    icon: FileQuestion,
  },
  {
    question: "¿Qué pasa si no tengo pruebas?",
    answer:
      "No te preocupes, tu denuncia será recibida y evaluada por los administradores. Aunque las pruebas ayudan a agilizar el proceso, tu testimonio es importante y puede iniciar una investigación preliminar.",
    icon: ShieldQuestion,
  },
  {
    question: "¿Mi denuncia será anónima al 100%?",
    answer:
      "Sí, pues si haces una denuncia anónima el sistema no guarda ninguno de tus datos personales. Tu identidad estará completamente protegida.",
    icon: UserCircle,
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      stiffness: 120,
    },
  }),
};

const FAQs = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section id="FAQs" className="flex flex-col items-center mt-6 lg:mt-20">
      <h2 className="text-4xl sm:text-5xl lg:text-6xl text-center tracking-wide mb-6">
        Preguntas <span className="bg-gradient-to-r from-red-500 to-red-800 text-transparent bg-clip-text">y Respuestas</span>
      </h2>
      <p className="mb-10 text-lg text-center text-neutral-500 max-w-3xl">
        Resuelve tus dudas sobre el funcionamiento de Perú Seguro y la gestión de denuncias en tu comunidad.
      </p>
      <div className="w-full max-w-3xl space-y-6">
        {faqs.map((faq, idx) => {
          const Icon = faq.icon;
          const isOpen = openIdx === idx;
          return (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={itemVariants}
              className="bg-neutral-900 rounded-md text-md border border-neutral-800 font-thin"
            >
              <button
                className="w-full flex items-center gap-6 px-6 py-3 focus:outline-none min-h-[64px]"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
              >
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: idx * 0.15 }}
                  className="flex-shrink-0 mt-1"
                >
                  <Icon size={25} className="text-neutral-400 dark:text-neutral-300" />
                </motion.div>
                <h3 className="text-md text-neutral-800 dark:text-neutral-100 mb-0 text-left leading-tight">
                  {faq.question}
                </h3>
                <span className={`ml-auto transition-transform text-neutral-400 dark:text-neutral-300 ${isOpen ? "rotate-180" : "rotate-0"}`}>
                  <ChevronDown size={25} />
                </span>
              </button>
              <motion.div
                id={`faq-answer-${idx}`}
                initial={false}
                animate={isOpen ? "open" : "closed"}
                variants={{
                  open: { height: "auto", opacity: 1, scale: 1, marginTop: 0 },
                  closed: { height: 0, opacity: 0, scale: 0.95, marginTop: 0 },
                }}
                transition={{ height: { duration: 0.3 }, opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
                style={{ overflow: "hidden" }}
              >
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-neutral-700 dark:text-neutral-300 text-base">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQs;
