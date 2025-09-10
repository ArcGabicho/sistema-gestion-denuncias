import Image from "next/image";

const HeroSection = () => {
  return (
    <div id="Inicio" className="flex flex-col items-center mt-6 lg:mt-20">
      <h1 className="text-4xl sm:text-6xl lg:text-7xl text-center tracking-wide">
        Aporta al Orden con
        <span className="bg-gradient-to-r from-red-500 to-red-800 text-transparent bg-clip-text">
          {" "}
          Perú Seguro
        </span>
      </h1>
      <p className="mt-10 text-lg text-center text-neutral-500 max-w-4xl">
        Perú Seguro es una plataforma que permite a juntas vecinales reportar
        faltas administrativas y delitos en tiempo real. Con nuestra aplicación, puedes
        enviar denuncias de manera rápida y sencilla, y ayudar a crear un entorno
        más seguro para todos. Ayuda a tu comunidad y sé parte del cambio.

      </p>
      <div className="flex justify-center my-10">
        <a
          href="/denuncia"
          className="bg-gradient-to-r from-red-500 to-red-800 py-3 px-4 mx-3 rounded-md"
        >
          Denunciar
        </a>
        <a href="/portal" className="py-3 px-4 mx-3 rounded-md border">
          Portal de Denuncias
        </a>
      </div>
      <div className="flex flex-col md:flex-row mt-10 justify-center">
        <Image src="/assets/portada-1.jpeg" className="rounded-lg w-[30rem] h-[20rem] border border-red-700 shadow-sm shadow-red-400 mx-2 my-4" width={900} height={50} alt="Video Thumbnail"  />
        <Image src="/assets/portada-2.jpeg" className="rounded-lg w-[30rem] h-[20rem] border border-red-700 shadow-sm shadow-red-400 mx-2 my-4" width={900} height={50} alt="Video Thumbnail"  />
      </div>
    </div>
  );
};

export default HeroSection;