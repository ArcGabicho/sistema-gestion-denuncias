import FormularioLogin from "@/app/components/FormularioLogin";
import Image from "next/image";

const Login = () => {
    return (
        <main className="flex h-screen flex-col md:flex-row">
            <div className="w-full md:w-2/6 shadow-lg p-8 flex flex-col items-center space-y-[12rem] md:space-y-10">
                <FormularioLogin />
            </div>
            <div className="hidden md:block w-4/6 relative">
                <Image 
                    src="/assets/portada.png" 
                    alt="portada" 
                    layout="fill" 
                    objectFit="cover" 
                />
            </div>
        </main>
    )
}

export default Login;