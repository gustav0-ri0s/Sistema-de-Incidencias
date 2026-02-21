
export enum UserRole {
  DOCENTE = 'docente',
  DOCENTE_INGLES = 'docente_ingles',
  SECRETARIA = 'secretaria',
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

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface IncidentParticipant {
  id: string;
  incident_id: string;
  student_id: string;
  role: string;
  students?: Student;
}

export interface InvolvedStudent {
  names: string;
  lastNames: string;
}

export interface IncidentLog {
  id: string;
  incident_id: string;
  status: IncidentStatus;
  comment: string;
  created_by: string;
  created_at: string;
  profiles?: { full_name: string };
}

export interface Incident {
  id: string;
  correlative: string;
  incident_date: string;
  type: IncidentType;
  classroom_id?: number;
  level?: SchoolLevel; // Deprecated
  grade?: string; // Deprecated
  section?: string; // Deprecated
  room_name?: string;
  category_id?: number;
  other_category_suggestion?: string;
  description: string;
  teacher_id: string;
  involved_students?: InvolvedStudent[]; // Deprecated
  status: IncidentStatus;
  created_at: string;
  image_url?: string;
  resolution_details?: string;
  // Join fields
  profiles?: { full_name: string };
  incident_categories?: { name: string };
  classrooms?: {
    level: SchoolLevel;
    grade: string;
    section: string;
  };
  incident_participants?: (IncidentParticipant & { students: Student })[];
  incident_logs?: IncidentLog[];
}

export interface Classroom {
  id: number;
  level: SchoolLevel;
  grade: string;
  section: string;
  capacity: number;
  active: boolean;
  created_at: string;
}
