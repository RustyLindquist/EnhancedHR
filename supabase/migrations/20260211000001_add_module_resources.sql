-- Add module_id and order to resources for inline module placement
-- Resources with module_id = NULL continue as course-level resources (existing behavior)
-- Resources with module_id set appear inline within that module

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Index for efficient querying of resources within a module
CREATE INDEX IF NOT EXISTS idx_resources_module_id ON public.resources(module_id) WHERE module_id IS NOT NULL;

COMMENT ON COLUMN public.resources.module_id IS 'When set, resource appears inline within this module. NULL means course-level resource.';
COMMENT ON COLUMN public.resources."order" IS 'Display order within the module (shared ordering space with lessons)';
