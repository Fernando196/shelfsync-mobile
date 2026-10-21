// Guarda las fotos originales para subirlas a Marketplace.
export type PreparedPhotos = File[];
export const canSavePhotos = true;

/** Se llama al abrir la hoja: iOS solo permite navigator.share() inmediatamente despues
 * de un toque, sin descargas de por medio, asi que los archivos se bajan antes. */
export async function preparePhotos(urls: string[]): Promise<PreparedPhotos> {
  return Promise.all(
    urls.map(async (url, i) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return new File([blob], `foto-${i + 1}.jpg`, { type: blob.type || 'image/jpeg' });
    }),
  );
}

/** En iPhone abre la hoja de compartir ("Guardar imagenes" las manda a Fotos de una vez);
 * donde no se puede compartir archivos (escritorio) las descarga una por una. */
export async function savePhotos(files: PreparedPhotos): Promise<void> {
  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
    } catch (e: any) {
      if (e?.name !== 'AbortError') throw e;
    }
    return;
  }
  for (const file of files) {
    const href = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = href;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10000);
  }
}
