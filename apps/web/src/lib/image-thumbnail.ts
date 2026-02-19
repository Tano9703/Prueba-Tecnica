const DEFAULT_MAX_DIMENSION = 320;
const DEFAULT_MAX_BYTES = 90 * 1024;

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("No se pudo leer el archivo."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function renderJpeg(image: HTMLImageElement, width: number, height: number, quality: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar la miniatura.");
  }
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function createThumbnailDataUrl(file: File, maxDimension = DEFAULT_MAX_DIMENSION, maxBytes = DEFAULT_MAX_BYTES) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(originalDataUrl);
  const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));

  let width = Math.max(1, Math.round(image.width * ratio));
  let height = Math.max(1, Math.round(image.height * ratio));
  let quality = 0.85;
  let output = renderJpeg(image, width, height, quality);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (estimateDataUrlBytes(output) <= maxBytes) {
      return output;
    }

    if (quality > 0.55) {
      quality -= 0.1;
    } else {
      width = Math.max(96, Math.round(width * 0.85));
      height = Math.max(96, Math.round(height * 0.85));
    }

    output = renderJpeg(image, width, height, quality);
  }

  throw new Error("La imagen es demasiado pesada. Usa una imagen más liviana.");
}
