# Model Selection Feature

## Overview
This feature allows users to select different Gemini AI models for their chat sessions. Each chat session can use a different model, and the model can be changed at any time.

## Available Models
- **Gemini 2.5 Pro** (gemini-2.5-pro) - Most capable model for complex tasks
- **Gemini 2.5 Flash** (gemini-2.5-flash) - Fast and efficient, great for most tasks (default)

## Implementation Details

### Database Changes
- Added `model` field to `ChatSession` table with default value `'gemini-2.5-flash'`
- Migrations:
  - `20251013140616_add_model_to_chat_session` - Initial model field
  - `20251013141236_update_default_model_to_gemini_2_5_flash` - Updated default model
  - `20251013141814_fix_model_ids_remove_exp_suffix` - Fixed model IDs to match actual API

### Backend Changes

#### API Endpoints
1. **POST `/api/chat/sessions`**
   - Now accepts optional `model` parameter in request body
   - Creates new session with specified model

2. **GET `/api/chat/sessions`**
   - Returns `model` field for each session

3. **PATCH `/api/chat/sessions/[id]/model`** (NEW)
   - Updates the model for an existing session
   - Validates user ownership before updating

4. **POST `/api/chat`**
   - Reads model from session and uses it for AI requests
   - Fallback to default model if not specified

### Frontend Changes

#### New Component
- **`components/ModelSelector.vue`**
  - Dropdown component for selecting AI models
  - Shows model name and description
  - Visual indicator for active model
  - Disabled state when chat is busy

#### Chat Page Updates
- Added model selector to chat header
- Model persists per session
- Auto-updates when switching between sessions
- Creates new sessions with currently selected model
- Real-time model switching for active sessions

## User Experience

### Creating New Chat
1. User can select desired model from dropdown
2. Click "Chat Baru" to create new session with selected model
3. Model is saved with the session

### Switching Models
1. Select different model from dropdown in chat header
2. Model is immediately updated for current session
3. Next message will use the new model
4. Model change persists in database

### Switching Sessions
- Model selector automatically updates to show the current session's model
- Each session maintains its own model selection

## Technical Notes
- Model selection is disabled while chat is streaming to prevent inconsistencies
- Model updates are optimistic (UI updates immediately, then syncs with backend)
- Error handling for model update failures
- Graceful fallback to default model if session model is missing
