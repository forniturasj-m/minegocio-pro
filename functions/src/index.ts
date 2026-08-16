import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();

export const generarThumbnails = functions.storage.onObjectFinalized(
  { region: "us-central1", memory: "512MiB", timeoutSeconds: 60 },
  async (event) => {
    const file = event.data;
    if (!file) return;
    if (!file.name.includes("/productos/")) return;
    if (file.name.includes("_thumb_")) return;

    const bucket = storage.bucket(file.bucket);
    const filePath = file.name;

    try {
      const sharp = require("sharp");
      const [buffer] = await bucket.file(filePath).download();

      const esPNG = filePath.toLowerCase().endsWith(".png");
      const extension = esPNG ? "png" : "jpg";
      const tamanos: { [key: string]: number } = { "100": 100, "300": 300, "500": 500 };

      for (const [nombre, dimension] of Object.entries(tamanos)) {
        const thumbPath = filePath.replace(/\.(png|jpg|jpeg)$/i, `_thumb_${nombre}.${extension}`);

        let thumbBuffer: Buffer;
        if (esPNG) {
          thumbBuffer = await sharp(buffer)
            .resize(dimension, dimension, { fit: "cover", position: "center" })
            .png({ compressionLevel: 9 })
            .toBuffer();
        } else {
          thumbBuffer = await sharp(buffer)
            .resize(dimension, dimension, { fit: "cover", position: "center" })
            .jpeg({ quality: 85, progressive: true, mozjpeg: true })
            .toBuffer();
        }

        await bucket.file(thumbPath).save(thumbBuffer, {
          metadata: {
            contentType: `image/${extension}`,
            cacheControl: "public, max-age=31536000",
          },
        });
      }

      console.log(`Thumbnails generados: ${filePath}`);
    } catch (e) {
      console.error("Error generando thumbnails:", e);
    }
  }
);

export const auditoriaCambiosPrecio = functions.firestore.onDocumentCreated(
  { document: "negocios/{negocioId}/historialPrecios/{cambioId}", region: "us-central1" },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const { negocioId } = event.params;

    if (!data.precioNuevo || data.precioNuevo < 0.01 || data.precioNuevo > 9999999.99) {
      console.error(`Precio invalido detectado: ${data.precioNuevo}`);
      await snapshot.ref.delete();
      return;
    }

    if (!data.productoId || !data.usuarioId) {
      await snapshot.ref.delete();
      return;
    }

    await db.collection("auditorias").add({
      tipo: "cambio_precio",
      negocioId,
      productoId: data.productoId,
      usuarioId: data.usuarioId,
      precioAnterior: data.precioAnterior || 0,
      precioNuevo: data.precioNuevo,
      costoAnterior: data.costoAnterior || 0,
      costoNuevo: data.costoNuevo || 0,
      cambioPorcentaje: data.cambioPorcentaje || 0,
      motivo: data.motivo || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

export const congelarPrecioEnVenta = functions.firestore.onDocumentCreated(
  { document: "negocios/{negocioId}/transacciones/{transaccionId}", region: "us-central1", timeoutSeconds: 60 },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.data();
    const { negocioId, transaccionId } = event.params;

    if (data.tipo !== "venta" || !data.items || !Array.isArray(data.items)) return;

    try {
      await db.runTransaction(async (tx) => {
        const itemsActualizados: any[] = [];
        let montoTotal = 0;

        for (const item of data.items) {
          const productoRef = db
            .collection("negocios").doc(negocioId)
            .collection("productos").doc(item.productoId);

          const productoSnap = await tx.get(productoRef);
          if (!productoSnap.exists) {
            throw new Error(`Producto ${item.productoId} no existe`);
          }

          const producto = productoSnap.data()!;

          if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
            throw new Error(`Cantidad invalida: ${item.cantidad}`);
          }

          const stockActual = producto.cantidadDisponible || 0;
          if (item.cantidad > stockActual) {
            throw new Error(`Stock insuficiente para "${producto.nombre}"`);
          }

          const precioCongelado = producto.precioVenta;
          const costoCongelado = producto.costoRealUnitario || producto.costoUnitario;
          const subtotal = item.cantidad * precioCongelado;

          itemsActualizados.push({
            ...item,
            precioUnitarioMomentoVenta: precioCongelado,
            costoUnitarioMomentoVenta: costoCongelado,
            subtotal,
            nombreProducto: producto.nombre,
          });

          montoTotal += subtotal;

          tx.update(productoRef, {
            cantidadDisponible: stockActual - item.cantidad,
            actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
          });

          const movimientoRef = db
            .collection("negocios").doc(negocioId)
            .collection("movimientosStock").doc();

          tx.set(movimientoRef, {
            productoId: item.productoId,
            tipo: "VENTA",
            cantidad: -item.cantidad,
            stockAnterior: stockActual,
            stockNuevo: stockActual - item.cantidad,
            referencia: transaccionId,
            creadoEn: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        tx.update(snapshot.ref, {
          items: itemsActualizados,
          montoTotal,
          estado: "completada",
          preciosCongeladosEn: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    } catch (e: any) {
      console.error("Error congelando precios:", e);
      try {
        await snapshot.ref.update({
          estado: "error",
          errorMensaje: e.message || "Error desconocido",
        });
      } catch (updateError) {
        console.error("Error marcando transaccion con error:", updateError);
      }
    }
  }
);

export const backupSemanal = functions.scheduler.onSchedule(
  { schedule: "0 3 * * 0", timeZone: "America/Bogota", region: "us-central1" },
  async () => {
    const timestamp = new Date().toISOString().split("T")[0];

    try {
      const bucket = storage.bucket();
      const subcolecciones = [
        "productos", "transacciones", "historialPrecios",
        "costosOperativos", "clientes", "proveedores",
        "categorias", "movimientosStock",
      ];

      const negociosSnap = await db.collection("negocios").get();
      const backupData: any = {
        version: "v3",
        timestamp,
        totalNegocios: negociosSnap.size,
        negocios: [],
      };

      for (const negocioDoc of negociosSnap.docs) {
        const negocioId = negocioDoc.id;
        const negocioData: any = {
          id: negocioId,
          datos: negocioDoc.data(),
          subcolecciones: {} as any,
        };

        for (const subcol of subcolecciones) {
          try {
            const subSnap = await db
              .collection("negocios").doc(negocioId)
              .collection(subcol)
              .limit(1000)
              .get();
            negocioData.subcolecciones[subcol] = subSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
          } catch (e) {
            negocioData.subcolecciones[subcol] = [];
          }
        }

        backupData.negocios.push(negocioData);
      }

      await bucket
        .file(`backups/${timestamp}/backup_completo.json`)
        .save(JSON.stringify(backupData), {
          metadata: { contentType: "application/json" },
        });

      console.log(`Backup completado: ${negociosSnap.size} negocios`);
    } catch (e) {
      console.error("Error en backup:", e);
    }
  }
);

export const limpiezaDatosTemporales = functions.scheduler.onSchedule(
  { schedule: "0 2 * * *", timeZone: "America/Bogota", region: "us-central1" },
  async () => {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    try {
      const canceladas = await db
        .collectionGroup("transacciones")
        .where("estado", "==", "cancelada")
        .limit(500)
        .get();

      if (canceladas.size > 0) {
        const batch = db.batch();
        canceladas.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        console.log(`${canceladas.size} transacciones canceladas eliminadas`);
      }
    } catch (e) {
      console.error("Error en limpieza:", e);
    }
  }
);
