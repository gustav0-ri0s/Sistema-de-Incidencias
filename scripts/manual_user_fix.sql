
-- EXTENSION pgcrypto must be enabled (usually is)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    v_supervisor_id UUID := gen_random_uuid();
    v_docente_id UUID := gen_random_uuid();
    -- Hash conocido que funciona (generado via crypt('password123', gen_salt('bf')))
    -- Pero mejor lo generamos in-situ
    v_encrypted_pw TEXT;
BEGIN
    v_encrypted_pw := crypt('password123', gen_salt('bf'));

    -- 1. Insertar SUPERVISOR si no existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor@colegio.edu.pe') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_supervisor_id, 'authenticated', 'authenticated', 'supervisor@colegio.edu.pe', v_encrypted_pw,
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now(),
            '', ''
        );
        
        -- Identity
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_supervisor_id, format('{"sub":"%s","email":"supervisor@colegio.edu.pe"}', v_supervisor_id)::jsonb, 'email', v_supervisor_id, now(), now(), now()
        );

        -- Profile
        INSERT INTO public.profiles (id, full_name, role, active)
        VALUES (v_supervisor_id, 'Supervisor General', 'supervisor', true);
    END IF;

    -- 2. Insertar DOCENTE si no existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'docente@colegio.edu.pe') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
            confirmation_token, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', v_docente_id, 'authenticated', 'authenticated', 'docente@colegio.edu.pe', v_encrypted_pw,
            now(), now(), now(), 
            '{"provider":"email","providers":["email"]}', '{}', now(), now(),
            '', ''
        );

        -- Identity
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_docente_id, format('{"sub":"%s","email":"docente@colegio.edu.pe"}', v_docente_id)::jsonb, 'email', v_docente_id, now(), now(), now()
        );

        -- Profile
        INSERT INTO public.profiles (id, full_name, role, active)
        VALUES (v_docente_id, 'Juan Pérez (Docente)', 'docente', true);
    END IF;

END $$;
