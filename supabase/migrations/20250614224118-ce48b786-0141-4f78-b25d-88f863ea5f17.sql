
-- Create a trigger function to set rooms.name = rooms.type if name is blank/null on insert
CREATE OR REPLACE FUNCTION public.set_room_name_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    IF NEW.type IS NOT NULL AND trim(NEW.type) <> '' THEN
      NEW.name := NEW.type;
    ELSE
      NEW.name := 'room';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the rooms table for inserts
DROP TRIGGER IF EXISTS set_room_name_before_insert ON public.rooms;

CREATE TRIGGER set_room_name_before_insert
BEFORE INSERT ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.set_room_name_on_insert();
