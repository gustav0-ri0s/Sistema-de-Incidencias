
-- ==============================================================================
-- FUNCIÓN RPC PARA CREAR USUARIOS DESDE EL FRONTEND (SOLO ADMINS)
-- ==============================================================================

-- Habilitar pgcrypto si no está
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función segura (SECURITY DEFINER permite ejecutar con permisos del creador)
-- OJO: Debemos validar que quien la llama sea realmente un ADMIN.

CREATE OR REPLACE FUNCTION create_new_user(
    email TEXT,
    password TEXT,
    full_name TEXT,
    role_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecuta con permisos de superusuario (necesario para insertar en auth.users)
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
    v_caller_role TEXT;
BEGIN
    -- 1. VERIFICAR PERMISOS
    -- Verificar si el usuario que llama a la función es un admin en la tabla public.profiles
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Acceso denegado: Solo administradores pueden crear usuarios.';
    END IF;

    -- 2. VALIDAR ROL
    IF role_name NOT IN ('docente', 'supervisor', 'admin') THEN
        RAISE EXCEPTION 'Rol inválido.';
    END IF;

    -- 3. GENERAR ID Y HASH
    v_user_id := gen_random_uuid();
    v_encrypted_pw := crypt(password, gen_salt('bf'));

    -- 4. INSERTAR EN AUTH.USERS
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, recovery_sent_at, last_sign_in_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated', email, v_encrypted_pw,
        now(), now(), now(), 
        '{"provider":"email","providers":["email"]}', '{"full_name": "' || full_name || '"}', now(), now(),
        '', ''
    );

    -- 5. INSERTAR IDENTITY (Para que Supabase no se queje)
    INSERT INTO auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id, email)::jsonb, 'email', v_user_id, now(), now(), now()
    );

    -- 6. INSERTAR/ACTUALIZAR PERFIL (El trigger podría haberlo creado, pero aseguramos los datos correctos)
    INSERT INTO public.profiles (id, full_name, role, active)
    VALUES (v_user_id, full_name, role_name::user_role, true)
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, active = true;

    RETURN v_user_id;
END;
$$;
