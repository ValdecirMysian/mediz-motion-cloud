import { NextRequest, NextResponse } from 'next/server';
import { renderMediaOnLambda, speculateFunctionName } from '@remotion/lambda/client';
import { DISK, RAM, REGION, SITE_NAME, TIMEOUT } from '@/lib/config';

// ----------------------------------------------------------------------------
// NOTA: Agora o upload de imagens é feito no CLIENTE (frontend) via /api/upload-url.
// Este endpoint recebe apenas URLs já prontas, então não precisamos mais do S3Client aqui.
// ----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // Verificação se o body é um JSON válido antes de fazer parse
    let body;
    try {
      const rawBody = await req.text();
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('❌ Invalid JSON Body:', e);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    let { template, dados } = body;

    if (!template || !dados) {
      return NextResponse.json({ error: 'Missing template or dados' }, { status: 400 });
    }

    console.log('🚀 Iniciando processo via AWS Lambda...');
    
    // (Opcional) Verificação de segurança: garantir que não há Base64 gigante aqui
    // Se houver, logamos um aviso, mas tentamos prosseguir (ou falhará na Lambda por tamanho)
    
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
