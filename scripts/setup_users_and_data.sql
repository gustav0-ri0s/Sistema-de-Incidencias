-- ==============================================================================
-- SCRIPT DE GENERACIÓN DE USUARIOS Y DATOS DE PRUEBA
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Copia y pega este script en el EDITOR SQL de tu Dashboard de Supabase.
-- 2. Ejecuta el script.
-- 3. Podrás iniciar sesión con los usuarios creados (la contraseña es 'password123').
-- ==============================================================================

-- Habilitar pgcrypto para encriptación de contraseñas (generalmente ya viene habilitado)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpiar datos previos de prueba (Opcional - Ten cuidado en producción)
-- DELETE FROM auth.users WHERE email IN ('admin@colegio.edu.pe', 'supervisor@colegio.edu.pe', 'docente@colegio.edu.pe');
-- DELETE FROM public.profiles WHERE full_name IN ('Administrador Principal', 'Supervisor General', 'Juan Pérez (Docente)');

DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_supervisor_id UUID := gen_random_uuid();
    v_docente_id UUID := gen_random_uuid();
    v_encrypted_pw TEXT;
BEGIN
    -- Generar hash de contraseña 'password123'
    v_encrypted_pw := crypt('password123', gen_salt('bf'));

    -- 1. CREAR USUARIO ADMINISTRADOR
    -- Verifica si ya existe para no duplicar error
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@colegio.edu.pe') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated', 'admin@colegio.edu.pe', v_encrypted_pw,
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now()
        );
        
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_admin_id, format('{"sub":"%s","email":"admin@colegio.edu.pe"}', v_admin_id)::jsonb, 'email', v_admin_id, now(), now(), now()
        );

        -- Insertar Perfil Admin (Trigger podría haberlo creado, aseguramos actualización)
        INSERT INTO public.profiles (id, full_name, role, active)
        VALUES (v_admin_id, 'Administrador Principal', 'admin', true)
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
    END IF;

    -- 2. CREAR USUARIO SUPERVISOR
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor@colegio.edu.pe') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_supervisor_id, 'authenticated', 'authenticated', 'supervisor@colegio.edu.pe', v_encrypted_pw,
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now()
        );

         INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_supervisor_id, format('{"sub":"%s","email":"supervisor@colegio.edu.pe"}', v_supervisor_id)::jsonb, 'email', v_supervisor_id, now(), now(), now()
        );

        INSERT INTO public.profiles (id, full_name, role, active)
        VALUES (v_supervisor_id, 'Supervisor General', 'supervisor', true)
        ON CONFLICT (id) DO UPDATE SET role = 'supervisor';
    END IF;

    -- 3. CREAR USUARIO DOCENTE
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'docente@colegio.edu.pe') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_docente_id, 'authenticated', 'authenticated', 'docente@colegio.edu.pe', v_encrypted_pw,
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now()
        );

         INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_docente_id, format('{"sub":"%s","email":"docente@colegio.edu.pe"}', v_docente_id)::jsonb, 'email', v_docente_id, now(), now(), now()
        );

        INSERT INTO public.profiles (id, full_name, role, active)
        VALUES (v_docente_id, 'Juan Pérez (Docente)', 'docente', true)
        ON CONFLICT (id) DO UPDATE SET role = 'docente';
    END IF;

END $$;

-- 4. INSERTAR INCIDENCIAS DE EJEMPLO
-- Necesitamos recuperar los IDs recién creados (o existentes)
DO $$
DECLARE
    v_docente_id UUID;
    v_cat_conducta BIGINT;
    v_cat_infra BIGINT;
BEGIN
    SELECT id INTO v_docente_id FROM auth.users WHERE email = 'docente@colegio.edu.pe' LIMIT 1;
    
    -- Obtener algunas categorías
    SELECT id INTO v_cat_conducta FROM incident_categories WHERE name LIKE '%Conducta%' LIMIT 1;
    SELECT id INTO v_cat_infra FROM incident_categories WHERE name LIKE '%Infraestructura%' LIMIT 1;

    -- Si no hay categorías, las creamos (por seguridad)
    IF v_cat_conducta IS NULL THEN
        INSERT INTO incident_categories (name) VALUES ('Conducta Inapropiada') RETURNING id INTO v_cat_conducta;
    END IF;

    IF v_docente_id IS NOT NULL THEN
        -- Incidencia 1
        INSERT INTO incidents (type, level, grade, section, category_id, description, teacher_id, status, involved_students)
        VALUES (
            'estudiante', 
            'secundaria', 
            '4to', 
            'B', 
            v_cat_conducta, 
            'El estudiante Juanito Alimaña interrumpió la clase repetidamente.', 
            v_docente_id, 
            'registrada',
            '[{"name": "Juanito Alimaña", "grade": "4to B"}]'::jsonb
        );

        -- Incidencia 2
        INSERT INTO incidents (type, level, grade, section, category_id, description, teacher_id, status)
        VALUES (
            'aula', 
            'primaria', 
            '2do', 
            'A', 
            v_cat_infra, 
            'Ventana rota en el aula 202.', 
            v_docente_id, 
            'atención'
        );
    END IF;
END $$;
