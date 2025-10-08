import { defineNuxtPlugin } from '#app'
import MarkdownIt from 'markdown-it'

type RenderMarkdown = (content: string | null | undefined) => string

declare module '#app' {
  interface NuxtApp {
    $renderMarkdown: RenderMarkdown
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $renderMarkdown: RenderMarkdown
  }
}

export default defineNuxtPlugin(() => {
  const parser = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true
  })

  const defaultLinkRenderer = parser.renderer.rules.link_open ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
  parser.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
    return defaultLinkRenderer(tokens, idx, options, env, self)
  }

  const renderMarkdown: RenderMarkdown = (content) => parser.render(content ?? '')

  return {
    provide: {
      renderMarkdown
    }
  }
})
