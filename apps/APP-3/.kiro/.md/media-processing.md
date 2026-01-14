# 🎬 Media Processing Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- FFmpeg, Video Processing, Audio Processing
- Image Optimization, Sharp, ImageMagick
- Transcoding, Streaming, HLS, DASH
- Thumbnail, Resize, Compress

## FILOSOFIA
> "Mídia otimizada é UX otimizada."

## STACK RECOMENDADA
| Tipo | Ferramenta |
|------|------------|
| Imagens | Sharp (Node), Pillow (Python) |
| Vídeo | FFmpeg |
| Streaming | HLS.js, Video.js |
| CDN | Cloudinary, imgix, Mux |

## BOAS PRÁTICAS
- Processe em background (queues)
- Use formatos modernos (WebP, AVIF, VP9)
- Gere múltiplas resoluções
- Implemente lazy loading
- Use CDN para delivery

## ANTI-PATTERNS
❌ **NUNCA** processe mídia em requests síncronos
❌ **NUNCA** sirva originais sem otimização
❌ **NUNCA** ignore aspect ratio
