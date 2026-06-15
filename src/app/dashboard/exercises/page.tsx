import { createClient } from "@/lib/supabase/server";
import { ExercisesLibrary } from "@/components/exercises/exercises-library";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name_es, name_en, description_es, description_en, muscle_group, difficulty, thumbnail_url, is_global, created_by, created_at")
    .or(`is_global.eq.true,created_by.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-label-micro mb-1">BIBLIOTECA</p>
        <h1 className="text-3xl font-bold tracking-tight">Ejercicios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {exercises?.length ?? 0} ejercicios disponibles · Base de tu librería de rutinas
        </p>
      </div>
      <ExercisesLibrary exercises={exercises ?? []} trainerId={user.id} />
    </div>
  );
}
