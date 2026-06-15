"use client";

import { useState, useRef } from "react";
import { Plus, Search, Upload, X, Dumbbell, Globe, Lock, Pencil, Trash2, AlertTriangle, Languages } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MuscleGroup, DifficultyLevel } from "@/lib/supabase/types";

interface Exercise {
  id: string;
  name_es: string;
  name_en: string;
  description_es: string | null;
  description_en: string | null;
  muscle_group: MuscleGroup;
  difficulty: DifficultyLevel;
  thumbnail_url: string | null;
  is_global: boolean;
  created_by: string | null;
  created_at: string;
}

type FormState = {
  name_es: string; name_en: string;
  description_es: string; description_en: string;
  muscle_group: MuscleGroup; difficulty: DifficultyLevel;
};

const BLANK_FORM: FormState = {
  name_es: "", name_en: "",
  description_es: "", description_en: "",
  muscle_group: "other",
  difficulty: "intermediate",
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Pecho", back: "Espalda", shoulders: "Hombros",
  biceps: "Bíceps", triceps: "Tríceps", legs: "Piernas",
  glutes: "Glúteos", core: "Core", cardio: "Cardio",
  full_body: "Cuerpo completo", other: "Otro",
};

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  beginner:     "bg-[#cafd00]/10 text-[#cafd00]",
  intermediate: "bg-[#ece856]/10 text-[#ece856]",
  advanced:     "bg-[#ff7351]/10 text-[#ff7351]",
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado",
};

const ALL_MUSCLES: MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "legs", "glutes", "core", "cardio", "full_body", "other",
];

export function ExercisesLibrary({
  exercises: initial,
  trainerId,
}: {
  exercises: Exercise[];
  trainerId: string;
}) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [exercises, setExercises] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | "all">("all");
  const [filterDiff, setFilterDiff] = useState<DifficultyLevel | "all">("all");

  // Modal state
  const [showNew, setShowNew] = useState(false);
  const [preview, setPreview] = useState<Exercise | null>(null);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  // Form state (shared by create & edit)
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [gifPreviewUrl, setGifPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filtered list
  const filtered = exercises.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || e.name_es.toLowerCase().includes(q) || e.name_en.toLowerCase().includes(q);
    const matchesMuscle = filterMuscle === "all" || e.muscle_group === filterMuscle;
    const matchesDiff = filterDiff === "all" || e.difficulty === filterDiff;
    return matchesSearch && matchesMuscle && matchesDiff;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Máximo 10MB"); return; }
    setGifFile(file);
    setGifPreviewUrl(URL.createObjectURL(file));
  };

  // ── Upload helper ──
  async function uploadGif(file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `${trainerId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("exercise-media")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) throw new Error(`Upload: ${error.message}`);
    return supabase.storage.from("exercise-media").getPublicUrl(path).data.publicUrl;
  }

  // ── Create ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_es || !form.name_en) { toast.error("Los nombres ES e EN son obligatorios"); return; }
    setUploading(true);
    try {
      const thumbnail_url = gifFile ? await uploadGif(gifFile) : null;

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          created_by: trainerId,
          name_es: form.name_es,
          name_en: form.name_en,
          description_es: form.description_es || null,
          description_en: form.description_en || null,
          muscle_group: form.muscle_group,
          difficulty: form.difficulty,
          thumbnail_url,
          is_global: true,
        })
        .select("id, name_es, name_en, description_es, description_en, muscle_group, difficulty, thumbnail_url, is_global, created_by, created_at")
        .single();

      if (error) throw new Error(error.message);
      setExercises((prev) => [data as Exercise, ...prev]);
      toast.success(`"${form.name_es}" añadido a tu librería`);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // ── Edit open ──
  const openEdit = (ex: Exercise) => {
    setPreview(null);
    setForm({
      name_es: ex.name_es,
      name_en: ex.name_en,
      description_es: ex.description_es ?? "",
      description_en: ex.description_en ?? "",
      muscle_group: ex.muscle_group,
      difficulty: ex.difficulty,
    });
    setGifFile(null);
    setGifPreviewUrl(ex.thumbnail_url);
    setEditTarget(ex);
  };

  // ── Update ──
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!form.name_es || !form.name_en) { toast.error("Los nombres ES e EN son obligatorios"); return; }
    setUploading(true);
    try {
      // Only upload a new image if a new file was selected
      const thumbnail_url = gifFile
        ? await uploadGif(gifFile)
        : editTarget.thumbnail_url;

      const { data, error } = await supabase
        .from("exercises")
        .update({
          name_es: form.name_es,
          name_en: form.name_en,
          description_es: form.description_es || null,
          description_en: form.description_en || null,
          muscle_group: form.muscle_group,
          difficulty: form.difficulty,
          thumbnail_url,
        })
        .eq("id", editTarget.id)
        .select("id, name_es, name_en, description_es, description_en, muscle_group, difficulty, thumbnail_url, is_global, created_by, created_at")
        .single();

      if (error) throw new Error(error.message);
      setExercises((prev) => prev.map((ex) => ex.id === editTarget.id ? data as Exercise : ex));
      toast.success(`"${form.name_es}" actualizado`);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw new Error(error.message);
      setExercises((prev) => prev.filter((ex) => ex.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.name_es}" eliminado`);
      setDeleteTarget(null);
      setPreview(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setShowNew(false);
    setEditTarget(null);
    setGifFile(null);
    setGifPreviewUrl(null);
    setForm(BLANK_FORM);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 surface-high rounded-xl px-4 py-2.5 border border-white/5 input-neon transition-all w-64">
          <Search size={14} className="text-[#494847] shrink-0" />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-[#494847]"
          />
        </div>

        <select
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value as MuscleGroup | "all")}
          className="bg-[#201f1f] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="all">Todos los músculos</option>
          {ALL_MUSCLES.map((m) => (
            <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>
          ))}
        </select>

        <select
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value as DifficultyLevel | "all")}
          className="bg-[#201f1f] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="all">Todos los niveles</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>

        <div className="ml-auto">
          <button
            onClick={() => setShowNew(true)}
            className="btn-cta flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
          >
            <Plus size={15} />
            Nuevo ejercicio
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex gap-3 mb-6">
        {(["all", ...ALL_MUSCLES] as (MuscleGroup | "all")[]).slice(0, 6).map((m) => {
          const count = m === "all" ? exercises.length : exercises.filter((e) => e.muscle_group === m).length;
          if (m !== "all" && count === 0) return null;
          return (
            <button
              key={m}
              onClick={() => setFilterMuscle(m)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                filterMuscle === m
                  ? "border-[#cafd00]/30 bg-[#cafd00]/10 text-[#cafd00]"
                  : "border-white/5 bg-white/[0.02] text-[#adaaaa] hover:text-white"
              )}
            >
              {m === "all" ? "Todos" : MUSCLE_LABELS[m]} <span className="opacity-60 ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Exercise Grid ── */}
      {filtered.length === 0 ? (
        <div className="surface-high rounded-2xl p-16 text-center border border-white/5">
          <Dumbbell size={32} className="text-[#494847] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {search ? "No se encontraron ejercicios" : "Tu librería está vacía"}
          </p>
          {!search && (
            <button onClick={() => setShowNew(true)} className="mt-4 text-[#cafd00] text-sm hover:underline">
              Añade tu primer ejercicio →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onClick={() => setPreview(ex)}
              onEdit={(e) => { e.stopPropagation(); openEdit(ex); }}
              onDelete={(e) => { e.stopPropagation(); setDeleteTarget(ex); }}
            />
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showNew && (
        <ExerciseFormModal
          mode="create"
          form={form}
          setForm={setForm}
          gifPreviewUrl={gifPreviewUrl}
          fileRef={fileRef}
          uploading={uploading}
          onFileChange={handleFileChange}
          onSubmit={handleCreate}
          onClose={resetForm}
        />
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <ExerciseFormModal
          mode="edit"
          form={form}
          setForm={setForm}
          gifPreviewUrl={gifPreviewUrl}
          fileRef={fileRef}
          uploading={uploading}
          onFileChange={handleFileChange}
          onSubmit={handleUpdate}
          onClose={resetForm}
        />
      )}

      {/* ── Preview Modal ── */}
      {preview && (
        <ExercisePreview
          exercise={preview}
          onClose={() => setPreview(null)}
          onEdit={() => openEdit(preview)}
          onDelete={() => { setDeleteTarget(preview); setPreview(null); }}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          exercise={deleteTarget}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Exercise Card
────────────────────────────────────────── */
function ExerciseCard({
  exercise: ex,
  onClick,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="surface-high rounded-2xl border border-white/5 overflow-hidden cursor-pointer hover:border-[#cafd00]/20 glow-primary-hover transition-all group relative"
    >
      {/* GIF / placeholder */}
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        {ex.thumbnail_url ? (
          <img
            src={ex.thumbnail_url}
            alt={ex.name_es}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell size={28} className="text-[#262626]" strokeWidth={1.5} />
          </div>
        )}
        {/* Visibility badge */}
        <div className="absolute top-2 right-2">
          <div className={cn(
            "p-1.5 rounded-lg backdrop-blur-sm",
            ex.is_global ? "bg-[#cafd00]/20" : "bg-black/40"
          )}>
            {ex.is_global
              ? <Globe size={11} className="text-[#cafd00]" />
              : <Lock size={11} className="text-[#adaaaa]" />
            }
          </div>
        </div>

        {/* Action buttons — visible on hover */}
        <div className="absolute top-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-[#cafd00]/20 text-[#adaaaa] hover:text-[#cafd00] transition-all"
            title="Editar"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm hover:bg-[#ff7351]/20 text-[#adaaaa] hover:text-[#ff7351] transition-all"
            title="Eliminar"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm mb-1 truncate">{ex.name_es}</h3>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {ex.description_es ?? ex.name_en}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-label-micro bg-white/5 px-2 py-1 rounded-lg">
            {MUSCLE_LABELS[ex.muscle_group]}
          </span>
          <Badge className={cn(
            "text-label-micro border-0 rounded-full px-2 py-0.5 ml-auto",
            DIFFICULTY_STYLES[ex.difficulty]
          )}>
            {DIFFICULTY_LABELS[ex.difficulty]}
          </Badge>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Exercise Form Modal (Create & Edit)
────────────────────────────────────────── */
function ExerciseFormModal({
  mode,
  form, setForm, gifPreviewUrl, fileRef, uploading,
  onFileChange, onSubmit, onClose,
}: {
  mode: "create" | "edit";
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  gifPreviewUrl: string | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const isEdit = mode === "edit";
  const [translating, setTranslating] = useState(false);

  const handleAutoTranslate = async () => {
    const textsToTranslate = [form.name_es, form.description_es].filter(Boolean);
    if (textsToTranslate.length === 0) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: textsToTranslate, source: "ES", target: "EN" }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const { translations } = (await res.json()) as { translations: string[] };
      setForm((prev) => ({
        ...prev,
        name_en: form.name_es ? (translations[0] ?? prev.name_en) : prev.name_en,
        description_en: form.description_es
          ? (translations[form.name_es ? 1 : 0] ?? prev.description_en)
          : prev.description_en,
      }));
    } catch {
      // silently ignore — user can still fill manually
    } finally {
      setTranslating(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface-highest rounded-2xl w-full max-w-2xl border border-white/5 glass overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h3 className="font-semibold text-base">
              {isEdit ? "Editar ejercicio" : "Nuevo ejercicio"}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit ? "Modifica los datos del ejercicio" : "Se añadirá a tu librería personal"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-[#adaaaa] transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* GIF Upload */}
          <div>
            <label className="text-label-micro block mb-3">GIF / IMAGEN DEMOSTRATIVA</label>
            <div
              className={cn(
                "relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                gifPreviewUrl
                  ? "border-[#cafd00]/30 bg-transparent"
                  : "border-white/10 bg-white/[0.02] hover:border-[#cafd00]/30 hover:bg-[#cafd00]/5"
              )}
              onClick={() => fileRef.current?.click()}
            >
              {gifPreviewUrl ? (
                <div className="relative aspect-video">
                  <img
                    src={gifPreviewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain bg-black/40"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                    <span className="text-sm text-white font-medium">Cambiar archivo</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-video flex flex-col items-center justify-center gap-3">
                  <div className="p-3 rounded-xl bg-[#cafd00]/10">
                    <Upload size={20} className="text-[#cafd00]" strokeWidth={1.8} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Haz clic para subir</p>
                    <p className="text-xs text-muted-foreground mt-0.5">GIF, PNG, JPG · Máx. 10MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/gif,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {/* Names */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-label-micro">NOMBRES</span>
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={translating || !form.name_es}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-[#cafd00]/30 bg-[#cafd00]/5 text-[#cafd00] text-xs font-medium hover:bg-[#cafd00]/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Languages size={12} />
                {translating ? "Traduciendo..." : "Auto-traducir EN"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                { label: "NOMBRE EN ESPAÑOL", key: "name_es", placeholder: "Ej: Press de banca" },
                { label: "NOMBRE EN INGLÉS",  key: "name_en", placeholder: "Ej: Bench press" },
              ] as { label: string; key: keyof FormState; placeholder: string }[]).map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-2">
                  <label className="text-label-micro">{label}</label>
                  <div className="input-neon rounded-xl border border-white/10 transition-all">
                    <input
                      type="text"
                      value={form[key] as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      required
                      className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#494847]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-4">
            {([
              { label: "DESCRIPCIÓN EN ESPAÑOL", key: "description_es", placeholder: "Cómo ejecutar correctamente el ejercicio..." },
              { label: "DESCRIPCIÓN EN INGLÉS",  key: "description_en", placeholder: "How to correctly perform the exercise..." },
            ] as { label: string; key: keyof FormState; placeholder: string }[]).map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-2">
                <label className="text-label-micro">{label}</label>
                <div className="input-neon rounded-xl border border-white/10 transition-all">
                  <textarea
                    value={form[key] as string}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-[#494847] resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Muscle + Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label-micro">GRUPO MUSCULAR</label>
              <select
                value={form.muscle_group}
                onChange={(e) => setForm((p) => ({ ...p, muscle_group: e.target.value as MuscleGroup }))}
                className="w-full bg-[#201f1f] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white"
              >
                {ALL_MUSCLES.map((m) => (
                  <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-label-micro">NIVEL</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value as DifficultyLevel }))}
                className="w-full bg-[#201f1f] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none text-white"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-all">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="btn-cta flex-1 py-3 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#516700]/40 border-t-[#516700] rounded-full animate-spin" />
                  {isEdit ? "Guardando..." : "Subiendo..."}
                </>
              ) : (
                isEdit ? "Guardar cambios" : "Crear ejercicio"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Exercise Preview Modal
────────────────────────────────────────── */
function ExercisePreview({
  exercise: ex,
  onClose,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative surface-highest rounded-2xl w-full max-w-lg border border-white/5 glass overflow-hidden">
        {/* GIF */}
        <div className="aspect-video bg-black/40 relative">
          {ex.thumbnail_url ? (
            <img src={ex.thumbnail_url} alt={ex.name_es} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Dumbbell size={48} className="text-[#262626]" strokeWidth={1} />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl glass border border-white/10 text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold">{ex.name_es}</h3>
              <p className="text-sm text-muted-foreground">{ex.name_en}</p>
            </div>
            <Badge className={cn("text-label-micro border-0 rounded-full px-3 shrink-0", DIFFICULTY_STYLES[ex.difficulty])}>
              {DIFFICULTY_LABELS[ex.difficulty]}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-label-micro bg-white/5 px-3 py-1.5 rounded-xl">
              {MUSCLE_LABELS[ex.muscle_group]}
            </span>
            {ex.is_global && (
              <span className="text-label-micro bg-[#cafd00]/10 text-[#cafd00] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Globe size={10} /> Global
              </span>
            )}
          </div>

          {(ex.description_es || ex.description_en) && (
            <div className="surface-high rounded-xl p-4 border border-white/5 mb-5">
              <p className="text-label-micro mb-2">DESCRIPCIÓN</p>
              <p className="text-sm text-[#adaaaa] leading-relaxed">{ex.description_es ?? ex.description_en}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 hover:border-[#cafd00]/30 hover:text-[#cafd00] transition-all"
            >
              <Pencil size={14} />
              Editar
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-[#ff7351]/10 hover:border-[#ff7351]/30 hover:text-[#ff7351] transition-all"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Delete Confirm Modal
────────────────────────────────────────── */
function DeleteConfirmModal({
  exercise: ex,
  deleting,
  onConfirm,
  onCancel,
}: {
  exercise: Exercise;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative surface-highest rounded-2xl w-full max-w-sm border border-white/5 glass p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-xl bg-[#ff7351]/10">
            <AlertTriangle size={24} className="text-[#ff7351]" strokeWidth={1.8} />
          </div>
        </div>
        <h3 className="font-semibold text-base mb-1">Eliminar ejercicio</h3>
        <p className="text-sm text-muted-foreground mb-6">
          ¿Seguro que quieres eliminar <span className="text-white font-medium">"{ex.name_es}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-[#ff7351]/20 border border-[#ff7351]/30 text-[#ff7351] text-sm font-semibold hover:bg-[#ff7351]/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-[#ff7351]/40 border-t-[#ff7351] rounded-full animate-spin" />
                Eliminando...
              </>
            ) : (
              "Sí, eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
