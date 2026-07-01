-- The keep-alive cron (src/server/keepAlive.ts) pings this table using the
-- service_role key. Unlike `authenticated`, `service_role` has no default
-- table grants on this project, so without this it fails with
-- "permission denied for table user_memory" even though service_role
-- otherwise bypasses RLS.
GRANT SELECT ON public.user_memory TO service_role;
