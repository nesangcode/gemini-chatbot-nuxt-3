import { describe, it, expect, vi } from 'vitest'
import { transformMessage, prepareMessageContent } from './message-transformer'

// Mock the pdf-parser module
vi.mock('./pdf-parser', () => ({
  extractPdfText: vi.fn().mockResolvedValue('Sample PDF content extracted')
}))

describe('message-transformer', () => {
  describe('transformMessage', () => {
    it('should transform multimodal message with images', async () => {
      const msg = {
        role: 'user',
        content: {
          type: 'multimodal',
          text: 'Look at this image',
          images: [
            { data: 'base64data', mimeType: 'image/jpeg' }
          ]
        }
      }

      const result = await transformMessage(msg)

      expect(result).toEqual({
        role: 'user',
        content: [
          { type: 'text', text: 'Look at this image' },
          { type: 'image', image: 'base64data', mediaType: 'image/jpeg' }
        ]
      })
    })

    it('should transform multimodal message without mimeType', async () => {
      const msg = {
        role: 'user',
        content: {
          type: 'multimodal',
          text: 'Image without mime type',
          images: [
            { data: 'base64data' }
          ]
        }
      }

      const result = await transformMessage(msg)

      expect(result).toEqual({
        role: 'user',
        content: [
          { type: 'text', text: 'Image without mime type' },
          { type: 'image', image: 'base64data' }
        ]
      })
    })

    it('should process PDF file from array content', async () => {
      const msg = {
        role: 'user',
        content: [
          { type: 'text', text: 'Check this PDF' },
          { type: 'file', mediaType: 'application/pdf', data: 'base64pdfdata' }
        ]
      }

      const result = await transformMessage(msg)

      expect(result.role).toBe('user')
      expect(result.content).toHaveLength(2)
      expect(result.content[0]).toEqual({ type: 'text', text: 'Check this PDF' })
      expect(result.content[1]).toEqual({ type: 'text', text: '[Konten dari PDF]:\n\nSample PDF content extracted' })
    })

    it('should handle PDF without data field', async () => {
      const msg = {
        role: 'user',
        content: [
          { type: 'file', mediaType: 'application/pdf' }
        ]
      }

      const result = await transformMessage(msg)

      expect(result.content[0]).toEqual({ type: 'text', text: '[Error: Data PDF tidak ditemukan]' })
    })

    it('should transform plain text message', async () => {
      const msg = {
        role: 'assistant',
        content: 'Hello, how can I help you?'
      }

      const result = await transformMessage(msg)

      expect(result).toEqual({
        role: 'assistant',
        content: 'Hello, how can I help you?'
      })
    })

    it('should extract text from message.text field', async () => {
      const msg = {
        role: 'user',
        text: 'Text from text field'
      }

      const result = await transformMessage(msg)

      expect(result).toEqual({
        role: 'user',
        content: 'Text from text field'
      })
    })

    it('should extract text from message.parts field', async () => {
      const msg = {
        role: 'user',
        parts: [{ text: 'Text from parts field' }]
      }

      const result = await transformMessage(msg)

      expect(result).toEqual({
        role: 'user',
        content: 'Text from parts field'
      })
    })
  })

  describe('prepareMessageContent', () => {
    it('should prepare multimodal content with images', () => {
      const lastUserMessage = {
        content: [
          { type: 'text', text: 'Hello with images' }
        ]
      }
      const images = [
        { data: 'base64data1', mimeType: 'image/jpeg' },
        { data: 'base64data2', mimeType: 'image/png' }
      ]

      const result = prepareMessageContent(lastUserMessage, true, images, false, [])

      const parsed = JSON.parse(result)
      expect(parsed.type).toBe('multimodal')
      expect(parsed.text).toBe('Hello with images')
      expect(parsed.images).toHaveLength(2)
      expect(parsed.images[0]).toEqual({ data: 'base64data1', mimeType: 'image/jpeg' })
    })

    it('should prepare multimodal content with PDFs', () => {
      const lastUserMessage = {
        content: 'Message with PDF'
      }
      const pdfs = [
        { name: 'document.pdf', mimeType: 'application/pdf', size: 1024 }
      ]

      const result = prepareMessageContent(lastUserMessage, false, [], true, pdfs)

      const parsed = JSON.parse(result)
      expect(parsed.type).toBe('multimodal')
      expect(parsed.text).toBe('Message with PDF')
      expect(parsed.pdfs).toHaveLength(1)
      expect(parsed.pdfs[0]).toEqual({ mimeType: 'application/pdf', name: 'document.pdf', size: 1024 })
    })

    it('should prepare multimodal content with both images and PDFs', () => {
      const lastUserMessage = {
        content: [
          { type: 'text', text: 'Message with both' }
        ]
      }
      const images = [{ data: 'imagedata', mimeType: 'image/jpeg' }]
      const pdfs = [{ name: 'doc.pdf', mimeType: 'application/pdf', size: 2048 }]

      const result = prepareMessageContent(lastUserMessage, true, images, true, pdfs)

      const parsed = JSON.parse(result)
      expect(parsed.type).toBe('multimodal')
      expect(parsed.text).toBe('Message with both')
      expect(parsed.images).toHaveLength(1)
      expect(parsed.pdfs).toHaveLength(1)
    })

    it('should handle text-only content from array', () => {
      const lastUserMessage = {
        content: [
          { type: 'text', text: 'Simple text message' }
        ]
      }

      const result = prepareMessageContent(lastUserMessage, false, [], false, [])

      expect(result).toBe('Simple text message')
    })

    it('should handle plain string content', () => {
      const lastUserMessage = {
        content: 'Plain string content'
      }

      const result = prepareMessageContent(lastUserMessage, false, [], false, [])

      expect(result).toBe('Plain string content')
    })

    it('should extract text from text field', () => {
      const lastUserMessage = {
        text: 'Content from text field'
      }

      const result = prepareMessageContent(lastUserMessage, false, [], false, [])

      expect(result).toBe('Content from text field')
    })

    it('should extract text from parts field', () => {
      const lastUserMessage = {
        parts: [{ text: 'Content from parts' }]
      }

      const result = prepareMessageContent(lastUserMessage, false, [], false, [])

      expect(result).toBe('Content from parts')
    })

    it('should use default mimeType for images without one', () => {
      const lastUserMessage = {
        content: 'Image without mime'
      }
      const images = [{ data: 'imagedata' }]

      const result = prepareMessageContent(lastUserMessage, true, images, false, [])

      const parsed = JSON.parse(result)
      expect(parsed.images[0].mimeType).toBe('image/jpeg')
    })
  })
})
