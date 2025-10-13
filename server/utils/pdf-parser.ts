// Robust Nuxt/Nitro-friendly PDF text extraction
// Uses pdf-parse v2 API: new PDFParse({ data: buffer })

import type { Buffer as NodeBuffer } from 'node:buffer';
import { createRequire } from 'node:module';

function toBuffer(input: NodeBuffer | ArrayBuffer | Uint8Array): NodeBuffer {
  if (Buffer.isBuffer(input)) return input as NodeBuffer;
  if (input instanceof ArrayBuffer) return Buffer.from(new Uint8Array(input));
  return Buffer.from(input as Uint8Array);
}

/**
 * Extract text from PDF buffer using pdf-parse v2 API
 * @param pdfBuffer - Buffer containing PDF data (supports Buffer, ArrayBuffer, Uint8Array)
 * @param maxChars - Maximum characters to extract (default: 50000)
 * @returns Extracted text content
 */
export async function extractPdfText(
  pdfBuffer: NodeBuffer | ArrayBuffer | Uint8Array,
  maxChars: number = 50000
): Promise<string> {
  const buf = toBuffer(pdfBuffer);
  if (!buf?.length) throw new Error('[PDF Parser] Empty buffer received');

  let parser: any = null;
  
  try {
    // Use createRequire for reliable CommonJS module loading
    const require = createRequire(import.meta.url);
    const { PDFParse } = require('pdf-parse');
    
    // v2 API: new PDFParse({ data: buffer })
    parser = new PDFParse({ data: buf });
    
    // Get text from parser
    const result = await parser.getText();
    
    // Guard + minor cleanup (some PDFs include null chars)
    let text = typeof result?.text === 'string' ? result.text.replace(/\u0000/g, '') : '';
    
    // Truncate if exceeds max characters
    const originalLength = text.length;
    const wasTruncated = text.length > maxChars;
    
    if (wasTruncated) {
      text = text.substring(0, maxChars);
      // Add truncation notice
      text += `\n\n[... Dokumen dipotong karena terlalu panjang. Menampilkan ${maxChars.toLocaleString()} dari ${originalLength.toLocaleString()} karakter total.]`;
    }
    
    console.log('[PDF Parser] Extraction successful:', {
      pages: result.numpages || 'N/A',
      originalLength,
      finalLength: text.length,
      truncated: wasTruncated
    });
    
    return text;
  } catch (err: any) {
    console.error('[PDF Parser] Failed to parse PDF:', err?.message || err);
    throw new Error(`[PDF Parser] Failed to parse PDF: ${err?.message || err}`);
  } finally {
    // Clean up parser resources
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (destroyErr) {
        console.warn('[PDF Parser] Failed to destroy parser:', destroyErr);
      }
    }
  }
}
