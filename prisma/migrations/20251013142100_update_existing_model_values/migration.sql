-- Update existing records with old model values to new ones
UPDATE "chat_sessions" 
SET "model" = 'gemini-2.5-flash' 
WHERE "model" = 'gemini-2.0-flash-exp' 
   OR "model" = 'gemini-1.5-flash'
   OR "model" = 'gemini-2.5-flash-exp';

UPDATE "chat_sessions" 
SET "model" = 'gemini-2.5-pro' 
WHERE "model" = 'gemini-2.5-pro-exp' 
   OR "model" = 'gemini-1.5-pro';

UPDATE "chat_sessions" 
SET "model" = 'gemini-2.0-flash' 
WHERE "model" = 'gemini-1.5-flash-8b'
   OR "model" = 'gemini-2.0-flash-8b'
   OR "model" = 'gemini-2.0-flash-lite'
   OR "model" = 'gemini-2.5-flash-8b'
   OR "model" = 'gemini-2.5-flash-lite';
