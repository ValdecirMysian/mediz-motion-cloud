import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!BUCKET_NAME) {
      return NextResponse.json(
        { error: 'AWS_BUCKET_NAME não está configurado nas variáveis de ambiente' },
        { status: 500 }
      );
    }

    // Create unique filename to avoid collisions
    // uploads/timestamp-clean_filename
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `uploads/${Date.now()}-${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
      // Note: We are not setting ACL='public-read' here because many buckets block ACLs.
      // Ensure your bucket policy allows public read for 'uploads/*' or use CloudFront.
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // 10 minutes
    
    // Construct URL
    const region = process.env.AWS_REGION || 'us-east-1';
    // Standard S3 URL format
    const publicUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${uniqueFilename}`;

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key: uniqueFilename
    });

  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
