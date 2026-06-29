-- Revoke public EXECUTE on trigger function (only needs to run as trigger)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Add RLS policies on storage.objects for the private export_260625 bucket
CREATE POLICY "export_260625_owner_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'export_260625' AND auth.uid() = owner);

CREATE POLICY "export_260625_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'export_260625' AND auth.uid() = owner);

CREATE POLICY "export_260625_owner_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'export_260625' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'export_260625' AND auth.uid() = owner);

CREATE POLICY "export_260625_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'export_260625' AND auth.uid() = owner);