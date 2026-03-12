-- =============================================
-- MontadorPro — Correção de Segurança Supabase (Dinâmica)
-- Resolve 22+ vulnerabilidades (Security Advisor)
-- Data: 2026-03-12
-- =============================================
-- ESTRATÉGIA:
--   O backend (Railway) usa Prisma com role 'postgres' (BYPASSRLS).
--   A API REST pública (anon/authenticated) deve ser bloqueada.
--   Este script percorre TODAS as tabelas do esquema 'public'.
-- =============================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Loop por todas as tabelas no schema public
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        -- Habilitar RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        
        -- Revogar permissões default de roles públicas
        EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', r.tablename);
        
        RAISE NOTICE 'Secured table: %', r.tablename;
    END LOOP;
END $$;

-- =============================================
-- 2. BLOQUEIO ADICIONAL (Prevenção)
--    Garante que novos objetos não tenham permissões default
-- =============================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- =============================================
-- 3. VERIFICAÇÃO FINAL
--    Todas as tabelas devem retornar rowsecurity = true
-- =============================================
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
