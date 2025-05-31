"use client"

import { Menu, X } from "lucide-react";
import { navItems } from "../constants/data";
import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <nav className="sticky top-0 z-50 py-3 backdrop-blur-lg border-b border-neutral-700/80">
      <div className="container px-4 mx-auto relative lg:text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-shrink-0">
            <Image className="size-10 mr-2" src="/assets/logo.png" alt="Logo" width={32} height={32}/>
            <span className="text-xl tracking-tight">Perú Seguro</span>
          </div>
          <ul className="hidden lg:flex ml-14 space-x-12">
            {navItems.map((item, index) => (
              <li key={index}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
          <div className="hidden lg:flex justify-center space-x-4 items-center">
            <Link href="/login">
              <button className="py-2 px-3 border rounded-md">
                Ingresar
              </button>
            </Link>
            <Link href="/register">
              <button
                className="bg-gradient-to-r from-red-500 to-red-800 py-2 px-3 rounded-md"
              >
                Crear una cuenta
              </button>
            </Link>  
          </div>
          <div className="lg:hidden md:flex flex-col justify-end">
            <button onClick={toggleNavbar}>
              {mobileDrawerOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileDrawerOpen && (
          <div className="fixed right-0 z-20 bg-neutral-900 w-full p-12 flex flex-col justify-center items-center lg:hidden">
            <ul>
              {navItems.map((item, index) => (
                <li key={index} className="py-4">
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;