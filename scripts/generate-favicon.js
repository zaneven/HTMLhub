import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const SVG_PATH = path.join(ROOT, 'public/favicon.svg')
const TMP_DIR = '/tmp/htmlhub-favicon'
const OUT_ICO = path.join(ROOT, 'public/favicon.ico')

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true })
}

// 1. 利用 macOS qlmanage 渲染出基础高清大图
execSync(`qlmanage -t -s 256 -o "${TMP_DIR}" "${SVG_PATH}"`, { stdio: 'pipe' })
const rawPng = path.join(TMP_DIR, 'favicon.svg.png')

if (!fs.existsSync(rawPng)) {
  console.error('Failed to generate base PNG from SVG')
  process.exit(1)
}

// 2. 利用 sips 生成 16, 32, 48, 64 四个尺寸
const sizes = [16, 32, 48, 64]
const pngBuffers = []

for (const size of sizes) {
  const targetPng = path.join(TMP_DIR, `icon_${size}.png`)
  execSync(`cp "${rawPng}" "${targetPng}"`)
  execSync(`sips -z ${size} ${size} "${targetPng}"`, { stdio: 'pipe' })
  pngBuffers.push({
    size,
    buffer: fs.readFileSync(targetPng)
  })
}

// 3. 构建多尺寸 ICO 格式数据
// Header: 6 bytes
// Entries: 16 bytes each
let offset = 6 + (sizes.length * 16)
const entryBuffers = []

for (const item of pngBuffers) {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(item.size, 0) // Width (16, 32, 48, 64)
  entry.writeUInt8(item.size, 1) // Height
  entry.writeUInt8(0, 2)         // Color count
  entry.writeUInt8(0, 3)         // Reserved
  entry.writeUInt16LE(1, 4)      // Color planes
  entry.writeUInt16LE(32, 6)     // Bits per pixel
  entry.writeUInt32LE(item.buffer.length, 8) // Image size in bytes
  entry.writeUInt32LE(offset, 12)            // Offset of image data
  
  entryBuffers.push(entry)
  offset += item.buffer.length
}

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // Reserved
header.writeUInt16LE(1, 2) // Type 1 = ICO
header.writeUInt16LE(sizes.length, 4) // Number of images

const icoBuffer = Buffer.concat([
  header,
  ...entryBuffers,
  ...pngBuffers.map(p => p.buffer)
])

fs.writeFileSync(OUT_ICO, icoBuffer)
console.log(`Successfully generated favicon.ico at ${OUT_ICO} with ${sizes.join(', ')} px layers.`)
