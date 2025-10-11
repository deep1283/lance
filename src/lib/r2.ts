import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

// Cloudflare R2 configuration
const ACCOUNT_ID =
  process.env.CLOUDFLARE_R2_ACCOUNT_ID || "7b96a1c0558ba969c53c33c33f63f1b7";
const BUCKET_NAME = "lanceiq-ads";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: false, // Use virtual-hosted-style URLs
});

// Helper to generate public URL for R2 objects
export const getR2PublicUrl = (key: string) => {
  return `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`;
};

// Upload image/video to R2
export const uploadToR2 = async (
  file: File | Buffer,
  fileName: string,
  contentType: string
): Promise<string> => {
  const key = `ads/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: "public-read",
  });

  try {
    await r2Client.send(command);
    return getR2PublicUrl(key);
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};

// Get object from R2
export const getFromR2 = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const response = await r2Client.send(command);
    return response.Body;
  } catch (error) {
    console.error("Error getting from R2:", error);
    throw error;
  }
};
