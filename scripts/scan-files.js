#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

// 配置
const config = {
  // 扫描的根目录（相对于项目根目录）
  scanDirs: ['./public/html-files'],
  // 忽略的目录
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', '.vscode', '.idea'],
  // 支持的文件扩展名
  supportedExtensions: ['.html', '.htm'],
  // 输出文件路径
  outputPath: './public/data/file-index.json'
}

/**
 * 获取文件的基本信息
 */
function getFileInfo(filePath) {
  const stats = fs.statSync(filePath)
  const relativePath = path.relative(process.cwd(), filePath)
  const fileName = path.basename(filePath)
  const fileExt = path.extname(filePath)
  const fileNameWithoutExt = path.basename(filePath, fileExt)
  
  return {
    id: Buffer.from(relativePath).toString('base64'),
    name: fileName,
    nameWithoutExt: fileNameWithoutExt,
    path: relativePath,
    absolutePath: filePath,
    extension: fileExt,
    size: stats.size,
    createdAt: stats.birthtime.toISOString(),
    modifiedAt: stats.mtime.toISOString(),
    category: categorizeFile(fileName, relativePath),
    tags: extractTags(fileName, relativePath)
  }
}

/**
 * 文件分类
 */
function categorizeFile(fileName, filePath) {
  const lowerName = fileName.toLowerCase()
  const lowerPath = filePath.toLowerCase()
  
  // 基于文件名的分类
  if (lowerName.includes('index')) return 'index'
  if (lowerName.includes('home') || lowerName.includes('main')) return 'main'
  if (lowerName.includes('about')) return 'about'
  if (lowerName.includes('contact')) return 'contact'
  if (lowerName.includes('blog') || lowerName.includes('article')) return 'blog'
  if (lowerName.includes('product')) return 'product'
  if (lowerName.includes('service')) return 'service'
  if (lowerName.includes('portfolio')) return 'portfolio'
  if (lowerName.includes('gallery')) return 'gallery'
  if (lowerName.includes('news')) return 'news'
  if (lowerName.includes('doc') || lowerName.includes('help')) return 'documentation'
  if (lowerName.includes('login') || lowerName.includes('register')) return 'auth'
  if (lowerName.includes('admin') || lowerName.includes('dashboard')) return 'admin'
  if (lowerName.includes('error') || lowerName.includes('404')) return 'error'
  
  // 基于路径的分类
  if (lowerPath.includes('/admin/')) return 'admin'
  if (lowerPath.includes('/blog/')) return 'blog'
  if (lowerPath.includes('/docs/')) return 'documentation'
  if (lowerPath.includes('/examples/')) return 'example'
  if (lowerPath.includes('/templates/')) return 'template'
  if (lowerPath.includes('/components/')) return 'component'
  
  return 'other'
}

/**
 * 提取标签
 */
function extractTags(fileName, filePath) {
  const tags = []
  const lowerName = fileName.toLowerCase()
  const lowerPath = filePath.toLowerCase()
  
  // 基于文件名的标签
  if (lowerName.includes('responsive')) tags.push('responsive')
  if (lowerName.includes('mobile')) tags.push('mobile')
  if (lowerName.includes('desktop')) tags.push('desktop')
  if (lowerName.includes('dark')) tags.push('dark-theme')
  if (lowerName.includes('light')) tags.push('light-theme')
  if (lowerName.includes('bootstrap')) tags.push('bootstrap')
  if (lowerName.includes('jquery')) tags.push('jquery')
  if (lowerName.includes('vue')) tags.push('vue')
  if (lowerName.includes('react')) tags.push('react')
  if (lowerName.includes('angular')) tags.push('angular')
  
  // 基于路径的标签
  const pathParts = lowerPath.split('/')
  pathParts.forEach(part => {
    if (part && part !== '.' && part !== '..' && !part.includes('.')) {
      tags.push(part)
    }
  })
  
  return [...new Set(tags)] // 去重
}

/**
 * 递归扫描目录
 */
function scanDirectory(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`目录不存在: ${dirPath}`)
    return files
  }
  
  const items = fs.readdirSync(dirPath)
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item)
    const stats = fs.statSync(itemPath)
    
    if (stats.isDirectory()) {
      // 检查是否为忽略的目录
      if (!config.ignoreDirs.includes(item)) {
        scanDirectory(itemPath, files)
      }
    } else if (stats.isFile()) {
      const ext = path.extname(item).toLowerCase()
      if (config.supportedExtensions.includes(ext)) {
        try {
          const fileInfo = getFileInfo(itemPath)
          files.push(fileInfo)
        } catch (error) {
          console.error(`处理文件时出错 ${itemPath}:`, error.message)
        }
      }
    }
  }
  
  return files
}

/**
 * 生成统计信息
 */
function generateStats(files) {
  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    categories: {},
    extensions: {},
    lastScan: new Date().toISOString()
  }
  
  files.forEach(file => {
    // 分类统计
    stats.categories[file.category] = (stats.categories[file.category] || 0) + 1
    
    // 扩展名统计
    stats.extensions[file.extension] = (stats.extensions[file.extension] || 0) + 1
  })
  
  return stats
}

/**
 * 主函数
 */
function main() {
  console.log('开始扫描HTML文件...')
  
  const allFiles = []
  
  // 扫描配置的目录
  for (const scanDir of config.scanDirs) {
    const fullPath = path.resolve(scanDir)
    console.log(`扫描目录: ${fullPath}`)
    scanDirectory(fullPath, allFiles)
  }
  
  // 生成统计信息
  const stats = generateStats(allFiles)
  
  // 创建索引数据
  const indexData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    stats,
    files: allFiles.sort((a, b) => a.name.localeCompare(b.name))
  }
  
  // 确保输出目录存在
  const outputDir = path.dirname(config.outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // 写入索引文件
  fs.writeFileSync(config.outputPath, JSON.stringify(indexData, null, 2))
  
  console.log(`扫描完成！`)
  console.log(`- 找到 ${stats.totalFiles} 个HTML文件`)
  console.log(`- 总大小: ${(stats.totalSize / 1024).toFixed(2)} KB`)
  console.log(`- 分类: ${Object.keys(stats.categories).join(', ')}`)
  console.log(`- 索引文件已保存到: ${config.outputPath}`)
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { scanDirectory, getFileInfo, categorizeFile, extractTags }