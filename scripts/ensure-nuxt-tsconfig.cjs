#!/usr/bin/env node
const { existsSync, mkdirSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const nuxtDir = join(__dirname, '..', '.nuxt')
const targets = ['tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.shared.json'].map((file) => join(nuxtDir, file))

if (!existsSync(nuxtDir)) {
  mkdirSync(nuxtDir, { recursive: true })
}

for (const target of targets) {
  if (!existsSync(target)) {
    const contents = {
      extends: './tsconfig.json'
    }
    writeFileSync(target, `${JSON.stringify(contents, null, 2)}\n`)
  }
}
