import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { template, dados } = body;

    if (!template || !dados) {
      return NextResponse.json(
        { error: 'Missing template or dados' },
        { status: 400 }
      );
    }

    console.log('🎬 Starting render process...');

    // 1. Bundle the Remotion project
    // In production/serverless, you might want to pre-bundle or cache this.
    // For local/VPS, bundling on request is okay but adds delay.
    const entryPoint = path.join(process.cwd(), 'src/remotion/index.ts');
    
    console.log('📦 Bundling...', entryPoint);
    const bundleLocation = await bundle({
      entryPoint,
      // If you are in a serverless environment, you might need extra config here
      // webpackOverride: (config) => config,
    });

    // 2. Select the composition
    const compositionId = 'MedizMotionTeste';
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps: {
        template,
        dados,
      },
    });

    if (!composition) {
      return NextResponse.json(
        { error: `Composition ${compositionId} not found` },
        { status: 404 }
      );
    }

    // 3. Define output path
    const fileName = `video-${Date.now()}.mp4`;
    const outputDir = path.join(process.cwd(), 'public', 'renders');
    
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, fileName);

    console.log('🎥 Rendering to:', outputPath);

    // 4. Render the video
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        template,
        dados,
      },
      // You can adjust concurrency/memory here
    });

    console.log('✅ Render complete!');

    // 5. Return the URL
    // Assuming the app is served at root. Adjust if served under a subpath.
    const publicUrl = `/renders/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });

  } catch (error: any) {
    console.error('❌ Render error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to render video',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
