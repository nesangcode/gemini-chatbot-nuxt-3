#!/usr/bin/env node
const { spawn } = require('node:child_process')
const { existsSync, mkdirSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const nuxtDir = join(__dirname, '..', '.nuxt')
const targets = ['tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.shared.json'].map((file) => join(nuxtDir, file))

const ensureTsConfigs = () => {
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
}

ensureTsConfigs()
const interval = setInterval(() => {
  try {
    ensureTsConfigs()
  } catch {
    // ignore transient errors while Nuxt rebuilds the directory
  }
}, 200)

const child = spawn('nuxt', ['build'], {
  stdio: 'inherit',
  shell: true
})

child.on('close', (code) => {
  clearInterval(interval)
  process.exit(code ?? 0)
})
