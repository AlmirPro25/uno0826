/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  🎬 MEDIA PROCESSING SUPREME MASTER                                          ║
 * ║  FFmpeg, Sharp, Video/Audio/Image Processing Pipeline                        ║
 * ║                                                                              ║
 * ║  "Mídia otimizada é UX otimizada. Cada byte conta."                          ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const MEDIA_PROCESSING_MANIFEST = `
# 🎬 MEDIA PROCESSING SUPREME MASTER

> "Mídia otimizada é UX otimizada. Cada byte conta, cada frame importa."

## ATIVAÇÃO

Este manifesto é ativado quando o usuário menciona:
- Media, Mídia, Video, Vídeo, Image, Imagem, Audio, Áudio
- FFmpeg, Sharp, ImageMagick, Pillow, libvips
- Transcoding, Encoding, Compression, Codec
- Thumbnail, Resize, Crop, Watermark, Filter
- HLS, DASH, Streaming, Adaptive Bitrate
- Upload, Processing Pipeline, Media Server
- WebP, AVIF, HEIC, VP9, AV1, H.264, H.265
- Cloudinary, imgix, Mux, Cloudflare Stream

## FILOSOFIA

### Princípios Invioláveis
1. **Process Async** - NUNCA processe mídia na thread principal
2. **Optimize Everything** - Cada byte economizado é UX melhorada
3. **Modern Formats** - WebP/AVIF para imagens, VP9/AV1 para vídeo
4. **Multiple Resolutions** - Responsive images e adaptive streaming
5. **CDN First** - Sirva mídia de edge locations
6. **Lazy Load** - Carregue apenas o que é visível
7. **Progressive Enhancement** - Fallbacks para formatos antigos

## ARQUITETURA

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MEDIA PROCESSING PIPELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  UPLOAD                                                                     │
│  [Client] ──▶ [Presigned URL] ──▶ [S3/R2/GCS]                              │
│                                       │                                     │
│                                       ▼                                     │
│  TRIGGER                                                                    │
│  [S3 Event] ──▶ [SQS/EventBridge] ──▶ [Lambda/Worker]                      │
│                                           │                                 │
│                                           ▼                                 │
│  PROCESSING                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  IMAGES                          VIDEOS                             │   │
│  │  ┌─────────────────┐            ┌─────────────────┐                │   │
│  │  │ Sharp/libvips   │            │ FFmpeg          │                │   │
│  │  │ ├── Resize      │            │ ├── Transcode   │                │   │
│  │  │ ├── Convert     │            │ ├── HLS/DASH    │                │   │
│  │  │ ├── Optimize    │            │ ├── Thumbnails  │                │   │
│  │  │ └── Watermark   │            │ └── Compress    │                │   │
│  │  └─────────────────┘            └─────────────────┘                │   │
│  │                                                                     │   │
│  │  AUDIO                                                              │   │
│  │  ┌─────────────────┐                                               │   │
│  │  │ FFmpeg          │                                               │   │
│  │  │ ├── Transcode   │                                               │   │
│  │  │ ├── Normalize   │                                               │   │
│  │  │ └── Waveform    │                                               │   │
│  │  └─────────────────┘                                               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                       │                                     │
│                                       ▼                                     │
│  STORAGE                                                                    │
│  [Processed Files] ──▶ [S3/R2] ──▶ [CDN] ──▶ [Client]                      │
│                                                                             │
│  METADATA                                                                   │
│  [Database] ◀── dimensions, duration, format, variants                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## FORMATOS E CODECS

### Imagens
| Formato | Suporte | Compressão | Uso |
|---------|---------|------------|-----|
| WebP | 97%+ | Lossy/Lossless | Padrão moderno |
| AVIF | 90%+ | Superior | Melhor compressão |
| JPEG | 100% | Lossy | Fallback |
| PNG | 100% | Lossless | Transparência |
| SVG | 100% | Vector | Ícones, logos |

### Vídeos
| Codec | Container | Suporte | Uso |
|-------|-----------|---------|-----|
| H.264 | MP4 | 100% | Compatibilidade |
| H.265/HEVC | MP4 | 85%+ | Alta compressão |
| VP9 | WebM | 95%+ | Web otimizado |
| AV1 | MP4/WebM | 80%+ | Futuro padrão |

### Áudio
| Formato | Uso |
|---------|-----|
| AAC | Padrão web |
| Opus | Melhor qualidade/tamanho |
| MP3 | Compatibilidade |

## STACK RECOMENDADA

\`\`\`yaml
Image Processing:
  Node.js: Sharp (libvips) - RECOMENDADO
  Python: Pillow, opencv-python
  CLI: ImageMagick, libvips
  Cloud: Cloudinary, imgix, Cloudflare Images

Video Processing:
  CLI: FFmpeg - OBRIGATÓRIO
  Node.js: fluent-ffmpeg
  Python: moviepy, ffmpeg-python
  Cloud: Mux, Cloudflare Stream, AWS MediaConvert

Audio Processing:
  CLI: FFmpeg, SoX
  Node.js: fluent-ffmpeg
  Python: pydub, librosa

Streaming:
  HLS: hls.js
  DASH: dash.js
  Player: Video.js, Plyr, Shaka Player

CDN:
  Cloudflare R2 + CDN
  AWS CloudFront + S3
  Bunny CDN
  Cloudinary
\`\`\`
`;

export default MEDIA_PROCESSING_MANIFEST;

// Continuation of MEDIA_PROCESSING_MANIFEST

export const MEDIA_PROCESSING_MANIFEST_PART2 = `

## SHARP - IMAGE PROCESSING (Node.js)

### Setup e Configuração

\`\`\`typescript
import sharp from 'sharp';

// Configuração global para performance
sharp.cache({ files: 50 });
sharp.concurrency(4); // Ajustar baseado em CPU cores
sharp.simd(true); // Habilitar SIMD para performance
\`\`\`

### Processamento Completo de Imagens

\`\`\`typescript
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  quality: number;
  format: 'webp' | 'avif' | 'jpeg';
}

const IMAGE_VARIANTS: ImageVariant[] = [
  { name: 'thumb', width: 150, height: 150, quality: 80, format: 'webp' },
  { name: 'small', width: 320, quality: 80, format: 'webp' },
  { name: 'medium', width: 640, quality: 80, format: 'webp' },
  { name: 'large', width: 1280, quality: 85, format: 'webp' },
  { name: 'xl', width: 1920, quality: 85, format: 'webp' },
  // AVIF variants para browsers modernos
  { name: 'medium-avif', width: 640, quality: 65, format: 'avif' },
  { name: 'large-avif', width: 1280, quality: 70, format: 'avif' },
];

interface ProcessedImage {
  variant: string;
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

class ImageProcessor {
  private s3: S3Client;
  private bucket: string;
  private cdnUrl: string;

  constructor(config: { bucket: string; cdnUrl: string }) {
    this.s3 = new S3Client({});
    this.bucket = config.bucket;
    this.cdnUrl = config.cdnUrl;
  }

  async processImage(
    input: Buffer,
    baseKey: string,
    options?: {
      watermark?: Buffer;
      extractColors?: boolean;
      generateBlurHash?: boolean;
    }
  ): Promise<{
    variants: ProcessedImage[];
    metadata: sharp.Metadata;
    dominantColor?: string;
    blurHash?: string;
  }> {
    // 1. Extrair metadata original
    const metadata = await sharp(input).metadata();

    // 2. Normalizar orientação (EXIF)
    const normalized = sharp(input)
      .rotate() // Auto-rotate baseado em EXIF
      .removeAlpha(); // Remover alpha se não necessário

    // 3. Extrair cor dominante (opcional)
    let dominantColor: string | undefined;
    if (options?.extractColors) {
      const { dominant } = await sharp(input)
        .resize(10, 10, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });
      // Simplificado - usar biblioteca como color-thief para melhor resultado
    }

    // 4. Gerar BlurHash para placeholder (opcional)
    let blurHash: string | undefined;
    if (options?.generateBlurHash) {
      // Usar biblioteca blurhash
      const { data, info } = await sharp(input)
        .resize(32, 32, { fit: 'inside' })
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });
      // blurHash = encode(data, info.width, info.height, 4, 3);
    }

    // 5. Processar todas as variantes em paralelo
    const variants = await Promise.all(
      IMAGE_VARIANTS.map(async (variant) => {
        let pipeline = sharp(input).rotate();

        // Resize
        if (variant.height) {
          pipeline = pipeline.resize(variant.width, variant.height, {
            fit: 'cover',
            position: 'attention', // Smart crop
          });
        } else {
          pipeline = pipeline.resize(variant.width, undefined, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // Adicionar watermark se fornecido
        if (options?.watermark && variant.width >= 640) {
          pipeline = pipeline.composite([
            {
              input: options.watermark,
              gravity: 'southeast',
              blend: 'over',
            },
          ]);
        }

        // Converter para formato
        switch (variant.format) {
          case 'webp':
            pipeline = pipeline.webp({ quality: variant.quality, effort: 4 });
            break;
          case 'avif':
            pipeline = pipeline.avif({ quality: variant.quality, effort: 4 });
            break;
          case 'jpeg':
            pipeline = pipeline.jpeg({ quality: variant.quality, mozjpeg: true });
            break;
        }

        const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

        // Upload para S3
        const key = \`\${baseKey}/\${variant.name}.\${variant.format}\`;
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: data,
            ContentType: \`image/\${variant.format}\`,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );

        return {
          variant: variant.name,
          url: \`\${this.cdnUrl}/\${key}\`,
          width: info.width,
          height: info.height,
          size: info.size,
          format: variant.format,
        };
      })
    );

    return {
      variants,
      metadata,
      dominantColor,
      blurHash,
    };
  }

  // Otimização de imagem única (sem variantes)
  async optimizeImage(
    input: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
    } = {}
  ): Promise<Buffer> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 80,
      format = 'webp',
    } = options;

    let pipeline = sharp(input)
      .rotate()
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    switch (format) {
      case 'webp':
        return pipeline.webp({ quality }).toBuffer();
      case 'avif':
        return pipeline.avif({ quality }).toBuffer();
      case 'jpeg':
        return pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      case 'png':
        return pipeline.png({ compressionLevel: 9 }).toBuffer();
    }
  }
}
\`\`\`

## FFMPEG - VIDEO PROCESSING

### Transcoding para HLS (Adaptive Bitrate Streaming)

\`\`\`typescript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';

interface HLSVariant {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
  maxrate: string;
  bufsize: string;
}

const HLS_VARIANTS: HLSVariant[] = [
  { name: '360p', width: 640, height: 360, videoBitrate: '800k', audioBitrate: '96k', maxrate: '856k', bufsize: '1200k' },
  { name: '480p', width: 854, height: 480, videoBitrate: '1400k', audioBitrate: '128k', maxrate: '1498k', bufsize: '2100k' },
  { name: '720p', width: 1280, height: 720, videoBitrate: '2800k', audioBitrate: '128k', maxrate: '2996k', bufsize: '4200k' },
  { name: '1080p', width: 1920, height: 1080, videoBitrate: '5000k', audioBitrate: '192k', maxrate: '5350k', bufsize: '7500k' },
];

class VideoProcessor {
  async transcodeToHLS(
    inputPath: string,
    outputDir: string,
    options?: {
      variants?: HLSVariant[];
      segmentDuration?: number;
      generateThumbnails?: boolean;
    }
  ): Promise<{
    masterPlaylist: string;
    variants: string[];
    thumbnails?: string[];
    duration: number;
  }> {
    const variants = options?.variants || HLS_VARIANTS;
    const segmentDuration = options?.segmentDuration || 6;

    await fs.mkdir(outputDir, { recursive: true });

    // Obter duração do vídeo
    const duration = await this.getVideoDuration(inputPath);

    // Processar cada variante
    const variantPlaylists: string[] = [];

    for (const variant of variants) {
      const variantDir = path.join(outputDir, variant.name);
      await fs.mkdir(variantDir, { recursive: true });

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            // Video
            '-c:v libx264',
            '-preset fast',
            '-profile:v main',
            '-level 4.0',
            \`-vf scale=\${variant.width}:\${variant.height}:force_original_aspect_ratio=decrease,pad=\${variant.width}:\${variant.height}:(ow-iw)/2:(oh-ih)/2\`,
            \`-b:v \${variant.videoBitrate}\`,
            \`-maxrate \${variant.maxrate}\`,
            \`-bufsize \${variant.bufsize}\`,
            // Audio
            '-c:a aac',
            \`-b:a \${variant.audioBitrate}\`,
            '-ar 48000',
            // HLS
            '-f hls',
            \`-hls_time \${segmentDuration}\`,
            '-hls_list_size 0',
            '-hls_segment_filename', path.join(variantDir, 'segment_%03d.ts'),
          ])
          .output(path.join(variantDir, 'playlist.m3u8'))
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      variantPlaylists.push(\`\${variant.name}/playlist.m3u8\`);
    }

    // Gerar master playlist
    const masterPlaylist = this.generateMasterPlaylist(variants, variantPlaylists);
    await fs.writeFile(path.join(outputDir, 'master.m3u8'), masterPlaylist);

    // Gerar thumbnails (opcional)
    let thumbnails: string[] | undefined;
    if (options?.generateThumbnails) {
      thumbnails = await this.generateThumbnails(inputPath, outputDir, duration);
    }

    return {
      masterPlaylist: 'master.m3u8',
      variants: variantPlaylists,
      thumbnails,
      duration,
    };
  }

  private generateMasterPlaylist(variants: HLSVariant[], playlists: string[]): string {
    let content = '#EXTM3U\\n#EXT-X-VERSION:3\\n\\n';

    variants.forEach((variant, index) => {
      const bandwidth = parseInt(variant.videoBitrate) * 1000 + parseInt(variant.audioBitrate) * 1000;
      content += \`#EXT-X-STREAM-INF:BANDWIDTH=\${bandwidth},RESOLUTION=\${variant.width}x\${variant.height}\\n\`;
      content += \`\${playlists[index]}\\n\\n\`;
    });

    return content;
  }

  async generateThumbnails(
    inputPath: string,
    outputDir: string,
    duration: number,
    count: number = 10
  ): Promise<string[]> {
    const thumbnails: string[] = [];
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      const timestamp = interval * i;
      const filename = \`thumb_\${String(i).padStart(3, '0')}.jpg\`;

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .seekInput(timestamp)
          .outputOptions(['-vframes 1', '-vf scale=320:-1'])
          .output(path.join(outputDir, filename))
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      thumbnails.push(filename);
    }

    return thumbnails;
  }

  async getVideoDuration(inputPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });
  }

  // Compressão simples de vídeo
  async compressVideo(
    inputPath: string,
    outputPath: string,
    options?: {
      crf?: number; // 18-28, menor = melhor qualidade
      preset?: 'ultrafast' | 'fast' | 'medium' | 'slow';
      maxWidth?: number;
    }
  ): Promise<void> {
    const { crf = 23, preset = 'medium', maxWidth = 1920 } = options || {};

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          \`-crf \${crf}\`,
          \`-preset \${preset}\`,
          \`-vf scale='min(\${maxWidth},iw)':-2\`,
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart', // Otimização para streaming
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  // Extrair áudio de vídeo
  async extractAudio(
    inputPath: string,
    outputPath: string,
    format: 'mp3' | 'aac' | 'opus' = 'mp3'
  ): Promise<void> {
    const codecMap = {
      mp3: ['-c:a libmp3lame', '-b:a 192k'],
      aac: ['-c:a aac', '-b:a 192k'],
      opus: ['-c:a libopus', '-b:a 128k'],
    };

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .outputOptions(codecMap[format])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  // Gerar waveform de áudio
  async generateWaveform(
    inputPath: string,
    outputPath: string,
    options?: { width?: number; height?: number; color?: string }
  ): Promise<void> {
    const { width = 1800, height = 140, color = '0x3b82f6' } = options || {};

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-filter_complex',
          \`aformat=channel_layouts=mono,showwavespic=s=\${width}x\${height}:colors=\${color}\`,
          '-frames:v 1',
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }
}
\`\`\`
`;

// Continuation of MEDIA_PROCESSING_MANIFEST - Part 3

export const MEDIA_PROCESSING_MANIFEST_PART3 = `

## UPLOAD PIPELINE COMPLETO

### Presigned URLs para Upload Direto

\`\`\`typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

interface UploadConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  expiresIn: number; // segundos
}

const UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  image: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    expiresIn: 3600,
  },
  video: {
    maxSizeBytes: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    expiresIn: 7200,
  },
  audio: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
    expiresIn: 3600,
  },
};

class UploadService {
  private s3: S3Client;
  private bucket: string;

  constructor(bucket: string) {
    this.s3 = new S3Client({});
    this.bucket = bucket;
  }

  async createPresignedUpload(
    type: 'image' | 'video' | 'audio',
    filename: string,
    contentType: string,
    userId: string
  ): Promise<{
    uploadUrl: string;
    key: string;
    expiresAt: Date;
  }> {
    const config = UPLOAD_CONFIGS[type];

    // Validar content type
    if (!config.allowedMimeTypes.includes(contentType)) {
      throw new Error(\`Invalid content type: \${contentType}\`);
    }

    // Gerar key único
    const ext = filename.split('.').pop();
    const uniqueId = crypto.randomUUID();
    const key = \`uploads/\${type}/\${userId}/\${uniqueId}.\${ext}\`;

    // Criar presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'user-id': userId,
        'original-filename': filename,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: config.expiresIn,
    });

    return {
      uploadUrl,
      key,
      expiresAt: new Date(Date.now() + config.expiresIn * 1000),
    };
  }
}
\`\`\`

### Worker de Processamento (BullMQ)

\`\`\`typescript
import { Queue, Worker, Job } from 'bullmq';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

interface MediaJob {
  type: 'image' | 'video' | 'audio';
  sourceKey: string;
  userId: string;
  options?: Record<string, any>;
}

// Criar filas separadas por tipo
const imageQueue = new Queue<MediaJob>('image-processing', {
  connection: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

const videoQueue = new Queue<MediaJob>('video-processing', {
  connection: { host: 'localhost', port: 6379 },
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 500,
  },
});

// Worker de imagens
const imageWorker = new Worker<MediaJob>(
  'image-processing',
  async (job: Job<MediaJob>) => {
    const { sourceKey, userId, options } = job.data;

    job.updateProgress(10);

    // Download do S3
    const s3 = new S3Client({});
    const response = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: sourceKey })
    );
    const buffer = Buffer.from(await response.Body!.transformToByteArray());

    job.updateProgress(30);

    // Processar
    const processor = new ImageProcessor({ bucket: BUCKET, cdnUrl: CDN_URL });
    const result = await processor.processImage(buffer, \`processed/\${userId}/\${Date.now()}\`);

    job.updateProgress(90);

    // Salvar metadata no banco
    await db.media.create({
      data: {
        userId,
        type: 'image',
        originalKey: sourceKey,
        variants: result.variants,
        metadata: result.metadata,
      },
    });

    job.updateProgress(100);

    return result;
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 5, // Processar 5 imagens em paralelo
  }
);

// Worker de vídeos (mais pesado, menos concorrência)
const videoWorker = new Worker<MediaJob>(
  'video-processing',
  async (job: Job<MediaJob>) => {
    const { sourceKey, userId } = job.data;

    // Download, transcode, upload...
    // Similar ao imageWorker mas com VideoProcessor

    return { success: true };
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 2, // Vídeos são pesados
  }
);

// Event handlers
imageWorker.on('completed', (job, result) => {
  console.log(\`Image job \${job.id} completed\`);
  // Notificar usuário via WebSocket/SSE
});

imageWorker.on('failed', (job, err) => {
  console.error(\`Image job \${job?.id} failed:\`, err);
  // Alertar, retry, etc
});
\`\`\`

## NEXT.JS IMAGE OPTIMIZATION

### Configuração Avançada

\`\`\`typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Formatos modernos
    formats: ['image/avif', 'image/webp'],
    
    // Domínios permitidos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
    ],
    
    // Tamanhos de device
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // Tamanhos de imagem
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Minimizar tamanho
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 ano
    
    // Loader customizado (Cloudinary, imgix, etc)
    // loader: 'custom',
    // loaderFile: './lib/imageLoader.ts',
  },
};

module.exports = nextConfig;
\`\`\`

### Componente de Imagem Otimizado

\`\`\`tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={\`relative overflow-hidden \${className}\`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        className={\`
          duration-700 ease-in-out
          \${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        \`}
        onLoad={() => setIsLoading(false)}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
}

// Responsive Image com art direction
export function ResponsiveHero() {
  return (
    <picture>
      {/* Mobile */}
      <source
        media="(max-width: 640px)"
        srcSet="/images/hero-mobile.webp"
        type="image/webp"
      />
      {/* Tablet */}
      <source
        media="(max-width: 1024px)"
        srcSet="/images/hero-tablet.webp"
        type="image/webp"
      />
      {/* Desktop */}
      <source srcSet="/images/hero-desktop.webp" type="image/webp" />
      {/* Fallback */}
      <img
        src="/images/hero-desktop.jpg"
        alt="Hero"
        className="w-full h-auto"
        loading="eager"
        fetchPriority="high"
      />
    </picture>
  );
}
\`\`\`

## VIDEO PLAYER COM HLS

\`\`\`tsx
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string; // URL do master.m3u8
  poster?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ src, poster, autoPlay = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Verificar suporte nativo (Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }

    // Usar HLS.js para outros browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    }
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      className="w-full h-auto"
    >
      Your browser does not support video playback.
    </video>
  );
}
\`\`\`

## CLOUDINARY / IMGIX INTEGRATION

\`\`\`typescript
// lib/imageLoader.ts - Custom loader para Next.js
interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

// Cloudinary
export function cloudinaryLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  const params = [
    'f_auto', // Auto format (WebP/AVIF)
    'c_limit', // Limit size
    \`w_\${width}\`,
    \`q_\${quality}\`,
  ];
  return \`https://res.cloudinary.com/YOUR_CLOUD/image/upload/\${params.join(',')}\/\${src}\`;
}

// imgix
export function imgixLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  const url = new URL(\`https://YOUR_DOMAIN.imgix.net/\${src}\`);
  url.searchParams.set('auto', 'format,compress');
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality));
  return url.toString();
}

// Cloudflare Images
export function cloudflareLoader({ src, width, quality = 75 }: ImageLoaderProps): string {
  return \`https://imagedelivery.net/YOUR_ACCOUNT/\${src}/w=\${width},q=\${quality}\`;
}
\`\`\`

## CHECKLIST COMPLETO

### Upload
- [ ] Presigned URLs para upload direto ao storage?
- [ ] Validação de tipo MIME no servidor?
- [ ] Limites de tamanho configurados?
- [ ] Scan de malware/vírus?
- [ ] Rate limiting por usuário?

### Processamento
- [ ] Processamento em background (queues)?
- [ ] Múltiplas variantes/resoluções geradas?
- [ ] Formatos modernos (WebP, AVIF)?
- [ ] Metadata extraída e salva?
- [ ] Thumbnails gerados?
- [ ] Retry em caso de falha?

### Vídeo
- [ ] HLS/DASH para adaptive streaming?
- [ ] Múltiplas qualidades (360p-1080p)?
- [ ] Thumbnails/preview gerados?
- [ ] Duração e metadata salvos?

### Delivery
- [ ] CDN configurado?
- [ ] Cache headers corretos?
- [ ] Lazy loading implementado?
- [ ] Placeholder/blur hash?
- [ ] Responsive images (srcset)?

### Monitoramento
- [ ] Métricas de processamento?
- [ ] Alertas para falhas?
- [ ] Custos de storage monitorados?
- [ ] Bandwidth tracking?

## ANTI-PATTERNS

❌ **NUNCA** processe mídia na thread principal / request síncrono
❌ **NUNCA** sirva arquivos originais sem otimização
❌ **NUNCA** armazene mídia no banco de dados
❌ **NUNCA** ignore limites de tamanho de upload
❌ **NUNCA** confie no content-type enviado pelo cliente
❌ **NUNCA** exponha paths internos do storage
❌ **NUNCA** processe sem validar o arquivo primeiro
❌ **NUNCA** use formatos antigos (BMP, TIFF) para web
❌ **NUNCA** ignore aspect ratio ao redimensionar
❌ **NUNCA** sirva vídeos sem streaming (download completo)

## COMANDOS FFMPEG ÚTEIS

\`\`\`bash
# Informações do arquivo
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4

# Converter para WebM (VP9)
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm

# Extrair frame específico
ffmpeg -i input.mp4 -ss 00:00:10 -vframes 1 thumbnail.jpg

# Criar GIF de preview
ffmpeg -i input.mp4 -ss 00:00:05 -t 3 -vf "fps=10,scale=320:-1" preview.gif

# Normalizar áudio
ffmpeg -i input.mp4 -af loudnorm=I=-16:TP=-1.5:LRA=11 output.mp4

# Adicionar watermark
ffmpeg -i input.mp4 -i watermark.png -filter_complex "overlay=W-w-10:H-h-10" output.mp4

# Concatenar vídeos
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4

# Extrair apenas áudio
ffmpeg -i input.mp4 -vn -acodec libmp3lame -ab 192k output.mp3
\`\`\`
`;
