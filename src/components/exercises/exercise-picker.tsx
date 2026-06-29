"use client";

import { useState, useEffect } from "react";
import { Search, X, Check, Dumbbell, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MuscleGroup, DifficultyLevel } from "@/lib/supabase/types";

interface Exercise {
  id: string;
  name_es: string;
  name_en: string;
  description_es: string | null;
  muscle_group: MuscleGroup;
  difficulty: DifficultyLevel;
  thumbnail_url: string | null;
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", legs: "Piernas",
  glutes: "Glúteos", core: "Core", cardio: "Cardio",
  full_body: "Cuerpo completo", other: "Otro",
};

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  beginner:              "bg-[#cafd00]/10 text-[#cafd00]",
  beginner_intermediate: "bg-[#7ddba0]/10 text-[#7ddba0]",
  intermediate:          "bg-[#ece856]/10 text-[#ece856]",
  intermediate_advanced: "bg-[#f0a05a]/10 text-[#f0a05a]",
  advanced:              "bg-[#ff7351]/10 text-[#ff7351]",
};

const DIFFICULTY_SHORT: Record<DifficultyLevel, string> = {
  beginner:              "Princ.",
  beginner_intermediate: "P-Int.",
  intermediate:          "Inter.",
  intermediate_advanced: "I-Avz.",
  advanced:              "Avanz.",
};

interface PickerProps {
  trainerId: string;
  selected: Exercise[];
  onConfirm: (exercises: Exercise[]) => void;
  onClose: () => void;
}

export function ExercisePicker({ trainerId, selected: initialSelected, onConfirm, onClose }: PickerProps) {
  const supabase = createClient();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | "all">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set(initialSelected.map((e) => e.id)));

  useEffect(() => {
    supabase
      .from("exercises")
      .select("id, name_es, name_en, description_es, muscle_group, difficulty, thumbnail_url")
      .or(`is_global.eq.true,created_by.eq.${trainerId}`)
      .order("name_es")
      .then(({ data }) => {
        setExercises((data ?? []) as Exercise[]);
        setLoading(false);
      });
  }, [trainerId]);

  const filtered = exercises.filter((e) => {
    const q = search.toLowerCase();
    return (
      (!q || e.name_es.toLowerCase().includes(q) || e.name_en.toLowerCase().includes(q)) &&
      (filterMuscle === "all" || e.muscle_group === filterMuscle)
    );
  });

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(exercises.filter((e) => picked.has(e.id)));
  };

  // Unique muscles from loaded exercises
  const usedMuscles = [...new Set(exercises.map((e) => e.muscle_group))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface-highest rounded-2xl w-full max-w-2xl border border-white/5 glass flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <div>
            <h3 className="font-semibold text-base">Seleccionar ejercicios</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {picked.size} seleccionado{picked.size !== 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-[#adaaaa]">
            <X size={16} />
          </button>
        </div>

        {/* Search + filter */}
        <div className="p-4 space-y-3 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2 surface-high rounded-xl px-4 py-2.5 border border-white/5 input-neon transition-all">
            <Search size={14} className="text-[#494847] shrink-0" />
            <input
              type="text"
              placeholder="Buscar ejercicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-[#494847]"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMuscle("all")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                filterMuscle === "all" ? "bg-[#cafd00]/10 text-[#cafd00]" : "bg-white/5 text-[#adaaaa] hover:text-white"
              )}
            >
              Todos
            </button>
            {usedMuscles.map((m) => (
              <button
                key={m}
                onClick={() => setFilterMuscle(m)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                  filterMuscle === m ? "bg-[#cafd00]/10 text-[#cafd00]" : "bg-white/5 text-[#adaaaa] hover:text-white"
                )}
              >
                {MUSCLE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#cafd00]/20 border-t-[#cafd00] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell size={28} className="text-[#494847] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                {search ? "Sin resultados" : "No hay ejercicios en tu librería"}
              </p>
              {!search && (
                <a href="/dashboard/exercises" className="mt-2 text-xs text-[#cafd00] hover:underline block">
                  Ir a crear ejercicios →
                </a>
              )}
            </div>
          ) : (
            filtered.map((ex) => {
              const isPicked = picked.has(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggle(ex.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    isPicked
                      ? "border-[#cafd00]/30 bg-[#cafd00]/5"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/40">
                    {ex.thumbnail_url ? (
                      <img src={ex.thumbnail_url} alt={ex.name_es} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Dumbbell size={16} className="text-[#494847]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.name_es}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-label-micro">{MUSCLE_LABELS[ex.muscle_group]}</span>
                      <Badge className={cn("text-label-micro border-0 rounded-full px-2", DIFFICULTY_STYLES[ex.difficulty])}>
                        {DIFFICULTY_SHORT[ex.difficulty]}
                      </Badge>
                    </div>
                  </div>

                  {/* Check */}
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                    isPicked ? "border-[#cafd00] bg-[#cafd00]" : "border-white/20"
                  )}>
                    {isPicked && <Check size={13} className="text-[#516700]" strokeWidth={2.5} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={picked.size === 0}
            className="btn-cta flex-1 py-2.5 text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Plus size={15} />
            Añadir {picked.size > 0 ? `${picked.size} ejercicio${picked.size !== 1 ? "s" : ""}` : "ejercicios"}
          </button>
        </div>
      </div>
    </div>
  );
}
