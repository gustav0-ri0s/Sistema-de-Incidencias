
export enum UserRole {
  DOCENTE = 'docente',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin'
}

export enum IncidentType {
  ESTUDIANTE = 'estudiante',
  AULA = 'aula',
  GENERAL = 'general'
}

export enum IncidentStatus {
  REGISTRADA = 'registrada',
  LEIDA = 'leída',
  ATENCION = 'atención',
  RESUELTA = 'resuelta'
}

export enum SchoolLevel {
  INICIAL = 'inicial',
  PRIMARIA = 'primaria',
  SECUNDARIA = 'secundaria'
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  email?: string;
  created_at: string;
}

export interface IncidentCategory {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
}

export interface InvolvedStudent {
  names: string;
  lastNames: string;
}

export interface Incident {
  id: string;
  correlative: string;
  incident_date: string;
  type: IncidentType;
  level: SchoolLevel;
  grade: string;
  section: string;
  room_name?: string;
  category_id?: number;
  other_category_suggestion?: string;
  description: string;
  teacher_id: string;
  involved_students?: InvolvedStudent[];
  student_dni?: string;
  student_code?: string;
  status: IncidentStatus;
  created_at: string;
  image_url?: string;
  // Join fields
  profiles?: { full_name: string };
  incident_categories?: { name: string };
}
