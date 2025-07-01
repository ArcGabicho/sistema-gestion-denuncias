"use client";

import * as z from "zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createUser, updateUser } from "../firebase/firebase.config";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

const FormularioRegister = () => {

    const [isLoading, setisLoading] = useState<boolean>(false)
    
    const formSchema = z.object({
        uid: z.string(),
        name: z.string().min(4, {
            message: "El nombre de usuario debe tener al menos 4 caracteres"
        }),
        email: z.string().email("Debe ser un correo electrónico válido").min(1, { 
            message: "El correo electrónico es obligatorio"
        }),
        password: z.string().min(6, {
            message: "La contraseña debe tener al menos 6 caracteres"
        }),
    });   
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            uid: "",
            name: "",
            email: "",
            password: "",
        },
    })
    
    const { register, handleSubmit, formState } = form;
    const { errors } = formState;
    
    const onSubmit = async (user: z.infer<typeof formSchema>) => {
        console.log(user);
        setisLoading(true);
        try {
            await createUser(user);
            await updateUser({ displayName: user.name})
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.message, {duration: 2500});
        } finally{
            setisLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6 md:space-y-4">
          <h2 className="text-xl font-semibold text-white text-center">
            Registrarse
          </h2>
          <div className="flex flex-col">
            <label
              htmlFor="username"
              className="text-sm font-medium text-white"
            >
              Nombre de Usuario
            </label>
            <input
                {...register("name")}
                type="text"
                name="name"
                id="name"
                placeholder="Ingrese un nombre de usuario"
                className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="form-error">
                {errors.name?.message}
            </p>
          </div>
          <div className="flex flex-col">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Correo Electronico
            </label>
            <input
                {...register("email")}
                type="email"
                name="email"
                id="email"
                placeholder="Ingrese su correo electrónico"
                className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="form-error">
                {errors.email?.message}
            </p>
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-sm font-medium text-white"
            >
              Contraseña
            </label>
            <input
                {...register("password")}
                type="password"
                name="password"
                id="password"
                placeholder="Ingrese una contraseña"
                className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="form-error">
                {errors.password?.message}
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-red-800 text-white py-2 rounded-md hover:bg-red-700 transition duration-200"
          >
            {isLoading && (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
            )}
            Crear cuenta
          </button>
          <h6 className="text-sm text-gray-600 mt-4 text-center">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-white hover:underline">
              Ingresar
            </Link>
          </h6>
        </form>
    )
}

export default FormularioRegister;