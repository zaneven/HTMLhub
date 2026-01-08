#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

// 配置
const config = {
  // 扫描的根目录（相对于项目根目录）
  scanDir: './public/html-files',
  // 忽略的目录
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', '.vscode', '.idea'],
  // 支持的文件扩展名
  supportedExtensions: ['.html', '.htm'],
  // 输出文件路径
  outputPath: './public/data/file-index.json'
}

/**
 * 扫描目录，生成分类和项目数据
 */
function scanProjects(rootDir) {
  const categories = []
  const projects = []

  if (!fs.existsSync(rootDir)) {
    console.warn(`目录不存在: ${rootDir}`)
    return { categories, projects }
  }

  // 扫描一级目录作为分类
  const categoryDirs = fs.readdirSync(rootDir)

  for (const categoryName of categoryDirs) {
    const categoryPath = path.join(rootDir, categoryName)
    const stats = fs.statSync(categoryPath)

    // 只处理目录作为分类
    if (!stats.isDirectory() || config.ignoreDirs.includes(categoryName)) {
      continue
    }

    const categoryId = Buffer.from(categoryName).toString('base64')
    const categoryProjects = []

    // 扫描二级目录/文件作为项目
    const items = fs.readdirSync(categoryPath)

    for (const item of items) {
      const itemPath = path.join(categoryPath, item)
      const itemStats = fs.statSync(itemPath)

      if (itemStats.isDirectory()) {
        // 检查目录是否有 index.html
        const indexPath = path.join(itemPath, 'index.html')
        if (fs.existsSync(indexPath)) {
          const indexStats = fs.statSync(indexPath)
          const relativePath = path.relative(process.cwd(), itemPath).replace(/\\/g, '/')
          const relativeIndexPath = path.relative(process.cwd(), indexPath).replace(/\\/g, '/')

          categoryProjects.push({
            id: Buffer.from(relativePath).toString('base64'),
            name: item,
            category: categoryName,
            path: relativePath,
            indexPath: relativeIndexPath,
            type: 'directory',
            createdAt: itemStats.birthtime.toISOString(),
            modifiedAt: indexStats.mtime.toISOString()
          })
        }
      } else if (itemStats.isFile()) {
        // 单个 HTML 文件也作为项目
        const ext = path.extname(item).toLowerCase()
        if (config.supportedExtensions.includes(ext)) {
          const relativePath = path.relative(process.cwd(), itemPath).replace(/\\/g, '/')
          const nameWithoutExt = path.basename(item, ext)

          categoryProjects.push({
            id: Buffer.from(relativePath).toString('base64'),
            name: nameWithoutExt,
            category: categoryName,
            path: relativePath,
            indexPath: relativePath,
            type: 'file',
            createdAt: itemStats.birthtime.toISOString(),
            modifiedAt: itemStats.mtime.toISOString()
          })
        }
      }
    }

    // 只有有项目的分类才添加
    if (categoryProjects.length > 0) {
      categories.push({
        id: categoryId,
        name: categoryName,
        projectCount: categoryProjects.length
      })

      projects.push(...categoryProjects)
    }
  }

  return { categories, projects }
}

/**
 * 主函数
 */
function main() {
  console.log('开始扫描项目...')

  const fullPath = path.resolve(config.scanDir)
  console.log(`扫描目录: ${fullPath}`)

  const { categories, projects } = scanProjects(fullPath)

  // 按分类名排序
  categories.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  // 按项目名排序
  projects.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  // 创建索引数据
  const indexData = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    stats: {
      totalCategories: categories.length,
      totalProjects: projects.length
    },
    categories,
    projects
  }

  // 确保输出目录存在
  const outputDir = path.dirname(config.outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // 写入索引文件
  fs.writeFileSync(config.outputPath, JSON.stringify(indexData, null, 2))

  console.log(`扫描完成！`)
  console.log(`- 找到 ${categories.length} 个分类`)
  console.log(`- 找到 ${projects.length} 个项目`)
  console.log(`- 索引文件已保存到: ${config.outputPath}`)
}

// 运行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { scanProjects }