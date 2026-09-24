import { Suspense } from "react";
import StudySession from "@/components/StudySession";

export default function StudyPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Cargando...</p>}>
      <StudySession />
    </Suspense>
  );
}
