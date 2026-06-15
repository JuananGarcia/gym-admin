"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#cafd00] opacity-[0.03] blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#cafd00] flex items-center justify-center">
              <span className="text-[#516700] font-black text-sm">G</span>
            </div>
            <span className="text-xl font-bold tracking-tight">GymFlow</span>
          </div>
          <p className="text-muted-foreground text-sm">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="surface-high rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-semibold mb-1">Bienvenido</h1>
          <p className="text-muted-foreground text-sm mb-8">Ingresa a tu cuenta</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-label-micro">Email</label>
              <div className="input-neon rounded-xl border border-white/10 transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#494847]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-label-micro">Contraseña</label>
              <div className="input-neon rounded-xl border border-white/10 transition-all">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#494847]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cta w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
