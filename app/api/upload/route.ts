import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/tiff', 'image/bmp'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB (larger limit since we'll compress)
const MAX_WIDTH = 1600;

export async function POST(request: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: jpeg, png, webp, svg, gif, tiff, bmp' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate consistent filename
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase()
      .slice(0, 50);

    // SVGs: sanitize then save (they're already optimized vectors)
    if (file.type === 'image/svg+xml') {
      let svgContent = buffer.toString('utf-8');
      // Strip <script> tags (case-insensitive, including content)
      svgContent = svgContent.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
      svgContent = svgContent.replace(/<script[^>]*\/>/gi, '');
      // Strip event handler attributes (on*="...")
      svgContent = svgContent.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
      // Strip javascript: and data: URIs in href/xlink:href/src attributes
      svgContent = svgContent.replace(/(href|src)\s*=\s*(?:"(?:javascript|data):[^"]*"|'(?:javascript|data):[^']*')/gi, '$1=""');

      const filename = `${timestamp}-${safeName}.svg`;
      const filePath = path.join(UPLOAD_DIR, filename);
      fs.writeFileSync(filePath, svgContent, 'utf-8');
      return NextResponse.json({ url: `/uploads/products/${filename}` });
    }

    // All raster images: optimize and convert to WebP
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Adaptive quality: estimate if source is already compressed
    // Low bytes-per-pixel suggests pre-compressed/low-quality source → use higher WebP quality to avoid double-compression
    // High bytes-per-pixel suggests high-quality/uncompressed source → can compress more aggressively
    const pixels = (metadata.width || 1) * (metadata.height || 1);
    const bytesPerPixel = buffer.length / pixels;
    let quality: number;
    if (bytesPerPixel < 0.5) {
      // Already heavily compressed (e.g. low-quality JPEG) — preserve what's there
      quality = 90;
    } else if (bytesPerPixel < 1.5) {
      // Moderately compressed (typical JPEG)
      quality = 85;
    } else {
      // High quality / uncompressed (PNG, TIFF, high-quality JPEG)
      quality = 80;
    }

    let pipeline = image;

    // Resize if wider than max width (never upscale)
    if (metadata.width && metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, undefined, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Convert to WebP with adaptive quality
    const optimized = await pipeline
      .webp({ quality, effort: 4 })
      .toBuffer();

    const filename = `${timestamp}-${safeName}.webp`;
    const filePath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filePath, optimized);

    // Log size reduction for reference
    const reduction = ((1 - optimized.length / buffer.length) * 100).toFixed(0);
    console.log(
      `Image optimized: ${file.name} (${(buffer.length / 1024).toFixed(0)}KB) → ${filename} (${(optimized.length / 1024).toFixed(0)}KB, -${reduction}%, q${quality})`
    );

    return NextResponse.json({ url: `/uploads/products/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
