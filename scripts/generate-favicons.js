const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
    const sourceImage = path.join(__dirname, '../public/icon-512x512.png');

    // Generate 192x192 icon
    await sharp(sourceImage)
        .resize(192, 192)
        .toFile(path.join(__dirname, '../public/icon-192x192.png'));
    console.log('✓ Generated icon-192x192.png');

    // Generate apple-touch-icon (180x180)
    await sharp(sourceImage)
        .resize(180, 180)
        .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');

    // Generate favicon sizes for ICO (16, 32, 48)
    const sizes = [16, 32, 48];
    for (const size of sizes) {
        await sharp(sourceImage)
            .resize(size, size)
            .toFile(path.join(__dirname, `../public/favicon-${size}x${size}.png`));
        console.log(`✓ Generated favicon-${size}x${size}.png`);
    }

    // For the app router favicon.ico, we need to generate a proper ICO file
    // Sharp doesn't support ICO directly, so we'll use the 32x32 PNG
    // and copy it as icon.png to src/app for Next.js to use
    await sharp(sourceImage)
        .resize(32, 32)
        .png()
        .toFile(path.join(__dirname, '../src/app/icon.png'));
    console.log('✓ Generated src/app/icon.png (32x32)');

    console.log('\nDone! All favicons generated.');
}

generateFavicons().catch(console.error);
