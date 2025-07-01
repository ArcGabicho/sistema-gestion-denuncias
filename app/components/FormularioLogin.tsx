"use client";

import { signIn } from "../firebase/firebase.config";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";


const FormularioLogin = () => {

    const [isLoading, setisLoading] = useState<boolean>(false)

    const formSchema = z.object({
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
            email: "",
            password: "",
        },
    })

    const { register, handleSubmit, formState } = form;
    const { errors } = formState;

    const onSubmit = async (user: z.infer<typeof formSchema>) => {
       setisLoading(true);
        try {
            let res = await signIn(user);
       } catch (error: any) {
            toast.error(error.message, {duration: 2500});
       } finally{
            setisLoading(false);
       }
    };

    return (
        <>
            <div className="flex items-center space-x-3 mb-6">
                <Image src="/assets/logo.png" alt="logo" width={40} height={40} />
                <h1 className="text-2xl font-bold text-white">
                    Perú Seguro
                </h1>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6 flex flex-col justify-center flex-grow">
                <h2 className="text-xl font-semibold text-white text-center">
                    Ingresar
                </h2>
                <div className="flex flex-col">
                <label htmlFor="email" className="text-sm font-medium text-white">
                    Correo Electronico
                </label>
                <input
                    {...register("email")}
                    type="email"
                    id="email"
                    autoComplete="email"
                    placeholder="Ingrese su correo electrónico"
                    className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="form-error">
                    {errors.email?.message}
                </p>
                </div>
                <div className="flex flex-col">
                <label htmlFor="password" className="text-sm font-medium text-white">
                    Contraseña
                </label>
                <input
                    {...register("password")}
                    type="password"
                    id="password"
                    placeholder="Ingrese su contraseña"
                    className="mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="form-error">
                    {errors.email?.message}
                </p>
                </div>
                <button type="submit" disabled={isLoading} className="w-full text-center bg-gradient-to-r from-red-500 to-red-800 text-white py-2 rounded-md hover:bg-red-700 transition duration-200">
                    {isLoading && (
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                    )}
                    Ingresar
                </button>
                <h6 className="text-sm text-gray-600 mt-6 text-center">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className="text-white hover:underline">
                        Crear una cuenta
                    </Link>
                </h6>
            </form>
        </>
    );
};

export default FormularioLogin;
