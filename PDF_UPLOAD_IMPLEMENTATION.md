# PDF Upload Implementation - Vercel AI SDK Standards

## Overview
This implementation follows **Vercel AI SDK** standards for handling file uploads, specifically PDFs, in a Nuxt 3 chat application with Google Gemini AI.

## Architecture

### Frontend (`pages/chat.vue`)
Uses `@ai-sdk/vue` Chat composable following AI SDK UI patterns:
- **Message Structure**: Uses `CoreMessage` format with content parts array
- **Content Parts**: `TextPart`, `ImagePart`, and custom `FilePart` for PDFs
- **Standard Methods**: `chat.sendMessage()` with proper message format

```typescript
// AI SDK CoreMessage format
{
  content: [
    { type: 'text', text: 'user message' },           // TextPart
    { type: 'image', image: base64, mimeType: '...' }, // ImagePart
    { type: 'file', data: base64, mimeType: 'application/pdf' } // FilePart
  ]
}
```

### Backend (`server/api/chat.post.ts`)
Uses `ai` package with `streamText` function:
- **Model Integration**: `@ai-sdk/google` with Gemini 2.0 Flash
- **Message Transformation**: Converts Vue messages to AI SDK format
- **PDF Processing**: Extracts text using `pdf-parse` library
- **Text Extraction**: PDFs converted to `TextPart` since Gemini doesn't support PDF natively

## Why This Approach?

### 1. **Gemini Doesn't Support PDF Natively**
Unlike images (which Gemini can process via vision API), PDFs must be converted to text first. This is standard practice for LLMs without native document processing.

### 2. **AI SDK Content Parts**
Following AI SDK's `CoreMessage` structure:
- **TextPart**: `{ type: 'text', text: string }`
- **ImagePart**: `{ type: 'image', image: string | URL, mimeType?: string }`
- **FilePart**: Custom extension for PDFs (converted to text server-side)

### 3. **Server-Side Processing**
PDF text extraction happens on the server:
- Protects sensitive documents (not exposed in client logs)
- Better performance (pdf-parse runs in Node.js)
- Follows security best practices

## Key Components

### Frontend Features
- ✅ Multiple file upload support
- ✅ File validation (type, size)
- ✅ Preview with metadata (name, size)
- ✅ Loading states
- ✅ Error handling
- ✅ AI SDK message format compliance

### Backend Features
- ✅ PDF text extraction via `pdf-parse`
- ✅ Base64 to Buffer conversion
- ✅ Error handling for corrupt PDFs
- ✅ Message persistence in database
- ✅ Multimodal content support (text + image + PDF)

## Data Flow

```
User uploads PDF → Frontend converts to base64 → 
Sends as FilePart in content array →
Backend receives message → Extracts PDF text →
Converts to TextPart → Sends to Gemini AI →
AI processes text → Response streamed back
```

## Database Storage

Multimodal messages stored as JSON:
```json
{
  "type": "multimodal",
  "text": "user question",
  "images": [...],
  "pdfs": [
    {
      "data": "base64...",
      "mimeType": "application/pdf",
      "name": "document.pdf",
      "size": 102400
    }
  ]
}
```

## AI SDK Compliance

### ✅ Uses Official Packages
- `@ai-sdk/vue` - Vue composables
- `@ai-sdk/google` - Google provider
- `ai` - Core SDK

### ✅ Standard Message Format
- `CoreMessage` structure
- Content parts array
- Proper type annotations

### ✅ Streaming Support
- `streamText()` for responses
- `toTextStreamResponse()` for API response
- Text streaming protocol

### ✅ Error Handling
- Network errors
- API errors
- Validation errors

## Important Notes

1. **PDF Size Limit**: 10MB per file (configurable)
2. **Text Extraction**: Uses `pdf-parse` library
3. **No Native PDF Support**: Gemini processes extracted text, not PDF directly
4. **Security**: PDFs processed server-side only
5. **Performance**: Text extraction may take time for large PDFs

## References

- [Vercel AI SDK Documentation](https://sdk.vercel.ai)
- [AI SDK Core - CoreMessage](https://sdk.vercel.ai/docs/reference/ai-sdk-core/core-message)
- [AI SDK UI - useChat](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat)
- [Google Gemini API](https://ai.google.dev)

## Future Improvements

- [ ] OCR support for scanned PDFs
- [ ] PDF page selection
- [ ] Progress indicator for large files
- [ ] Chunking for very large PDFs
- [ ] Support for other document types (DOCX, TXT)
