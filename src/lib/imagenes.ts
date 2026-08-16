/**
 * VALIDACIÓN EXHAUSTIVA DE IMÁGENES
 * Especificaciones: 500x500px, 50KB-2MB, RGB, 300 DPI
 */

export const ESPECIFICACIONES_IMAGEN = {
  ANCHO_EXACTO: 500,
  ALTO_EXACTO: 500,
  PESO_MAXIMO: 2097152,
  PESO_MINIMO: 51200,
  DPI_MINIMO: 300,
  TOLERANCIA_RATIO: 0.01,
  JPG_CALIDAD: 0.85,
  PNG_COMPRESION: 9,
  MAX_IMAGENES: 3,
} as const;

export const MENSAJES_ERROR = {
  formatoInvalido: "Solo se permiten archivos JPG y PNG",
  muyGrande: (mb: string) => `Archivo demasiado grande. Máximo 2 MB. Tu archivo: ${mb} MB`,
  muyPequeno: (kb: string) => `Archivo muy pequeño. Mínimo 50 KB. Tu archivo: ${kb} KB`,
  dimensionIncorrecta: (w: number, h: number) => `Imagen debe ser 500x500 px. Tu imagen: ${w}x${h} px`,
  noCuadrada: (ratio: string) => `Imagen debe ser cuadrada (1:1). Tu ratio: ${ratio}`,
  escalaGrises: "Imagen debe estar en RGB. Tu imagen está en escala de grises",
  bajaResolucion: (dpi: number) => `Imagen de baja resolución (${dpi} DPI). Recomendamos 300 DPI`,
  imagenVacia: "Imagen parece estar vacía o es un solo color. Usa una foto del producto",
  exito: "Imagen agregada correctamente",
  maxImagenes: (max: number) => `Máximo ${max} imágenes por producto`,
} as const;

export interface ResultadoValidacion {
  valido: boolean;
  error?: string;
  advertencias: string[];
  metadata?: {
    ancho: number;
    alto: number;
    dpi: number;
    colorSpace: string;
    peso: number;
  };
}

export async function validarImagenCompleta(archivo: File): Promise<ResultadoValidacion> {
  const advertencias: string[] = [];

  const extension = archivo.name.toLowerCase().slice(archivo.name.lastIndexOf("."));
  if (![".jpg", ".jpeg", ".png"].includes(extension)) {
    return { valido: false, error: MENSAJES_ERROR.formatoInvalido, advertencias: [] };
  }

  if (!["image/jpeg", "image/png"].includes(archivo.type)) {
    return { valido: false, error: MENSAJES_ERROR.formatoInvalido, advertencias: [] };
  }

  if (archivo.size > ESPECIFICACIONES_IMAGEN.PESO_MAXIMO) {
    const mb = (archivo.size / 1024 / 1024).toFixed(2);
    return { valido: false, error: MENSAJES_ERROR.muyGrande(mb), advertencias: [] };
  }

  if (archivo.size < ESPECIFICACIONES_IMAGEN.PESO_MINIMO) {
    const kb = (archivo.size / 1024).toFixed(2);
    return { valido: false, error: MENSAJES_ERROR.muyPequeno(kb), advertencias: [] };
  }

  let metadata: any;
  try {
    metadata = await obtenerMetadata(archivo);
  } catch {
    return { valido: false, error: "No se pudo leer la imagen", advertencias: [] };
  }

  const { width, height } = metadata;

  if (width !== ESPECIFICACIONES_IMAGEN.ANCHO_EXACTO || height !== ESPECIFICACIONES_IMAGEN.ALTO_EXACTO) {
    return { valido: false, error: MENSAJES_ERROR.dimensionIncorrecta(width, height), advertencias: [] };
  }

  const ratio = width / height;
  if (Math.abs(ratio - 1.0) > ESPECIFICACIONES_IMAGEN.TOLERANCIA_RATIO) {
    return { valido: false, error: MENSAJES_ERROR.noCuadrada(ratio.toFixed(3)), advertencias: [] };
  }

  const dpi = metadata.dpi || 72;
  if (dpi < ESPECIFICACIONES_IMAGEN.DPI_MINIMO) {
    advertencias.push(MENSAJES_ERROR.bajaResolucion(dpi));
  }

  const tieneContenido = await detectarContenidoImagen(archivo);
  if (!tieneContenido) {
    return { valido: false, error: MENSAJES_ERROR.imagenVacia, advertencias: [] };
  }

  const esGrayscale = await detectarGrayscale(archivo);
  if (esGrayscale) {
    return { valido: false, error: MENSAJES_ERROR.escalaGrises, advertencias: [] };
  }

  return {
    valido: true,
    advertencias,
    metadata: { ancho: width, alto: height, dpi, colorSpace: "srgb", peso: archivo.size },
  };
}

async function obtenerMetadata(archivo: File): Promise<{ width: number; height: number; dpi: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight, dpi: 72 });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar"));
    };
    img.src = url;
  });
}

async function detectarContenidoImagen(archivo: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(100, img.width);
      canvas.height = Math.min(100, img.height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const coloresUnicos = new Set<string>();
      for (let i = 0; i < Math.min(400, data.length); i += 4) {
        coloresUnicos.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      }
      URL.revokeObjectURL(url);
      resolve(coloresUnicos.size > 2);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

async function detectarGrayscale(archivo: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(100, img.width);
      canvas.height = Math.min(100, img.height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let pixelesGrises = 0;
      let totalMuestreados = 0;
      for (let i = 0; i < Math.min(400, data.length); i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalMuestreados++;
        if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10) {
          pixelesGrises++;
        }
      }
      URL.revokeObjectURL(url);
      resolve(totalMuestreados > 0 && pixelesGrises / totalMuestreados > 0.95);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

export async function procesarImagenCompleto(archivo: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = ESPECIFICACIONES_IMAGEN.ANCHO_EXACTO;
      canvas.height = ESPECIFICACIONES_IMAGEN.ALTO_EXACTO;
      const ctx = canvas.getContext("2d")!;
      if (archivo.type === "image/jpeg") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Error procesando imagen"));
        },
        archivo.type,
        archivo.type === "image/jpeg" ? ESPECIFICACIONES_IMAGEN.JPG_CALIDAD : undefined
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error cargando imagen"));
    };
    img.src = url;
  });
}
