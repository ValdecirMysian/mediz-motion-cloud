import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    // Tenta usar as credenciais padrão AWS, senão usa as do Remotion (que sabemos que existem)
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.REMOTION_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.REMOTION_AWS_SECRET_ACCESS_KEY || "",
  },
});

// Tenta pegar o bucket da env var padrão, ou hardcoded do Remotion (fallback seguro)
export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "remotionlambda-useast1-f6gpclay1c";

