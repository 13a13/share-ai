
-- PHASE 1.1: Create New room_images Table (Primary Source of Truth)
CREATE TABLE public.room_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_room_images_room_id ON public.room_images(room_id);
CREATE INDEX idx_room_images_inspection_id ON public.room_images(inspection_id);
CREATE INDEX idx_room_images_created_at ON public.room_images(created_at);

-- Enable RLS
ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their own room images" ON public.room_images
  FOR SELECT USING (
    room_id IN (
      SELECT r.id FROM rooms r 
      JOIN properties p ON r.property_id = p.id 
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own room images" ON public.room_images
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT r.id FROM rooms r 
      JOIN properties p ON r.property_id = p.id 
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own room images" ON public.room_images
  FOR UPDATE USING (
    room_id IN (
      SELECT r.id FROM rooms r 
      JOIN properties p ON r.property_id = p.id 
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own room images" ON public.room_images
  FOR DELETE USING (
    room_id IN (
      SELECT r.id FROM rooms r 
      JOIN properties p ON r.property_id = p.id 
      WHERE p.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_room_images_updated_at
  BEFORE UPDATE ON public.room_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PHASE 1.2: Data Migration from Old to New Table
INSERT INTO public.room_images (id, room_id, inspection_id, url, analysis, created_at)
SELECT 
  ii.id,
  i.room_id,
  ii.inspection_id,
  ii.image_url,
  ii.analysis,
  ii.created_at
FROM public.inspection_images ii
JOIN public.inspections i ON ii.inspection_id = i.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.room_images ri WHERE ri.id = ii.id
);
