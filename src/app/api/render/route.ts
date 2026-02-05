import { NextRequest, NextResponse } from 'next/server';
import { renderMediaOnLambda, speculateFunctionName } from '@remotion/lambda/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DISK, RAM, REGION, SITE_NAME, TIMEOUT } from '@/lib/config';

// Configuração do cliente S3
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY || '',
  },
});

// Nome do bucket (hardcoded pelo deploy ou pode vir de env)
// Dica: Use o mesmo nome que apareceu no 'npm run deploy'
const BUCKET_NAME = 'remotionlambda-useast1-f6gpclay1c'; 

// Helper: Upload de Base64 para S3
async function uploadBase64ToS3(base64Data: string, folder: string): Promise<string> {
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64Data; // Não é base64 ou inválido
  }

  const type = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  
  let ext = 'bin';
  if (type.includes('image/png')) ext = 'png';
  else if (type.includes('image/jpeg')) ext = 'jpg';
  else if (type.includes('video/mp4')) ext = 'mp4';

  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: type,
    ACL: 'public-read', // Opcional, dependendo da config do bucket
  }));

  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${filename}`;
}

// Helper: Percorre o objeto recursivamente e faz upload de tudo que for Base64
async function processAssets(obj: any): Promise<any> {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => processAssets(item)));
  }
  if (typeof obj === 'object') {
    const newObj: any = { ...obj };
    for (const key in newObj) {
      const value = newObj[key];
      if (typeof value === 'string' && value.startsWith('data:')) {
        console.log(`📤 Uploading asset for key: ${key}`);
        newObj[key] = await uploadBase64ToS3(value, 'uploads');
      } else if (typeof value === 'object') {
        newObj[key] = await processAssets(value);
      }
    }
    return newObj;
  }
  return obj;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { template, dados } = body;

    if (!template || !dados) {
      return NextResponse.json({ error: 'Missing template or dados' }, { status: 400 });
    }

    console.log('🚀 Iniciando processo via AWS Lambda...');

    // 1. Upload de Assets (Base64 -> S3)
    // Isso transforma imagens locais em URLs públicas que a Lambda consegue acessar
    console.log('☁️ Enviando assets para o S3...');
    template = await processAssets(template);
    dados = await processAssets(dados);

    // 2. Acionar Renderização na Lambda
    console.log('⚡ Invocando Lambda...');
    
    const { renderId, bucketName } = await renderMediaOnLambda({
      region: REGION,
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      serveUrl: SITE_NAME,
      composition: 'MedizMotionTeste',
      inputProps: {
        template,
        dados,
      },
      codec: 'h264',
    });

    console.log(`✅ Renderização iniciada! ID: ${renderId}`);

    return NextResponse.json({
      success: true,
      renderId,
      bucketName,
      message: 'Renderização iniciada na nuvem. Verifique o status.'
    });

  } catch (error: any) {
    console.error('❌ Erro na Lambda:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start cloud render',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
