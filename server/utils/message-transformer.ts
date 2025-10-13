import { extractPdfText } from './pdf-parser'

/**
 * Transform messages from @ai-sdk/vue format to AI SDK format
 */
export async function transformMessage(msg: any): Promise<any> {
  // Multimodal object from DB - reconstruct content parts
  if (msg.content?.type === 'multimodal') {
    const contentParts: any[] = [
      { type: 'text', text: msg.content.text || '' }
    ]
    
    msg.content.images?.forEach((img: any) => {
      contentParts.push({
        type: 'image',
        image: img.data,
        ...(img.mimeType && { mediaType: img.mimeType })
      })
    })
    
    return { role: msg.role, content: contentParts }
  }
  
  // Array content from client - process PDFs
  if (Array.isArray(msg.content)) {
    const processedContent = await Promise.all(msg.content.map(async (part: any) => {
      if (part.type === 'file' && (part.mediaType === 'application/pdf' || part.mimeType === 'application/pdf')) {
        try {
          console.log('[Transform] Processing PDF file, data length:', part.data?.length || 0)
          
          if (!part.data) {
            console.error('[Transform] PDF part missing data field')
            return { type: 'text', text: '[Error: Data PDF tidak ditemukan]' }
          }
          
          const pdfBuffer = Buffer.from(part.data, 'base64')
          console.log('[Transform] Created buffer, size:', pdfBuffer.length)
          
          const extractedText = await extractPdfText(pdfBuffer)
          console.log('[Transform] Extracted text length:', extractedText?.length || 0)
          
          return { type: 'text', text: `[Konten dari PDF]:\n\n${extractedText}` }
        } catch (err: any) {
          console.error('[Transform] PDF extraction error:', err?.message || err)
          return { type: 'text', text: `[Error: Tidak dapat membaca konten PDF - ${err?.message || 'Unknown error'}]` }
        }
      }
      return part
    }))
    
    return { role: msg.role, content: processedContent }
  }
  
  // Plain text
  const textContent = msg.text || msg.parts?.[0]?.text || msg.content || ''
  return { role: msg.role, content: textContent }
}

/**
 * Prepare user message content for DB storage
 */
export function prepareMessageContent(
  lastUserMessage: any,
  hasImages: boolean,
  images: any[],
  hasPdfs: boolean,
  pdfs: any[]
): string {
  if ((hasImages && images.length > 0) || (hasPdfs && pdfs.length > 0)) {
    let textContent = ''
    if (Array.isArray(lastUserMessage.content)) {
      const textPart = lastUserMessage.content.find((part: any) => part.type === 'text')
      textContent = textPart?.text || ''
    } else {
      textContent = lastUserMessage.content || ''
    }
    
    const multimodalData: any = { type: 'multimodal', text: textContent }
    
    if (hasImages && images.length > 0) {
      multimodalData.images = images.map((img: any) => ({
        data: img.data,
        mimeType: img.mimeType || 'image/jpeg'
      }))
    }
    
    if (hasPdfs && pdfs.length > 0) {
      multimodalData.pdfs = pdfs.map((pdf: any) => ({
        mimeType: pdf.mimeType || 'application/pdf',
        name: pdf.name,
        size: pdf.size
      }))
    }
    
    return JSON.stringify(multimodalData)
  }
  
  // Handle content array format (text-only with array structure)
  if (Array.isArray(lastUserMessage.content)) {
    const textPart = lastUserMessage.content.find((part: any) => part.type === 'text')
    return textPart?.text || ''
  }
  
  return lastUserMessage.text || lastUserMessage.parts?.[0]?.text || lastUserMessage.content || ''
}
