import { NextRequest, NextResponse } from 'next/server';
import { getRenderProgress, speculateFunctionName } from '@remotion/lambda/client';
import { REGION, DISK, RAM, TIMEOUT } from '@/lib/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { renderId, bucketName } = body;

    if (!renderId || !bucketName) {
      return NextResponse.json({ error: 'Missing renderId or bucketName' }, { status: 400 });
    }

    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: REGION,
    });

    if (progress.fatalErrorEncountered) {
      return NextResponse.json({
        type: 'error',
        message: progress.errors[0]?.message || 'Unknown error',
        logs: progress.errors[0]?.stack
      });
    }

    if (progress.done) {
      return NextResponse.json({
        type: 'done',
        url: progress.outputFile,
        size: progress.outputSizeInBytes
      });
    }

    return NextResponse.json({
      type: 'progress',
      progress: progress.overallProgress
    });

  } catch (error: any) {
    console.error('Check status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}