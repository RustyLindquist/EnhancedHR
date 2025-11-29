-- Add org_id to user_collections to support Org-level collections
ALTER TABLE public.user_collections
ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_org_collection BOOLEAN DEFAULT false;

-- RLS Policies for Org Collections

-- 1. Org Admins can manage collections for their org
CREATE POLICY "Org Admins can manage org collections"
ON public.user_collections
FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM public.profiles 
        WHERE id = auth.uid() AND membership_status = 'org_admin'
    )
);

-- 2. Org Members can view org collections
CREATE POLICY "Org Members can view org collections"
ON public.user_collections
FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM public.profiles 
        WHERE id = auth.uid() AND (membership_status = 'employee' OR membership_status = 'org_admin')
    )
);

-- 3. Org Members can view items in org collections
CREATE POLICY "Org Members can view org collection items"
ON public.collection_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_collections uc
        WHERE uc.id = collection_items.collection_id
        AND uc.org_id IN (
            SELECT org_id FROM public.profiles 
            WHERE id = auth.uid() AND (membership_status = 'employee' OR membership_status = 'org_admin')
        )
    )
);
