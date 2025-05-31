import Image from "next/image";

const Register = () => {
  return (
    <main className="flex h-screen flex-col md:flex-row">
      <div className="hidden md:block w-4/6 relative">
        <Image
          src="/assets/portada-2.jpg"
          alt="portada"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 object-contain"
        />
      </div>
      <div className="w-full md:w-2/6 shadow-lg p-6 flex flex-col items-center justify-center space-y-10 md:space-y-6">
        <div className="flex items-center space-x-3">
          <Image src="/assets/logo.png" alt="logo" width={40} height={40} />
          <h1 className="text-2xl font-bold text-white">Perú Seguro</h1>
        </div>
        <form action="" className="w-full space-y-6 md:space-y-4">
          <h2 className="text-xl font-semibold text-white text-center">
            Registrarse
          </h2>
          <div className="flex flex-col">
            <label htmlFor="rol" className="text-sm font-medium text-white">
              Rol
            </label>
            <select
              name="rol"
              id="rol"
              className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="Civil">Civil</option>
              <option value="Policia">Policia</option>
              <option value="Fiscal">Fiscal</option>
              <option value="Comunicador">Comunicador</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex flex-col w-full space-y-2 md:space-y-0">
              <label htmlFor="name" className="text-sm font-medium text-white">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                id="name"
                placeholder="Ingrese su nombre"
                className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex flex-col w-full space-y-2 md:space-y-0">
              <label
                htmlFor="apellido"
                className="text-sm font-medium text-white"
              >
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                id="apellido"
                placeholder="Ingrese su apellido"
                className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Correo Electronico
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Ingrese su correo electrónico"
              className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="username"
              className="text-sm font-medium text-white"
            >
              Nombre de Usuario
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="Ingrese un nombre de usuario"
              className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-sm font-medium text-white"
            >
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Ingrese una contraseña"
              className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-red-800 text-white py-2 rounded-md hover:bg-red-700 transition duration-200"
          >
            Crear cuenta
          </button>
          <h6 className="text-sm text-gray-600 mt-4 text-center">
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" className="text-white hover:underline">
              Loguearse
            </a>
          </h6>
        </form>
      </div>
    </main>
  );
};

export default Register;
