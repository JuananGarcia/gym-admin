import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymFlow — Panel del Entrenador",
  description: "Gestiona tus clientes, rutinas y pagos desde un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} h-full dark`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#201f1f",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#ffffff",
            },
          }}
        />
      </body>
    </html>
  );
}
