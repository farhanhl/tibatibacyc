const path = require('path');
const fs = require('fs');
const rootDir = path.resolve(__dirname, '..');
const sharp = require(path.join(rootDir, 'node_modules/sharp'));

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  // 1. Prepare Background Image (activity-bg.webp resized & dimmed)
  const bgPath = path.join(rootDir, 'public/images/background/activity-bg.webp');
  const bgResized = await sharp(bgPath)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .modulate({ brightness: 0.45, saturation: 0.9 })
    .toBuffer();

  // 2. Prepare Logo
  const logoPath = path.join(rootDir, 'public/images/logo.png');
  const logoResized = await sharp(logoPath)
    .resize(84, 84, { fit: 'contain' })
    .toBuffer();

  // 3. Prepare 2 preview photo cards from events to show it's a real gallery
  const photo1Path = path.join(rootDir, 'public/images/events/kopi-kalean-kebonjati/kalean1.webp');
  const photo1 = await sharp(photo1Path)
    .resize(220, 280, { fit: 'cover', position: 'center' })
    .toBuffer();

  const photo2Path = path.join(rootDir, 'public/images/events/situ-cibeureum/cibeureum1.webp');
  const photo2 = await sharp(photo2Path)
    .resize(200, 260, { fit: 'cover', position: 'center' })
    .toBuffer();

  // Convert buffers to base64 for embedding in SVG
  const logoBase64 = `data:image/png;base64,${logoResized.toString('base64')}`;
  const photo1Base64 = `data:image/webp;base64,${photo1.toString('base64')}`;
  const photo2Base64 = `data:image/webp;base64,${photo2.toString('base64')}`;

  // 4. Create SVG Overlay with dark gradient, typography, badges, and photo frames
  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Gradient for dark fade from left to right -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0a0b0d" stop-opacity="0.98"/>
        <stop offset="45%" stop-color="#0a0b0d" stop-opacity="0.94"/>
        <stop offset="70%" stop-color="#0a0b0d" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#0a0b0d" stop-opacity="0.55"/>
      </linearGradient>

      <!-- Gradient for top bar -->
      <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#E03A3E"/>
        <stop offset="50%" stop-color="#C44341"/>
        <stop offset="100%" stop-color="#8E1B1D"/>
      </linearGradient>

      <!-- Card drop shadow -->
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.75"/>
      </filter>

      <!-- Glow for text -->
      <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#C44341" flood-opacity="0.4"/>
      </filter>

      <!-- Clip paths for rounded photos -->
      <clipPath id="clipPhoto1">
        <rect x="0" y="0" width="220" height="280" rx="14" ry="14"/>
      </clipPath>
      <clipPath id="clipPhoto2">
        <rect x="0" y="0" width="200" height="260" rx="14" ry="14"/>
      </clipPath>
      <clipPath id="clipLogo">
        <circle cx="42" cy="42" r="42"/>
      </clipPath>
    </defs>

    <!-- Dark gradient overlay -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

    <!-- Signature Red Accent Bar on Top -->
    <rect x="0" y="0" width="${width}" height="7" fill="url(#redGrad)"/>

    <!-- === LEFT COLUMN: BRANDING & HEADLINE === -->

    <!-- Brand Header (Logo + Title) -->
    <g transform="translate(80, 55)">
      <!-- Logo container circle with red border -->
      <circle cx="42" cy="42" r="44" fill="#0c0d0e" stroke="#C44341" stroke-width="3" filter="url(#shadow)"/>
      <image href="${logoBase64}" x="0" y="0" width="84" height="84" clip-path="url(#clipLogo)"/>
      
      <!-- Brand Name -->
      <text x="108" y="36" fill="#FFFFFF" font-size="24" font-weight="900" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif" letter-spacing="2">
        TIBA-TIBA CYCLING
      </text>
      <!-- Sub-brand -->
      <text x="108" y="60" fill="#9CA3AF" font-size="14" font-weight="600" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif" letter-spacing="1">
        BEKASI CYCLING COMMUNITY • EST. 2026
      </text>
    </g>

    <!-- Tag Badge: ARSIP GOOGLE DRIVE RESMI -->
    <g transform="translate(80, 185)">
      <rect x="0" y="0" width="265" height="34" rx="17" fill="#C44341" fill-opacity="0.18" stroke="#C44341" stroke-width="1.5"/>
      <circle cx="18" cy="17" r="5" fill="#C44341"/>
      <text x="32" y="22" fill="#FFA5A5" font-size="13" font-weight="800" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif" letter-spacing="1">
        ARSIP GOOGLE DRIVE RESMI
      </text>
    </g>

    <!-- Main Title -->
    <g transform="translate(80, 280)">
      <text x="0" y="0" fill="#FFFFFF" font-size="62" font-weight="900" font-family="'Oswald', 'Impact', 'Segoe UI', Arial, sans-serif" letter-spacing="1.5">
        DOKUMENTASI
      </text>
      <text x="0" y="62" fill="#E03A3E" font-size="62" font-weight="900" font-family="'Oswald', 'Impact', 'Segoe UI', Arial, sans-serif" letter-spacing="1.5" filter="url(#glow)">
        KEGIATAN GOWES
      </text>
    </g>

    <!-- Subtitle description -->
    <g transform="translate(80, 405)">
      <text x="0" y="0" fill="#EAE6DD" font-size="25" font-weight="700" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif" letter-spacing="0.5">
        Foto &amp; Video Dokumentasi
      </text>
    </g>

    <!-- Bottom Features & Website URL -->
    <g transform="translate(80, 475)">
      <!-- Pill 1: Free Download -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="165" height="38" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
        <text x="16" y="24" fill="#FFFFFF" font-size="13" font-weight="700" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif">
          📁 Bebas Download
        </text>
      </g>

      <!-- Pill 2: Original Quality -->
      <g transform="translate(180, 0)">
        <rect x="0" y="0" width="165" height="38" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
        <text x="16" y="24" fill="#FFFFFF" font-size="13" font-weight="700" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif">
          ✨ Kualitas Asli HD
        </text>
      </g>

      <!-- Pill 3: Link domain -->
      <g transform="translate(360, 0)">
        <rect x="0" y="0" width="230" height="38" rx="10" fill="rgba(196,67,65,0.22)" stroke="#C44341" stroke-width="1.2"/>
        <text x="16" y="24" fill="#FFC9C8" font-size="13" font-weight="800" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif">
          🔗 tibatibacyc.my.id
        </text>
      </g>
    </g>


    <!-- === RIGHT COLUMN: GALLERY PHOTO CARDS === -->

    <!-- Photo Card 2 (Background tilt card) -->
    <g transform="translate(860, 110) rotate(7, 100, 130)" filter="url(#shadow)">
      <rect x="-6" y="-6" width="212" height="272" rx="18" fill="#1e2024" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      <g clip-path="url(#clipPhoto2)">
        <image href="${photo2Base64}" x="0" y="0" width="200" height="260" preserveAspectRatio="xMidYMid slice"/>
      </g>
      <!-- Bottom Badge -->
      <rect x="12" y="215" width="176" height="32" rx="8" fill="rgba(0,0,0,0.85)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <text x="100" y="236" text-anchor="middle" fill="#FFFFFF" font-size="11" font-weight="700" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif">
        Situ Cibeureum Ride
      </text>
    </g>

    <!-- Photo Card 1 (Foreground hero card) -->
    <g transform="translate(710, 150) rotate(-4, 110, 140)" filter="url(#shadow)">
      <rect x="-8" y="-8" width="236" height="296" rx="20" fill="#121316" stroke="#C44341" stroke-width="3"/>
      <g clip-path="url(#clipPhoto1)">
        <image href="${photo1Base64}" x="0" y="0" width="220" height="280" preserveAspectRatio="xMidYMid slice"/>
      </g>
      <!-- Bottom Label Badge on photo -->
      <rect x="14" y="230" width="192" height="36" rx="10" fill="rgba(10,11,13,0.92)" stroke="rgba(196,67,65,0.6)" stroke-width="1.5"/>
      <text x="110" y="253" text-anchor="middle" fill="#FFFFFF" font-size="12" font-weight="800" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif">
        🚴‍♂️ Kalean Kebonjati
      </text>
    </g>

    <!-- Floating Badge: GOOGLE DRIVE CLOUD -->
    <g transform="translate(930, 420)" filter="url(#shadow)">
      <rect x="0" y="0" width="190" height="52" rx="14" fill="#0e1014" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
      <circle cx="28" cy="26" r="16" fill="#C44341"/>
      <!-- Cloud/Folder icon -->
      <text x="28" y="32" text-anchor="middle" fill="#FFFFFF" font-size="18">☁️</text>
      <text x="56" y="24" fill="#FFFFFF" font-size="12" font-weight="800" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif">
        GOOGLE DRIVE
      </text>
      <text x="56" y="40" fill="#10B981" font-size="11" font-weight="700" font-family="'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif">
        ● Sinkron Otomatis
      </text>
    </g>

  </svg>
  `;

  // 5. Composite Background + SVG Overlay -> Output as optimized JPEG & PNG
  const finalImageBuffer = await sharp(bgResized)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 88, progressive: false })
    .toBuffer();

  // Save to public/images/og-dokumentasi.jpg
  const outputPath = path.join(rootDir, 'public/images/og-dokumentasi.jpg');
  fs.writeFileSync(outputPath, finalImageBuffer);
  console.log(`Saved og-dokumentasi.jpg to ${outputPath} (Size: ${(finalImageBuffer.length / 1024).toFixed(1)} KB)`);

  // Also save to src/app/dokumentasi/opengraph-image.jpg
  const opengraphPath = path.join(rootDir, 'src/app/dokumentasi/opengraph-image.jpg');
  fs.writeFileSync(opengraphPath, finalImageBuffer);
  console.log(`Saved opengraph-image.jpg to ${opengraphPath} (Size: ${(finalImageBuffer.length / 1024).toFixed(1)} KB)`);
}

generateOgImage().catch(console.error);
