
-- 1. Add a "name" column to the "rooms" table (nullable, users can later fill it in)
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. For ALL existing rooms, set .name to .type (if name is null or blank, and type is not blank)
UPDATE public.rooms
SET name = type
WHERE (name IS NULL OR trim(name) = '')
  AND type IS NOT NULL AND trim(type) <> '';

-- 3. For any rooms left with null/blank name, set to 'room' (if type is also blank)
UPDATE public.rooms
SET name = 'room'
WHERE (name IS NULL OR trim(name) = '')
  AND (type IS NULL OR trim(type) = '');

-- 4. Ensure future rooms default to blank in "name" (developer can encourage users to fill, but don't force)
-- No default needed, since blank/null is allowed

-- 5. No changes to the front-end/web app; all changes are to DB structure/data only
