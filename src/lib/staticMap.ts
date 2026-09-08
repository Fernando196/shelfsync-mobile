// Minimapa liviano sin API key: calculamos los tiles de OpenStreetMap que
// rodean una coordenada y los mostramos en un mosaico con un pin centrado.
// Evita depender de react-native-maps (requiere config nativa + API key de
// Google Maps) solo para una vista previa de ubicacion.
export interface TileRef {
  x: number;
  y: number;
  z: number;
}

function lon2tileX(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

// Sube este valor si vuelves a tocar como se piden los tiles: cambia la URL
// (misma imagen, distinta cache key), asi cualquier tile "blocked" que haya
// quedado en la cache de <Image> de antes del fix de User-Agent se descarta
// y se vuelve a pedir de cero en vez de servirse desde cache.
const TILE_CACHE_BUST = "v2";

export function tileUrl({ x, y, z }: TileRef): string {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png?src=${TILE_CACHE_BUST}`;
}

// La politica de uso de tile.openstreetmap.org bloquea activamente
// peticiones sin un User-Agent que identifique la app (sirven de vuelta un
// tile "blocked" en vez del mapa) - por defecto <Image> de React Native no
// manda uno propio. Con esto se identifica la app como pide OSM.
// https://operations.osmfoundation.org/policies/tiles/
const TILE_USER_AGENT = "MP210Inventario/1.0 (uso interno de bodega, sin fines comerciales)";

/** Fuente lista para <Image source={...} /> de expo-image: URL del tile + el
 * header que evita el bloqueo. Se uso expo-image en vez del <Image> nucleo de
 * React Native porque en Android el soporte de `source.headers` de ese
 * ultimo es historicamente poco confiable (lo llega a ignorar en ciertas
 * versiones/backends de carga de imagen) - expo-image si lo manda siempre. */
export function tileSource(tile: TileRef): { uri: string; headers: Record<string, string> } {
  return { uri: tileUrl(tile), headers: { "User-Agent": TILE_USER_AGENT } };
}

/** Devuelve una cuadricula de `size`x`size` tiles centrada en lat/lng. */
export function centeredTileGrid(lat: number, lng: number, zoom = 16, size = 3): TileRef[][] {
  const cx = lon2tileX(lng, zoom);
  const cy = lat2tileY(lat, zoom);
  const half = Math.floor(size / 2);
  const grid: TileRef[][] = [];
  for (let row = -half; row <= half; row++) {
    const rowTiles: TileRef[] = [];
    for (let col = -half; col <= half; col++) {
      rowTiles.push({ x: cx + col, y: cy + row, z: zoom });
    }
    grid.push(rowTiles);
  }
  return grid;
}
