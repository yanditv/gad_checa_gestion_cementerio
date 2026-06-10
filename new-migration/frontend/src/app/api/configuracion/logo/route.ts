import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { message: 'No se recibió ningún archivo (campo "file")' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Definir la ruta de guardado en el directorio public/uploads del frontend
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Preservar la extensión original del archivo (ej. .png, .jpg)
    const ext = path.extname(file.name) || '.png';
    const filename = `logo_gad_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const logoUrl = `/uploads/${filename}`;
    return NextResponse.json({ logoUrl });
  } catch (error: any) {
    console.error('Error al subir el logo:', error);
    return NextResponse.json(
      { message: `Error interno al guardar la imagen: ${error.message}` },
      { status: 500 },
    );
  }
}
