import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

// Borra del storage las imágenes que ya no use ninguna tarjeta. Pensado para
// usar DESPUÉS de borrar las tarjetas de la DB (no excluye ningún id, porque
// esas tarjetas ya no existen).
export async function cleanupOrphanedBlobs(urls: (string | null | undefined)[]) {
  const unique = [...new Set(urls.filter((u): u is string => Boolean(u)))];
  await Promise.all(
    unique.map(async (url) => {
      const stillUsed = await prisma.card.count({
        where: { OR: [{ frontImageUrl: url }, { backImageUrl: url }] },
      });
      if (stillUsed > 0) return;
      try {
        await del(url);
      } catch {
        // La imagen puede no existir más o el storage no estar configurado
        // (p. ej. en desarrollo local); no bloquea la operación principal.
      }
    })
  );
}
