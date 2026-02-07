import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/s3';

// Essa rota age como um Proxy para uploads
// Ela recebe o arquivo em base64 (em pedaços se necessário, mas aqui simplificado)
// e faz o upload para o S3 usando as credenciais do servidor.
// Isso evita problemas de CORS no navegador.

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType, content } = await req.json();

    if (!content || !filename) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Decodifica Base64
    // Formato esperado: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    const base64Data = content.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Gera nome único
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/${Date.now()}-${cleanFilename}`;

    console.log(`🔄 Proxy Upload: Iniciando upload de ${filename} (${buffer.length} bytes) para S3...`);

    // Faz o upload direto do servidor (Server-to-Server não tem CORS)
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read' // Tenta tornar público
    }));

    const region = process.env.AWS_REGION || 'us-east-1';
    const publicUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;

    console.log('✅ Proxy Upload: Sucesso!', publicUrl);

    return NextResponse.json({
      success: true,
      publicUrl
    });

  } catch (error: any) {
    console.error('❌ Erro no Proxy Upload:', error);
    return NextResponse.json({ 
      error: 'Falha no upload via proxy', 
      details: error.message 
    }, { status: 500 });
  }
}
