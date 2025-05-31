const HeroSection = () => {
  return (
    <div id="Inicio" className="flex flex-col items-center mt-6 lg:mt-20">
      <h1 className="text-4xl sm:text-6xl lg:text-7xl text-center tracking-wide">
        Denuncia las injusticias con
        <span className="bg-gradient-to-r from-red-500 to-red-800 text-transparent bg-clip-text">
          {" "}
          Perú Seguro
        </span>
      </h1>
      <p className="mt-10 text-lg text-center text-neutral-500 max-w-4xl">
        Perú Seguro es una plataforma que permite a los ciudadanos reportar
        injusticias y delitos en tiempo real. Con nuestra aplicación, puedes
        enviar denuncias de manera rápida y sencilla, y ayudar a crear un entorno
        más seguro para todos. Únete a nuestra comunidad y sé parte del cambio.

      </p>
      <div className="flex justify-center my-10">
        <a
          href="/denuncia"
          className="bg-gradient-to-r from-red-500 to-red-800 py-3 px-4 mx-3 rounded-md"
        >
          Denunciar
        </a>
        <a href="#" className="py-3 px-4 mx-3 rounded-md border">
          Guía de uso
        </a>
      </div>
      <div className="flex mt-10 justify-center">
        <video autoPlay loop muted className="rounded-lg w-1/2 border border-red-700 shadow-sm shadow-red-400 mx-2 my-4">
          <source src="/assets/video-1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <video autoPlay loop muted className="rounded-lg w-1/2 border border-red-700 shadow-sm shadow-red-400 mx-2 my-4">
          <source src="/assets/video-2.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

export default HeroSection;
