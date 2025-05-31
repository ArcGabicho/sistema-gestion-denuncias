import Image from "next/image";

const Login = () => {
    return (
        <main className="flex h-screen flex-col md:flex-row">
            <div className="w-full md:w-2/6 shadow-lg p-8 flex flex-col items-center space-y-[12rem] md:space-y-10">
                <div className="flex items-center space-x-3 mb-6">
                    <Image src="/assets/logo.png" alt="logo" width={40} height={40} />
                    <h1 className="text-2xl font-bold text-white">Perú Seguro</h1>
                </div>
                <form action="" className="w-full space-y-6 flex flex-col justify-center flex-grow">
                    <h2 className="text-xl font-semibold text-white text-center">Ingresar</h2>
                    <div className="flex flex-col">
                        <label htmlFor="username" className="text-sm font-medium text-white">Nombre de Usuario</label>
                        <input 
                            type="text" 
                            name="username" 
                            id="username" 
                            placeholder="Ingrese su nombre de usuario" 
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="password" className="text-sm font-medium text-white">Contraseña</label>
                        <input 
                            type="password" 
                            name="password" 
                            id="password" 
                            placeholder="Ingrese su contraseña" 
                            className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-red-500 to-red-800 text-white py-2 rounded-md hover:bg-red-700 transition duration-200"
                    >
                        Ingresar
                    </button>
                    <h6 className="text-sm text-gray-600 mt-6 text-center">
                        ¿No tienes una cuenta? <a href="/register" className="text-white hover:underline">Crear una cuenta</a>
                    </h6>
                </form>
            </div>
            <div className="hidden md:block w-4/6 relative">
                <Image 
                    src="/assets/portada.jpg" 
                    alt="portada" 
                    layout="fill" 
                    objectFit="cover" 
                />
            </div>
        </main>
    )
}

export default Login;