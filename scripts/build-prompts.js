#!/usr/bin/env node
/**
 * 编译 src/data/prompts/*.md 为 src/data/prompts.json
 *
 * 在每次 build 前自动跑(配在 package.json 的 prebuild hook)
 *
 * 也可以手动:  npm run build:prompts
 */
const fs = require('node:fs');
const path = require('node:path');

const PROMPTS_DIR = path.join(__dirname, '..', 'src', 'data', 'prompts');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'prompts.json');

function parseFrontmatter(raw) {
  // 匹配 --- ... --- ... (Unix or Windows line endings)
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, content: raw.trim() };
  }
  const yaml = match[1];
  const content = match[2].trim();
  const meta = {};

  // 极简 YAML 解析(只处理我们用到的字段:string / number / array)
  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^(\w+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let value = m[2].trim();

    // 数组:[a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      meta[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      continue;
    }
    // 去掉引号
    value = value.replace(/^['"]|['"]$/g, '');
    meta[key] = value;
  }

  return { meta, content };
}

function compile() {
  if (!fs.existsSync(PROMPTS_DIR)) {
    console.warn(`[build-prompts] Directory not found: ${PROMPTS_DIR}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ prompts: [] }, null, 2));
    return;
  }

  const files = fs
    .readdirSync(PROMPTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const prompts = [];
  for (const file of files) {
    const full = path.join(PROMPTS_DIR, file);
    const raw = fs.readFileSync(full, 'utf-8');
    const { meta, content } = parseFrontmatter(raw);

    if (!meta.id) {
      console.warn(`[build-prompts] Skipping ${file} - missing 'id' in frontmatter`);
      continue;
    }
    if (!meta.name) {
      console.warn(`[build-prompts] Skipping ${file} - missing 'name' in frontmatter`);
      continue;
    }
    if (!content) {
      console.warn(`[build-prompts] Skipping ${file} - empty content`);
      continue;
    }

    prompts.push({
      id: meta.id,
      name: meta.name,
      description: meta.description || undefined,
      category: meta.category || undefined,
      sourceLang: meta.sourceLang || undefined,
      targetLangs: Array.isArray(meta.targetLangs) ? meta.targetLangs : undefined,
      tags: Array.isArray(meta.tags) ? meta.tags : undefined,
      content,
      isBuiltin: true,
    });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ prompts }, null, 2));
  console.log(`[build-prompts] Compiled ${prompts.length} prompt(s) → ${OUTPUT_FILE}`);
  for (const p of prompts) console.log(`  · ${p.id} — ${p.name}`);
}

compile();
