import FormularioRegister from "@/app/components/FormularioRegister";
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
        <FormularioRegister />
      </div>
    </main>
  );
};

export default Register;
