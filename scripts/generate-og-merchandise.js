const path = require('path');
const fs = require('fs');
const rootDir = path.resolve(__dirname, '..');
const sharp = require(path.join(rootDir, 'node_modules/sharp'));

async function generateOgMerchandiseImage() {
  const width = 1200;
  const height = 630;

  // 1. Prepare Base Background (hero-bg, dimmed and darkened with subtle vignette)
  const bgPath = path.join(rootDir, 'public/images/background/hero-bg.webp');
  const bgResized = await sharp(bgPath)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .modulate({ brightness: 0.28, saturation: 0.8 })
    .toBuffer();

  // 2. Prepare Logo
  const logoPath = path.join(rootDir, 'public/images/logo.png');
  const logoResized = await sharp(logoPath)
    .resize(72, 72, { fit: 'contain' })
    .toBuffer();

  // 3. Prepare Product Vest Image (merch.jpeg: 1536x1024 -> 504x336 exact 1.5:1 ratio)
  const merchWidth = 504;
  const merchHeight = 336;
  const merchPath = path.join(rootDir, 'public/images/merch/merch.jpeg');
  const merchResized = await sharp(merchPath)
    .resize(merchWidth, merchHeight, { fit: 'fill' })
    .toBuffer();

  // Convert buffers to base64 for embedding in SVG
  const logoBase64 = `data:image/png;base64,${logoResized.toString('base64')}`;
  const merchBase64 = `data:image/jpeg;base64,${merchResized.toString('base64')}`;

  // 4. Create SVG Overlay
  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Gradient for dark fade from left to right -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#07080a" stop-opacity="0.98"/>
        <stop offset="50%" stop-color="#080a0d" stop-opacity="0.94"/>
        <stop offset="75%" stop-color="#0a0c10" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="#0c0e12" stop-opacity="0.80"/>
      </linearGradient>

      <!-- Signature red top bar gradient -->
      <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#E03A3E"/>
        <stop offset="50%" stop-color="#C44341"/>
        <stop offset="100%" stop-color="#8E1B1D"/>
      </linearGradient>

      <!-- Price gold gradient -->
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FDE68A"/>
        <stop offset="100%" stop-color="#F59E0B"/>
      </linearGradient>

      <!-- Card drop shadow -->
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/>
      </filter>

      <!-- Text glow filter -->
      <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#C44341" flood-opacity="0.5"/>
      </filter>

      <!-- Clip paths -->
      <clipPath id="clipMerch">
        <rect x="0" y="0" width="${merchWidth}" height="${merchHeight}" rx="16" ry="16"/>
      </clipPath>
      <clipPath id="clipLogo">
        <circle cx="36" cy="36" r="36"/>
      </clipPath>
    </defs>

    <!-- Dark gradient overlay -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>

    <!-- Red Accent Top Bar -->
    <rect x="0" y="0" width="${width}" height="7" fill="url(#redGrad)"/>

    <!-- Ambient Red Glow in background behind product card -->
    <circle cx="890" cy="300" r="260" fill="#C44341" fill-opacity="0.14" filter="url(#glow)"/>

    <!-- === LEFT COLUMN: BRANDING, TITLE, PRICE, SPECS, CTA === -->

    <!-- Brand Header (Logo + Community Title) -->
    <g transform="translate(60, 42)">
      <circle cx="36" cy="36" r="38" fill="#0c0d0e" stroke="#C44341" stroke-width="2.5" filter="url(#shadow)"/>
      <image href="${logoBase64}" x="0" y="0" width="72" height="72" clip-path="url(#clipLogo)"/>
      
      <text x="92" y="30" fill="#FFFFFF" font-size="22" font-weight="900" font-family="'Segoe UI', Arial, sans-serif" letter-spacing="1.5">
        TIBA-TIBA CYCLING
      </text>
      <text x="92" y="52" fill="#9CA3AF" font-size="13" font-weight="600" font-family="'Segoe UI', Arial, sans-serif" letter-spacing="1">
        BEKASI CYCLING COMMUNITY • EST. 2026
      </text>
    </g>

    <!-- Category Pill Badge -->
    <g transform="translate(60, 136)">
      <rect x="0" y="0" width="280" height="30" rx="15" fill="#C44341" fill-opacity="0.22" stroke="#C44341" stroke-width="1.4"/>
      <circle cx="16" cy="15" r="5" fill="#E03A3E"/>
      <text x="30" y="20" fill="#FFA5A5" font-size="12" font-weight="800" font-family="'Segoe UI', Arial, sans-serif" letter-spacing="1">
        OFFICIAL MERCHANDISE • BATCH #1
      </text>
    </g>

    <!-- Main Title -->
    <g transform="translate(60, 218)">
      <text x="0" y="0" fill="#FFFFFF" font-size="46" font-weight="900" font-family="'Impact', 'Segoe UI', Arial, sans-serif" letter-spacing="1.2">
        TACTICAL RIDING VEST
      </text>
      <text x="0" y="48" fill="#E03A3E" font-size="44" font-weight="900" font-family="'Impact', 'Segoe UI', Arial, sans-serif" letter-spacing="1.2" filter="url(#glow)">
        TIBA-TIBA CYCLING
      </text>
    </g>

    <!-- Price Card / Highlight Box -->
    <g transform="translate(60, 318)">
      <rect x="0" y="0" width="510" height="52" rx="14" fill="#14171e" stroke="#F59E0B" stroke-width="1.8" filter="url(#shadow)"/>
      <text x="18" y="36" fill="#FBBF24" font-size="30" font-weight="900" font-family="'Segoe UI', Arial, sans-serif">
        Rp 190.000
      </text>
      <rect x="195" y="12" width="90" height="28" rx="8" fill="#F59E0B" fill-opacity="0.18" stroke="#F59E0B" stroke-width="1"/>
      <text x="240" y="30" text-anchor="middle" fill="#FDE68A" font-size="12" font-weight="800" font-family="'Segoe UI', Arial, sans-serif">
        HARGA FIX
      </text>
      <text x="300" y="32" fill="#9CA3AF" font-size="12" font-weight="600" font-family="'Segoe UI', Arial, sans-serif">
        • Semua Ukuran S s/d 5XL
      </text>
    </g>

    <!-- Spec Badges Grid (2 columns x 2 rows) -->
    <g transform="translate(60, 388)">
      <!-- Spec 1: Ripstop + Furing -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="248" height="34" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
        <text x="14" y="22" fill="#EAE6DD" font-size="12" font-weight="700" font-family="'Segoe UI', Arial, sans-serif">
          🧵 Bahan Ripstop + Furing
        </text>
      </g>

      <!-- Spec 2: Bordir Punggung -->
      <g transform="translate(260, 0)">
        <rect x="0" y="0" width="250" height="34" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
        <text x="14" y="22" fill="#EAE6DD" font-size="12" font-weight="700" font-family="'Segoe UI', Arial, sans-serif">
          🪡 Bordir Komputer Belakang
        </text>
      </g>

      <!-- Spec 3: Safety Reflector -->
      <g transform="translate(0, 44)">
        <rect x="0" y="0" width="248" height="34" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
        <text x="14" y="22" fill="#EAE6DD" font-size="12" font-weight="700" font-family="'Segoe UI', Arial, sans-serif">
          ✨ Safety Reflector Bahu
        </text>
      </g>

      <!-- Spec 4: Size S - 5XL -->
      <g transform="translate(260, 44)">
        <rect x="0" y="0" width="250" height="34" rx="10" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
        <text x="14" y="22" fill="#EAE6DD" font-size="12" font-weight="700" font-family="'Segoe UI', Arial, sans-serif">
          📏 Ukuran Lengkap (S s/d 5XL)
        </text>
      </g>
    </g>

    <!-- Bottom URL Call to Action -->
    <g transform="translate(60, 484)">
      <rect x="0" y="0" width="510" height="46" rx="12" fill="rgba(196,67,65,0.25)" stroke="#C44341" stroke-width="1.6"/>
      <text x="20" y="29" fill="#FFFFFF" font-size="14" font-weight="800" font-family="'Segoe UI', Arial, sans-serif">
        👉 Pre-Order Sekarang: <tspan fill="#FFD1D0" font-weight="900">tibatibacyc.my.id/merchandise</tspan>
      </text>
    </g>

    <!-- === RIGHT COLUMN: PRODUCT PHOTO CARD === -->

    <g transform="translate(620, 115)" filter="url(#shadow)">
      <!-- Outer Glow Frame with Crimson Border -->
      <rect x="-8" y="-8" width="${merchWidth + 16}" height="${merchHeight + 16}" rx="24" fill="#121418" stroke="#C44341" stroke-width="3"/>
      
      <!-- Merch Image (Both Front & Back vest visible!) -->
      <g clip-path="url(#clipMerch)">
        <image href="${merchBase64}" x="0" y="0" width="${merchWidth}" height="${merchHeight}"/>
      </g>

      <!-- Floating Top Badge: PRE-ORDER OPEN -->
      <g transform="translate(300, 16)">
        <rect x="0" y="0" width="186" height="32" rx="16" fill="rgba(8,10,14,0.92)" stroke="#10B981" stroke-width="1.5" filter="url(#shadow)"/>
        <circle cx="18" cy="16" r="5" fill="#10B981"/>
        <text x="32" y="21" fill="#D1FAE5" font-size="11" font-weight="900" font-family="'Segoe UI', Arial, sans-serif" letter-spacing="1">
          PRE-ORDER OPEN
        </text>
      </g>

      <!-- Floating Bottom Caption: Front & Back Specs -->
      <g transform="translate(16, ${merchHeight - 44})">
        <rect x="0" y="0" width="${merchWidth - 32}" height="36" rx="10" fill="rgba(8,10,14,0.92)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <text x="18" y="23" fill="#FFFFFF" font-size="12" font-weight="800" font-family="'Segoe UI', Arial, sans-serif">
          ⬅️ Depan (Sablon DTF)
        </text>
        <text x="${merchWidth - 50}" y="23" text-anchor="end" fill="#FFA5A5" font-size="12" font-weight="800" font-family="'Segoe UI', Arial, sans-serif">
          Belakang (Bordir) ➡️
        </text>
      </g>
    </g>

  </svg>
  `;

  // 5. Composite Background + SVG Overlay -> Optimized JPEG
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

  // Save to public/images/og-merchandise.jpg
  const outputPath = path.join(rootDir, 'public/images/og-merchandise.jpg');
  fs.writeFileSync(outputPath, finalImageBuffer);
  console.log(`Saved og-merchandise.jpg to ${outputPath} (Size: ${(finalImageBuffer.length / 1024).toFixed(1)} KB)`);

  // Also save to src/app/merchandise/opengraph-image.jpg
  const opengraphPath = path.join(rootDir, 'src/app/merchandise/opengraph-image.jpg');
  fs.writeFileSync(opengraphPath, finalImageBuffer);
  console.log(`Saved opengraph-image.jpg to ${opengraphPath} (Size: ${(finalImageBuffer.length / 1024).toFixed(1)} KB)`);
}

generateOgMerchandiseImage().catch(console.error);
