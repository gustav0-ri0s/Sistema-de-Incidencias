
-- ==============================================================================
-- FUNCIÓN RPC MEJORADA (TRIM + HASH COST 10)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION create_new_user(
    email TEXT,
    password TEXT,
    full_name TEXT,
    role_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
    v_caller_role TEXT;
    v_clean_email TEXT;
    v_clean_password TEXT;
BEGIN
    -- 0. LIMPIAR INPUTS
    v_clean_email := TRIM(email);
    v_clean_password := TRIM(password);

    -- 1. VERIFICAR PERMISOS
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden crear usuarios.';
    END IF;

    -- 2. VALIDAR ROL
    IF role_name NOT IN ('docente', 'supervisor', 'admin') THEN
        RAISE EXCEPTION 'Rol inválido.';
    END IF;

    -- 3. GENERAR ID Y HASH (COSTO 10 para igualar a Supabase Auth estándar)
    v_user_id := gen_random_uuid();
    v_encrypted_pw := crypt(v_clean_password, gen_salt('bf', 10));

    -- 4. INSERTAR EN AUTH.USERS
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, recovery_sent_at, last_sign_in_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', v_clean_email, v_encrypted_pw,
        now(), now(), now(), 
        '{"provider":"email","providers":["email"]}', format('{"full_name": "%s"}', full_name)::jsonb, now(), now(),
        '', ''
    );

    -- 5. INSERTAR IDENTITY
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id, v_clean_email)::jsonb, 'email', v_user_id, now(), now(), now()
    );

    -- 6. INSERTAR/ACTUALIZAR PERFIL
    INSERT INTO public.profiles (id, full_name, role, active)
    VALUES (v_user_id, full_name, role_name::user_role, true)
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

    RETURN v_user_id;
END;
$$;
