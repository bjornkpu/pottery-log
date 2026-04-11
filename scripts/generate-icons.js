import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')
const svgBuffer = readFileSync(resolve(publicDir, 'logo.svg'))

// Standard icons
for (const size of [192, 512]) {
  await sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(publicDir, `logo${size}.png`))
  console.log(`✓ logo${size}.png`)
}

// Maskable icon — logo at ~80% inset on solid background
const maskableSize = 512
const logoInset = Math.round(maskableSize * 0.1) // 10% padding on each side = 80% logo
const logoSize = maskableSize - logoInset * 2

const logoResized = await sharp(svgBuffer)
  .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 0xe7, g: 0xf3, b: 0xec, alpha: 1 }, // #e7f3ec (bg-base)
  },
})
  .composite([{ input: logoResized, left: logoInset, top: logoInset }])
  .png()
  .toFile(resolve(publicDir, 'logo512-maskable.png'))
console.log('✓ logo512-maskable.png')

// Favicon — 32x32 PNG wrapped in ICO container
const favicon32 = await sharp(svgBuffer)
  .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

// Minimal ICO format: single 32x32 PNG entry
const icoHeader = Buffer.alloc(6)
icoHeader.writeUInt16LE(0, 0)     // reserved
icoHeader.writeUInt16LE(1, 2)     // ICO type
icoHeader.writeUInt16LE(1, 4)     // 1 image

const icoEntry = Buffer.alloc(16)
icoEntry.writeUInt8(32, 0)        // width
icoEntry.writeUInt8(32, 1)        // height
icoEntry.writeUInt8(0, 2)         // color palette
icoEntry.writeUInt8(0, 3)         // reserved
icoEntry.writeUInt16LE(1, 4)      // color planes
icoEntry.writeUInt16LE(32, 6)     // bits per pixel
icoEntry.writeUInt32LE(favicon32.length, 8)   // image size
icoEntry.writeUInt32LE(6 + 16, 12)            // offset (header + entry)

const ico = Buffer.concat([icoHeader, icoEntry, favicon32])
writeFileSync(resolve(publicDir, 'favicon.ico'), ico)
console.log('✓ favicon.ico')

console.log('\nDone! All icons generated in public/')
