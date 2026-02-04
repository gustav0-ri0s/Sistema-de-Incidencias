
-- ==========================================
-- SCRIPT DE DATOS INICIALES Y ACCESO MAESTRO
-- ==========================================

-- 1. PROMOVER UN USUARIO A ADMINISTRADOR
-- Primero regístrate en el panel de Auth de Supabase con tu correo institucional.
-- Luego, reemplaza 'tu-correo@ejemplo.com' y ejecuta esto:
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
    -- Esta subconsulta busca el ID basado en el email de la tabla de auth
    -- Cambia el correo abajo:
    SELECT id FROM auth.users WHERE email = 'tu-correo@ejemplo.com'
);

-- 2. INSERTAR CATEGORÍAS ADICIONALES (Si no existen)
INSERT INTO incident_categories (name, active) VALUES 
('Higiene / Presentación'),
('Falta de Materiales'),
('Uso de Vocabulario Soez'),
('Atraso en el Aula')
ON CONFLICT (name) DO NOTHING;

-- 3. INSERTAR INCIDENCIAS DE PRUEBA (Opcional, para ver el Dashboard con vida)
-- Nota: Esto asume que ya existe al menos un perfil en la tabla 'profiles'.
-- Si acabas de crear tu cuenta, ejecuta primero el paso 1.

DO $$
DECLARE
    v_teacher_id UUID;
    v_cat_id BIGINT;
BEGIN
    -- Obtenemos el ID del primer usuario disponible
    SELECT id INTO v_teacher_id FROM profiles LIMIT 1;
    SELECT id INTO v_cat_id FROM incident_categories LIMIT 1;

    IF v_teacher_id IS NOT NULL THEN
        -- Incidencia 1: Resuelta
        INSERT INTO incidents (type, level, grade, section, category_id, description, teacher_id, status)
        VALUES ('estudiante', 'secundaria', '5to', 'A', v_cat_id, 'El estudiante no trajo el uniforme completo por tercera vez.', v_teacher_id, 'resuelta');

        -- Incidencia 2: Pendiente
        INSERT INTO incidents (type, level, grade, section, category_id, description, teacher_id, status)
        VALUES ('aula', 'primaria', '3ro', 'B', v_cat_id, 'Se detectó una carpeta rota en la parte posterior del aula 104.', v_teacher_id, 'registrada');

        -- Incidencia 3: En Atención
        INSERT INTO incidents (type, level, grade, section, category_id, description, teacher_id, status)
        VALUES ('estudiante', 'secundaria', '2do', 'C', v_cat_id, 'Conflicto verbal entre dos alumnos durante el recreo.', v_teacher_id, 'atención');
    END IF;
END $$;
