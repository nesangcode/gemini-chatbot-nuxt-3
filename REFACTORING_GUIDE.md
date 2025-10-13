# Chat.vue Refactoring Guide

## Problem
The original `chat.vue` was bloated with **1374 lines** containing:
- Session management logic
- Message handling logic  
- File upload logic
- UI components mixed with business logic
- Too many responsibilities in one file

## Solution: Separation of Concerns

### 1. **Composables** (Business Logic)

#### `composables/use-chat-sessions.ts`
Manages chat session operations:
- Fetch sessions list
- Create new chat
- Delete session
- Rename session
- Load more sessions (pagination)
- Session state management

#### `composables/use-chat-messages.ts`
Handles message operations:
- Fetch messages for a session
- Load older messages (pagination)
- Message transformation (API ↔ UI format)
- Extract images/PDFs/text from messages
- Scroll position management

#### `composables/use-file-upload.ts`
Manages file upload functionality:
- Image selection and preview
- PDF selection and preview
- File removal
- Base64 encoding
- File size formatting

### 2. **Components** (UI)

#### `components/chat/ChatSidebar.vue`
Sidebar with:
- User info & sign out
- New chat button
- Sessions list
- Load more button
- Error handling

**Props:**
- `sessions`, `currentSessionId`, `loadingSessionId`
- `error`, `pagination`, `user`

**Events:**
- `create-chat`, `select-session`, `delete-session`
- `load-more`, `clear-error`

#### `components/chat/ChatMessage.vue`
Individual message display:
- Avatar (user/AI)
- Images preview
- PDF attachments
- Markdown formatted text
- Role-based styling

**Props:**
- `message`, `images`, `pdfs`, `text`

#### `components/chat/ChatInput.vue`
Message input area:
- Text textarea
- Image upload button
- PDF upload button
- File previews
- Send/Stop button
- Keyboard shortcuts

**Props:**
- `modelValue`, `canSend`, `disabled`
- `isBusy`, `selectedImages`, `selectedPdfs`

**Events:**
- `update:modelValue`, `send`, `stop`
- `trigger-image-upload`, `trigger-pdf-upload`
- `remove-image`, `remove-pdf`

### 3. **New Chat Page** (`pages/chat-new.vue`)

Clean, focused page with **~300 lines**:
- Import composables
- Setup AI SDK Chat
- Handle events from components
- Coordinate between composables
- Minimal UI logic

## Benefits

### ✅ Maintainability
- Each file has single responsibility
- Easy to find and fix bugs
- Clear separation of concerns

### ✅ Reusability
- Composables can be used in other pages
- Components can be reused
- Logic is decoupled from UI

### ✅ Testability
- Composables can be unit tested
- Components can be tested in isolation
- Mock dependencies easily

### ✅ Readability
- Smaller files are easier to understand
- Clear naming conventions
- Better code organization

### ✅ Performance
- Tree-shaking friendly
- Lazy load components if needed
- Easier to optimize individual parts

## Migration Steps

1. **Keep old file**: Rename `chat.vue` → `chat-old.vue`
2. **Test new version**: Rename `chat-new.vue` → `chat.vue`
3. **Test thoroughly**: Check all features work
4. **Remove old**: Delete `chat-old.vue` when confident

## File Structure

```
pages/
  chat.vue (NEW - 300 lines)
  
composables/
  use-chat-sessions.ts (165 lines)
  use-chat-messages.ts (160 lines)
  use-file-upload.ts (120 lines)
  
components/
  chat/
    ChatSidebar.vue (150 lines)
    ChatMessage.vue (80 lines)
    ChatInput.vue (120 lines)
```

**Total Lines**: ~1095 (vs 1374 original)
**Better organized**: 7 focused files vs 1 bloated file

## Testing Checklist

- [ ] Create new chat session
- [ ] Select existing session
- [ ] Send text message
- [ ] Send message with images
- [ ] Send message with PDFs
- [ ] Load older messages
- [ ] Delete session
- [ ] Switch between sessions
- [ ] Change AI model
- [ ] Stop generation
- [ ] Error handling
- [ ] Responsive UI
- [ ] Keyboard shortcuts
