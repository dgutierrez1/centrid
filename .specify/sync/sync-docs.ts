#!/usr/bin/env node
/**
 * Sync Documentation Script
 *
 * Reads doc files from .specify/docs/ and generates
 * the quick reference table in CLAUDE.md
 *
 * Usage:
 *   npm run sync-docs
 */

import fs from 'fs'
import path from 'path'

interface Pattern {
  title: string
  summary: string
  file: string
}

function parseFrontmatter(content: string): { title?: string; summary?: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)

  if (!match) return {}

  const frontmatter = match[1]
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m)
  const summaryMatch = frontmatter.match(/^summary:\s*(.+)$/m)

  return {
    title: titleMatch?.[1]?.trim(),
    summary: summaryMatch?.[1]?.trim()
  }
}

function loadPatterns(): Pattern[] {
  console.log('📚 Loading doc files...')

  const patternsDir = '.specify/docs'

  if (!fs.existsSync(patternsDir)) {
    console.warn(`⚠️  Docs directory not found: ${patternsDir}`)
    return []
  }

  const files = fs.readdirSync(patternsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(patternsDir, f))

  if (files.length === 0) {
    console.warn('⚠️  No doc files found in .specify/docs/')
    return []
  }

  const patterns: Pattern[] = []

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      const { title, summary } = parseFrontmatter(content)

      if (!title || !summary) {
        console.warn(`⚠️  Pattern file ${file} missing frontmatter (title or summary)`)
        continue
      }

      patterns.push({
        title,
        summary,
        file: file.replace(/^\.\//, '')
      })
    } catch (error) {
      console.error(`❌ Failed to parse ${file}:`, error)
    }
  }

  // Sort alphabetically by title
  patterns.sort((a, b) => a.title.localeCompare(b.title))

  console.log(`✅ Loaded ${patterns.length} patterns`)
  return patterns
}

function generatePatternTable(patterns: Pattern[]): string {
  if (patterns.length === 0) {
    return '| Pattern | Summary | File |\n|---------|---------|------|\n| _(No patterns found)_ | | |'
  }

  const header = '| Pattern | Summary | File |'
  const separator = '|---------|---------|------|'
  const rows = patterns.map(p =>
    `| ${p.title} | ${p.summary} | [View](${p.file}) |`
  )

  return [header, separator, ...rows].join('\n')
}

function updateClaudeMd(patterns: Pattern[]): void {
  console.log('📝 Updating CLAUDE.md...')

  const claudeMdPath = 'CLAUDE.md'

  if (!fs.existsSync(claudeMdPath)) {
    console.error('❌ CLAUDE.md not found')
    process.exit(1)
  }

  let claudeMd = fs.readFileSync(claudeMdPath, 'utf-8')

  // Check if AUTO-GENERATED markers exist
  const autoGenRegex = /<!-- AUTO-GENERATED: DO NOT EDIT -->[\s\S]*?<!-- END AUTO-GENERATED -->/

  if (!autoGenRegex.test(claudeMd)) {
    console.error('❌ AUTO-GENERATED markers not found in CLAUDE.md')
    console.error('   Add these markers where you want the pattern table:')
    console.error('   <!-- AUTO-GENERATED: DO NOT EDIT -->')
    console.error('   <!-- END AUTO-GENERATED -->')
    process.exit(1)
  }

  // Generate table
  const table = generatePatternTable(patterns)
  const timestamp = new Date().toISOString()

  // Replace AUTO-GENERATED section
  const replacement = `<!-- AUTO-GENERATED: DO NOT EDIT -->
<!-- Source: .specify/docs/ -->
<!-- Last synced: ${timestamp} -->
<!-- To update: Edit doc files, then run: npm run sync-docs -->

${table}

<!-- END AUTO-GENERATED -->`

  claudeMd = claudeMd.replace(autoGenRegex, replacement)

  fs.writeFileSync(claudeMdPath, claudeMd)
  console.log(`✅ Updated CLAUDE.md with ${patterns.length} patterns`)
}

function main() {
  console.log('🔄 Starting documentation sync...\n')

  try {
    const patterns = loadPatterns()
    updateClaudeMd(patterns)

    console.log('\n✨ Documentation sync completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('   1. Review changes in CLAUDE.md')
    console.log('   2. Commit both doc files and CLAUDE.md')
  } catch (error) {
    console.error('\n❌ Sync failed:', error)
    process.exit(1)
  }
}

main()
