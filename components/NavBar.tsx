"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname === href
        ? "bg-zinc-900 text-white"
        : "text-zinc-600 hover:bg-zinc-200"
    }`;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href="/" className={linkClass("/")}>
            Inicio
          </Link>
          <Link href="/subjects" className={linkClass("/subjects")}>
            Materias
          </Link>
          <Link href="/study" className={linkClass("/study")}>
            Estudiar
          </Link>
        </div>
        <button
          onClick={logout}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Salir
        </button>
      </nav>
    </header>
  );
}
