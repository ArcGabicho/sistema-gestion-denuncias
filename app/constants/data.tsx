import { VenetianMask } from "lucide-react";
import { ChartColumn } from "lucide-react";
import { Images } from "lucide-react";
import { Database } from "lucide-react";
import { Users } from "lucide-react";
import { CircleAlert } from "lucide-react";

export const navItems = [
  { label: "Inicio", href: "#Inicio" },
  { label: "Funciones", href: "#Funciones" },
  { label: "Misión", href: "#Mision" },
  { label: "Miembros", href: "#Miembros" },
];

export const features = [
  {
    icon: <VenetianMask />,
    text: "Denuncias Anónimas",
    description:
      "Sistema encriptado que protege la identidad del denunciante y evita represalias, generando un código de seguimiento único.",
  },
  {
    icon: <Images />,
    text: "Evidencias Multimedia",
    description:
      "Permite adjuntar fotos/videos del delito con almacenamiento seguro para validar denuncias judicialmente.",
  },
  {
    icon: <Database />,
    text: "Panel de Análisis de Datos",
    description:
      "Integración con bases de la PNP para verificar antecedentes y evitar denuncias duplicadas automáticamente.",
  },
  {
    icon: <ChartColumn />,
    text: "Clasificación de Denuncias",
    description:
      " IA analiza denuncias, detecta patrones y las categoriza por gravedad para priorizar casos.",
  },
  {
    icon: <Users />,
    text: "Viralizar Denuncias",
    description:
      "Bot automático que publica denuncias validadas en redes sociales para movilizar apoyo ciudadano contra corrupción.",
  },
  {
    icon: <CircleAlert />,
    text: "Alertas Ciudadanas Inmediatas",
    description:
      "Notifica el estado de denuncias y alertas de seguridad por SMS/email al ciudadano.",
  },
];

export const checklistItems = [
  {
    title: "Reducir la Impunidad",
    description:
      "Combatir la delincuencia con denuncias publicas y efectivas.",
  },
  {
    title: "Empoderar Ciudadanos",
    description:
      "Dar voz segura a víctimas mediante tecnología accesible.",
  },
  {
    title: "Transparencia Judicial",
    description:
      "Garantizar trazabilidad digital en cada caso denunciado.",
  },
  {
    title: "Prevención Social",
    description:
      "Alertas tempranas para disuadir delitos en zonas críticas.",
  },
  {
    title: "Crear Comunidades Alertas",
    description:
      "Fomentar medidas preventivas mediante concientización.",
  }
];

export const testimonials = [
  {
    user: "Gabriel Polack",
    company: "Arquitecto de Software",
    image: "/assets/profile-pictures/gabo.jpg",
    text: "Lideré el diseño de una arquitectura escalable que integró Next.js, FastAPI y Oracle, priorizando seguridad y alto rendimiento para manejar miles de denuncias diarias. Mi enfoque en patrones limpios y documentación detallada permitió un desarrollo fluido y mantenible.",
  },
  {
    user: "Douglas Morean",
    company: "Desarrollador Frontend",
    image: "/assets/profile-pictures/douglas.jpg",
    text: "Implementé interfaces intuitivas en Next.js con énfasis en accesibilidad móvil. Optimizó el rendimiento del frontend reduciendo tiempos de carga en 40%, y su manejo de estados globales mejoró la experiencia de usuarios en zonas con baja conectividad.",
  },
  {
    user: "Aimar de la Cruz",
    company: "Desarrollador Backend",
    image: "/assets/profile-pictures/aimar.jpg",
    text: "Desarrolló APIs robustas en FastAPI, garantizando respuestas en <500ms incluso bajo alta demanda. Integró IA para clasificación automática de denuncias y diseñó el módulo de conexión segura a Oracle, clave para la interoperabilidad con sistemas PNP.",
  },
];

export const resourcesLinks = [
  { href: "https://www.linkedin.com/in/gabriel-polack-castillo/", text: "LinkedIn" },
  { href: "https://github.com/GaboGabito05/", text: "GitHub" },
  { href: "https://www.upwork.com/freelancers/~0180bc0ba4ba024471", text: "Upwork" },
];

export const platformLinks = [
  { href: "https://www.linkedin.com/in/douglasmorean/", text: "LinkedIn" },
  { href: "https://github.com/dunp3r/", text: "GitHub" },
];

export const communityLinks = [
  { href: "#", text: "LinkedIn" },
  { href: "#", text: "GitHub" },
];