// Utilidades de bytes sin depender de Buffer (no existe nativamente en React Native).

/** Codifica un string a bytes UTF-8, a mano. */
export function utf8Bytes(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.codePointAt(i)!;
    if (code > 0xffff) i++; // era un par subrogado, ya se consumio con codePointAt
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      out.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return out;
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Convierte un arreglo de bytes (0-255) a un string base64, a mano. */
export function bytesToBase64(bytes: number[]): string {
  let result = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];

    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 0x03) << 4) | (b2 === undefined ? 0 : b2 >> 4);
    const enc3 = b2 === undefined ? 64 : ((b2 & 0x0f) << 2) | (b3 === undefined ? 0 : b3 >> 6);
    const enc4 = b3 === undefined ? 64 : b3 & 0x3f;

    result +=
      BASE64_CHARS.charAt(enc1) +
      BASE64_CHARS.charAt(enc2) +
      (enc3 === 64 ? "=" : BASE64_CHARS.charAt(enc3)) +
      (enc4 === 64 ? "=" : BASE64_CHARS.charAt(enc4));
  }
  return result;
}

/** Parte un arreglo de bytes en trozos de tamano fijo (para respetar el MTU de BLE). */
export function chunkBytes(bytes: number[], size: number): number[][] {
  const chunks: number[][] = [];
  for (let i = 0; i < bytes.length; i += size) {
    chunks.push(bytes.slice(i, i + size));
  }
  return chunks;
}
