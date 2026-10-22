import fs from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env, isS3Configured } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { randomToken } from '../utils/tokens.js';

const ALLOWED = new Map<string, string>([
  ['application/pdf', 'pdf'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
]);

export function sniffMime(buffer: Buffer): string | null {
  if (buffer.subarray(0, 4).toString() === '%PDF') return 'application/pdf';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(png)) return 'image/png';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return null;
}

export function assertAllowedFile(buffer: Buffer, declared: string): string {
  if (!ALLOWED.has(declared)) throw new AppError(400, 'Upload a PDF, JPG, PNG, WEBP, or DOCX file', 'FILE_TYPE');
  const sniffed = sniffMime(buffer);
  if (!sniffed || sniffed !== declared) throw new AppError(400, 'The file contents do not match its type', 'FILE_TYPE');
  if (buffer.length > 8 * 1024 * 1024) throw new AppError(400, 'Files must be 8 MB or smaller', 'FILE_SIZE');
  return sniffed;
}

function safeKey(filename: string, mime: string): string {
  const ext = ALLOWED.get(mime) || 'bin';
  const base = filename.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 40);
  return `${new Date().getFullYear()}/${randomToken(16)}-${base || 'file'}.${ext}`;
}

function localRoot(): string {
  return path.resolve(process.cwd(), env.STORAGE_PATH);
}

function localPath(visibility: 'public' | 'private', key: string): string {
  const root = path.resolve(localRoot(), visibility);
  const target = path.resolve(root, key);
  if (!target.startsWith(root)) throw new AppError(400, 'Invalid file path', 'FILE_PATH');
  return target;
}

function s3(): S3Client {
  if (!isS3Configured) throw new AppError(500, 'Object storage is not configured', 'STORAGE');
  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  });
}

export async function saveFile(input: { buffer: Buffer; filename: string; mime: string; visibility: 'public' | 'private' }): Promise<string> {
  const mime = assertAllowedFile(input.buffer, input.mime);
  const key = safeKey(input.filename, mime);
  if (env.STORAGE_DRIVER === 's3') {
    await s3().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: `${input.visibility}/${key}`,
        Body: input.buffer,
        ContentType: mime,
      }),
    );
    return key;
  }
  const target = localPath(input.visibility, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, input.buffer);
  return key;
}

export async function readFile(key: string, visibility: 'public' | 'private'): Promise<Buffer> {
  if (key.includes('..')) throw new AppError(400, 'Invalid file path', 'FILE_PATH');
  if (env.STORAGE_DRIVER === 's3') {
    const result = await s3().send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: `${visibility}/${key}` }));
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) throw new AppError(404, 'File not found', 'NOT_FOUND');
    return Buffer.from(bytes);
  }
  return fs.readFile(localPath(visibility, key));
}

export async function signedDownload(key: string, visibility: 'public' | 'private'): Promise<string | null> {
  if (env.STORAGE_DRIVER !== 's3') return null;
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: `${visibility}/${key}` }), { expiresIn: 120 });
}

export async function scanBuffer(buffer: Buffer, filename: string): Promise<'not_scanned' | 'clean' | 'infected' | 'scan_failed'> {
  if (!env.MALWARE_SCAN_URL) return 'not_scanned';
  try {
    const response = await fetch(env.MALWARE_SCAN_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/octet-stream',
        'x-filename': filename,
        authorization: `Bearer ${env.MALWARE_SCAN_TOKEN}`,
      },
      body: new Uint8Array(buffer),
    });
    if (!response.ok) return 'scan_failed';
    const data = (await response.json()) as { infected?: boolean };
    return data.infected ? 'infected' : 'clean';
  } catch {
    return 'scan_failed';
  }
}
