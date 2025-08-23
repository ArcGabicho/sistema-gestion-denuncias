import { LayoutDashboard, FileText, Users, BarChart2, Brain, Loader2, LogOut } from 'lucide-react';
import { signOut } from "firebase/auth";
import { auth } from '../firebase/firebase.config';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';

const navItems = [
    { label: 'Inicio', href: 'Inicio', icon: LayoutDashboard },
    { label: 'Denuncias', href: 'Denuncias', icon: FileText },
    { label: 'Denunciantes', href: 'Denunciantes', icon: Users },
    { label: 'Reportes', href: 'Reportes', icon: BarChart2 },
    { label: 'IA', href: 'IA', icon: Brain },
];

type SidebarProps = {
    onChangeVista: (arg: { href: string }) => void;
};

const Sidebar = ({ onChangeVista }: SidebarProps) => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            toast.success('Sesión cerrada correctamente', {duration: 2500});
            router.push('/');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(`Error al cerrar sesión: ${error.message}`, {duration: 2500})
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside className="h-screen w-64 border-r border-gray-100 flex flex-col py-8 px-6 fixed left-0 top-0 shadow-lg">
            <div className="flex items-center gap-3 mb-10">
                <div className="text-white rounded-full p-2">
                    <Image
                        src="/assets/logo.png"
                        alt="Logo"
                        width={35}
                        height={35}
                        className="rounded-full"
                    />
                </div>
                <span className="-ml-4 font-bold text-2xl text-white tracking-tight">
                    Perú Seguro
                </span>
            </div>
            <nav className="flex flex-col gap-2">
                {navItems.map(({ label, href, icon: Icon }) => (
                    <button
                        key={label}
                        onClick={() => onChangeVista({ href })}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-red-50 hover:text-gray-700 transition-colors font-medium"
                    >
                        <Icon size={22} className="text-red-600" />
                        {label}
                    </button>
                ))}
            </nav>
            <div className="mt-auto text-xs text-gray-400 pt-8 border-t border-gray-100">
                © 2025 Peru Seguro
            </div>
            <button
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium text-sm"
                onClick={handleSignOut}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <LogOut className="h-5 w-5" />
                )}
                Cerrar sesión
            </button>
        </aside>
    );
};

export default Sidebar;