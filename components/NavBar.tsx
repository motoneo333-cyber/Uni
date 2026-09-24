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
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-indigo-600 text-white"
        : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
    }`;

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 sticky top-0 z-10">
      <nav className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="hidden sm:flex items-center gap-1.5 mr-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-indigo-600 text-xs font-bold text-white">
              K
            </span>
            Kine Study
          </span>
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
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Salir
        </button>
      </nav>
    </header>
  );
}
