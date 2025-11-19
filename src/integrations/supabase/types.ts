export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          duration: number | null
          height: number | null
          id: string
          incident_id: string
          mime_type: string
          provider: Database["public"]["Enums"]["media_provider"]
          public_id: string | null
          secure_url: string
          size_bytes: number | null
          uploaded_by: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          height?: number | null
          id?: string
          incident_id: string
          mime_type: string
          provider?: Database["public"]["Enums"]["media_provider"]
          public_id?: string | null
          secure_url: string
          size_bytes?: number | null
          uploaded_by: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          height?: number | null
          id?: string
          incident_id?: string
          mime_type?: string
          provider?: Database["public"]["Enums"]["media_provider"]
          public_id?: string | null
          secure_url?: string
          size_bytes?: number | null
          uploaded_by?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          activo: boolean
          color: string | null
          created_at: string
          deleted_at: string | null
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comentario_menciones: {
        Row: {
          comentario_id: string
          created_at: string | null
          id: string
          mentioned_user_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string | null
          id?: string
          mentioned_user_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentario_menciones_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentario_menciones_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentario_menciones_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          activo: boolean
          comentario_padre_id: string | null
          contenido: string
          created_at: string
          deleted_at: string | null
          id: string
          imagenes: string[] | null
          publicacion_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean
          comentario_padre_id?: string | null
          contenido: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          imagenes?: string[] | null
          publicacion_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean
          comentario_padre_id?: string | null
          contenido?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          imagenes?: string[] | null
          publicacion_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_comentario_padre_id_fkey"
            columns: ["comentario_padre_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversaciones: {
        Row: {
          created_at: string
          created_by: string | null
          es_grupo: boolean
          id: string
          nombre: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          es_grupo?: boolean
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          es_grupo?: boolean
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversaciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversaciones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estado_reacciones: {
        Row: {
          created_at: string
          emoji: string
          estado_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          estado_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          estado_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estado_reacciones_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estado_reacciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estado_reacciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estado_vistas: {
        Row: {
          created_at: string
          estado_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estado_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estado_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estado_vistas_estado_id_fkey"
            columns: ["estado_id"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estado_vistas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estado_vistas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estados: {
        Row: {
          activo: boolean | null
          compartido_en_mensajes: boolean | null
          compartido_en_social: boolean | null
          contenido: string | null
          created_at: string
          expires_at: string
          id: string
          imagenes: string[] | null
          tipo: string
          user_id: string
          visibilidad: string
          vistas: Json | null
        }
        Insert: {
          activo?: boolean | null
          compartido_en_mensajes?: boolean | null
          compartido_en_social?: boolean | null
          contenido?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          imagenes?: string[] | null
          tipo?: string
          user_id: string
          visibilidad?: string
          vistas?: Json | null
        }
        Update: {
          activo?: boolean | null
          compartido_en_mensajes?: boolean | null
          compartido_en_social?: boolean | null
          contenido?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          imagenes?: string[] | null
          tipo?: string
          user_id?: string
          visibilidad?: string
          vistas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "estados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      group_history: {
        Row: {
          action_type: string
          affected_user_id: string | null
          conversacion_id: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string | null
        }
        Insert: {
          action_type: string
          affected_user_id?: string | null
          conversacion_id: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Update: {
          action_type?: string
          affected_user_id?: string | null
          conversacion_id?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_history_affected_user_id_fkey"
            columns: ["affected_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_history_affected_user_id_fkey"
            columns: ["affected_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_history_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          updated_at: string | null
          uso_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
          uso_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
          uso_count?: number | null
        }
        Relationships: []
      }
      incident_history: {
        Row: {
          changed_by: string
          created_at: string
          from_status: Database["public"]["Enums"]["incident_status"] | null
          id: string
          incident_id: string
          note: string | null
          to_status: Database["public"]["Enums"]["incident_status"]
        }
        Insert: {
          changed_by: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["incident_status"] | null
          id?: string
          incident_id: string
          note?: string | null
          to_status: Database["public"]["Enums"]["incident_status"]
        }
        Update: {
          changed_by?: string
          created_at?: string
          from_status?: Database["public"]["Enums"]["incident_status"] | null
          id?: string
          incident_id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["incident_status"]
        }
        Relationships: [
          {
            foreignKeyName: "incident_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_history_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          address: string | null
          campus: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          reporter_id: string
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          campus?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location: unknown
          reporter_id: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          campus?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          reporter_id?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      interacciones: {
        Row: {
          comentario_id: string | null
          created_at: string
          id: string
          publicacion_id: string | null
          tipo_interaccion: Database["public"]["Enums"]["tipo_interaccion"]
          user_id: string | null
        }
        Insert: {
          comentario_id?: string | null
          created_at?: string
          id?: string
          publicacion_id?: string | null
          tipo_interaccion?: Database["public"]["Enums"]["tipo_interaccion"]
          user_id?: string | null
        }
        Update: {
          comentario_id?: string | null
          created_at?: string
          id?: string
          publicacion_id?: string | null
          tipo_interaccion?: Database["public"]["Enums"]["tipo_interaccion"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacciones_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interacciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempt_count: number
          created_at: string
          email: string
          id: string
          ip_address: unknown
          last_attempt_at: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          last_attempt_at?: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          last_attempt_at?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mensaje_reacciones: {
        Row: {
          created_at: string
          emoji: string
          id: string
          mensaje_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          mensaje_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          mensaje_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensaje_reacciones_mensaje_id_fkey"
            columns: ["mensaje_id"]
            isOneToOne: false
            referencedRelation: "mensajes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensaje_reacciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensaje_reacciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          contenido: string
          conversacion_id: string
          created_at: string
          deleted_at: string | null
          hidden_by_users: Json | null
          id: string
          imagenes: string[] | null
          leido: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contenido: string
          conversacion_id: string
          created_at?: string
          deleted_at?: string | null
          hidden_by_users?: Json | null
          id?: string
          imagenes?: string[] | null
          leido?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contenido?: string
          conversacion_id?: string
          created_at?: string
          deleted_at?: string | null
          hidden_by_users?: Json | null
          id?: string
          imagenes?: string[] | null
          leido?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      participantes_conversacion: {
        Row: {
          conversacion_id: string
          created_at: string
          hidden_at: string | null
          hidden_from_all: boolean | null
          hidden_from_todos: boolean | null
          id: string
          muted: boolean | null
          role: Database["public"]["Enums"]["conversation_role"]
          ultimo_leido_at: string | null
          user_id: string | null
        }
        Insert: {
          conversacion_id: string
          created_at?: string
          hidden_at?: string | null
          hidden_from_all?: boolean | null
          hidden_from_todos?: boolean | null
          id?: string
          muted?: boolean | null
          role?: Database["public"]["Enums"]["conversation_role"]
          ultimo_leido_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversacion_id?: string
          created_at?: string
          hidden_at?: string | null
          hidden_from_all?: boolean | null
          hidden_from_todos?: boolean | null
          id?: string
          muted?: boolean | null
          role?: Database["public"]["Enums"]["conversation_role"]
          ultimo_leido_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participantes_conversacion_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participantes_conversacion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participantes_conversacion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          bio: string | null
          confirmed: boolean | null
          created_at: string
          deleted_at: string | null
          email: string | null
          estado: Database["public"]["Enums"]["user_status"] | null
          id: string
          must_change_password: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          temp_password_used: boolean | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          confirmed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["user_status"] | null
          id?: string
          must_change_password?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          temp_password_used?: boolean | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          confirmed?: boolean | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          estado?: Database["public"]["Enums"]["user_status"] | null
          id?: string
          must_change_password?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          temp_password_used?: boolean | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      publicacion_compartidos: {
        Row: {
          created_at: string
          destinatario_id: string | null
          id: string
          publicacion_id: string
          tipo_compartido: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          destinatario_id?: string | null
          id?: string
          publicacion_id: string
          tipo_compartido: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          destinatario_id?: string | null
          id?: string
          publicacion_id?: string
          tipo_compartido?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publicacion_compartidos_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_compartidos_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_compartidos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_compartidos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_compartidos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacion_guardadas: {
        Row: {
          created_at: string
          id: string
          publicacion_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          publicacion_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          publicacion_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publicacion_guardadas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_guardadas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_guardadas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacion_hashtags: {
        Row: {
          created_at: string | null
          hashtag_id: string
          id: string
          publicacion_id: string
        }
        Insert: {
          created_at?: string | null
          hashtag_id: string
          id?: string
          publicacion_id: string
        }
        Update: {
          created_at?: string | null
          hashtag_id?: string
          id?: string
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicacion_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_hashtags_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacion_menciones: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          publicacion_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          publicacion_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicacion_menciones_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_menciones_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_menciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacion_vistas: {
        Row: {
          created_at: string
          id: string
          publicacion_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          publicacion_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          publicacion_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publicacion_vistas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_vistas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicacion_vistas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones: {
        Row: {
          activo: boolean
          contenido: string | null
          created_at: string
          deleted_at: string | null
          id: string
          imagenes: string[] | null
          repost_comentario: string | null
          repost_of: string | null
          updated_at: string
          user_id: string | null
          visibilidad: string
        }
        Insert: {
          activo?: boolean
          contenido?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          imagenes?: string[] | null
          repost_comentario?: string | null
          repost_of?: string | null
          updated_at?: string
          user_id?: string | null
          visibilidad?: string
        }
        Update: {
          activo?: boolean
          contenido?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          imagenes?: string[] | null
          repost_comentario?: string | null
          repost_of?: string | null
          updated_at?: string
          user_id?: string | null
          visibilidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_repost_of_fkey"
            columns: ["repost_of"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      relaciones: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_relacion"]
          id: string
          seguidor_id: string | null
          tipo: Database["public"]["Enums"]["tipo_relacion"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_relacion"]
          id?: string
          seguidor_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_relacion"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_relacion"]
          id?: string
          seguidor_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_relacion"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relaciones_seguidor_id_fkey"
            columns: ["seguidor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relaciones_seguidor_id_fkey"
            columns: ["seguidor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relaciones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reporte_historial: {
        Row: {
          assigned_by: string | null
          assigned_from: string | null
          assigned_to: string | null
          comentario: string | null
          created_at: string
          fecha_asignacion: string
          id: string
          reporte_id: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_from?: string | null
          assigned_to?: string | null
          comentario?: string | null
          created_at?: string
          fecha_asignacion?: string
          id?: string
          reporte_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_from?: string | null
          assigned_to?: string | null
          comentario?: string | null
          created_at?: string
          fecha_asignacion?: string
          id?: string
          reporte_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reporte_historial_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_assigned_from_fkey"
            columns: ["assigned_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_assigned_from_fkey"
            columns: ["assigned_from"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_reporte_id_fkey"
            columns: ["reporte_id"]
            isOneToOne: false
            referencedRelation: "public_reportes_anonymized"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reporte_historial_reporte_id_fkey"
            columns: ["reporte_id"]
            isOneToOne: false
            referencedRelation: "reportes"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes: {
        Row: {
          activo: boolean
          assigned_to: string | null
          categoria_id: string | null
          created_at: string
          deleted_at: string | null
          descripcion: string | null
          geolocation: unknown
          id: string
          imagenes: string[] | null
          location: Json | null
          nombre: string
          priority: Database["public"]["Enums"]["report_priority"]
          status: Database["public"]["Enums"]["report_status"]
          tipo_reporte_id: string | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["report_visibility"]
        }
        Insert: {
          activo?: boolean
          assigned_to?: string | null
          categoria_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          geolocation?: unknown
          id?: string
          imagenes?: string[] | null
          location?: Json | null
          nombre: string
          priority?: Database["public"]["Enums"]["report_priority"]
          status?: Database["public"]["Enums"]["report_status"]
          tipo_reporte_id?: string | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["report_visibility"]
        }
        Update: {
          activo?: boolean
          assigned_to?: string | null
          categoria_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          geolocation?: unknown
          id?: string
          imagenes?: string[] | null
          location?: Json | null
          nombre?: string
          priority?: Database["public"]["Enums"]["report_priority"]
          status?: Database["public"]["Enums"]["report_status"]
          tipo_reporte_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["report_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "reportes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_tipo_reporte_id_fkey"
            columns: ["tipo_reporte_id"]
            isOneToOne: false
            referencedRelation: "tipo_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          auto_delete_read: boolean | null
          chat_assistant_enabled: boolean | null
          chat_auto_clear: boolean | null
          chat_persistence_enabled: boolean | null
          chat_retention_days: number | null
          created_at: string
          enabled: boolean | null
          id: string
          real_time_tracking_enabled: boolean | null
          retention_days: number | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_delete_read?: boolean | null
          chat_assistant_enabled?: boolean | null
          chat_auto_clear?: boolean | null
          chat_persistence_enabled?: boolean | null
          chat_retention_days?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          real_time_tracking_enabled?: boolean | null
          retention_days?: number | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_delete_read?: boolean | null
          chat_assistant_enabled?: boolean | null
          chat_auto_clear?: boolean | null
          chat_persistence_enabled?: boolean | null
          chat_retention_days?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          real_time_tracking_enabled?: boolean | null
          retention_days?: number | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      tipo_categories: {
        Row: {
          activo: boolean
          category_id: string | null
          color: string | null
          created_at: string
          deleted_at: string | null
          descripcion: string | null
          icono: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          category_id?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          category_id?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          icono?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipo_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipo_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipo_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_audit: {
        Row: {
          action: Database["public"]["Enums"]["operation_type"]
          campos_modificados: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          registro_id: string | null
          tabla_afectada: string | null
          user_agent: string | null
          user_id: string | null
          valores_anteriores: Json | null
          valores_nuevos: Json | null
        }
        Insert: {
          action: Database["public"]["Enums"]["operation_type"]
          campos_modificados?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          registro_id?: string | null
          tabla_afectada?: string | null
          user_agent?: string | null
          user_id?: string | null
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Update: {
          action?: Database["public"]["Enums"]["operation_type"]
          campos_modificados?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          registro_id?: string | null
          tabla_afectada?: string | null
          user_agent?: string | null
          user_id?: string | null
          valores_anteriores?: Json | null
          valores_nuevos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hashtag_follows: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hashtag_follows_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hashtag_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hashtag_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          permisos: Database["public"]["Enums"]["user_permission"][]
          roles: Database["public"]["Enums"]["user_role"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          permisos?: Database["public"]["Enums"]["user_permission"][]
          roles?: Database["public"]["Enums"]["user_role"][]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          permisos?: Database["public"]["Enums"]["user_permission"][]
          roles?: Database["public"]["Enums"]["user_role"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_silenciados: {
        Row: {
          created_at: string
          id: string
          silenciado_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          silenciado_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          silenciado_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_silenciados_silenciado_user_id_fkey"
            columns: ["silenciado_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_silenciados_silenciado_user_id_fkey"
            columns: ["silenciado_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_silenciados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_silenciados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar: string | null
          bio: string | null
          confirmed: boolean | null
          created_at: string | null
          deleted_at: string | null
          estado: Database["public"]["Enums"]["user_status"] | null
          id: string | null
          name: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar?: string | null
          bio?: string | null
          confirmed?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          estado?: Database["public"]["Enums"]["user_status"] | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar?: string | null
          bio?: string | null
          confirmed?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          estado?: Database["public"]["Enums"]["user_status"] | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_reportes_anonymized: {
        Row: {
          asignado_a: string | null
          creador_id: string | null
          created_at: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["report_status"] | null
          fecha_reporte: string | null
          geolocation: unknown
          id: string | null
          location: string | null
          prioridad: Database["public"]["Enums"]["report_priority"] | null
          tipo_reporte_id: string | null
          titulo: string | null
          updated_at: string | null
          visibilidad: Database["public"]["Enums"]["report_visibility"] | null
        }
        Insert: {
          asignado_a?: string | null
          creador_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["report_status"] | null
          fecha_reporte?: string | null
          geolocation?: never
          id?: string | null
          location?: never
          prioridad?: Database["public"]["Enums"]["report_priority"] | null
          tipo_reporte_id?: string | null
          titulo?: string | null
          updated_at?: string | null
          visibilidad?: Database["public"]["Enums"]["report_visibility"] | null
        }
        Update: {
          asignado_a?: string | null
          creador_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["report_status"] | null
          fecha_reporte?: string | null
          geolocation?: never
          id?: string | null
          location?: never
          prioridad?: Database["public"]["Enums"]["report_priority"] | null
          tipo_reporte_id?: string | null
          titulo?: string | null
          updated_at?: string | null
          visibilidad?: Database["public"]["Enums"]["report_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reportes_assigned_to_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_assigned_to_fkey"
            columns: ["asignado_a"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_tipo_reporte_id_fkey"
            columns: ["tipo_reporte_id"]
            isOneToOne: false
            referencedRelation: "tipo_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_user_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reportes_user_id_fkey"
            columns: ["creador_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      admin_sign_out_user: {
        Args: { user_id_to_sign_out: string }
        Returns: undefined
      }
      audit_logout: { Args: never; Returns: undefined }
      audit_user_login: {
        Args: {
          p_ip_address?: unknown
          p_metadata?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      audit_user_logout: {
        Args: {
          p_ip_address?: unknown
          p_metadata?: Json
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      auth_user_has_permission: {
        Args: {
          required_permission: Database["public"]["Enums"]["user_permission"]
        }
        Returns: boolean
      }
      auth_user_is_admin: { Args: never; Returns: boolean }
      can_view_profile_email: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      check_login_lockout: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      cleanup_expired_estados: { Args: never; Returns: undefined }
      cleanup_expired_lockouts: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
      cleanup_orphaned_profiles: { Args: never; Returns: number }
      clear_messages_for_user: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      complete_email_change: {
        Args: { p_new_email: string; p_profile_id: string }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_data?: Json
          p_message: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      delete_message_for_everyone: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      dropgeometrytable:
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_unique_username: { Args: { p_email: string }; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_my_participation: {
        Args: { _conversation_id: string }
        Returns: {
          hidden_at: string
          muted: boolean
          role: Database["public"]["Enums"]["conversation_role"]
          ultimo_leido_at: string
        }[]
      }
      get_profile_id_from_auth: { Args: never; Returns: string }
      get_reportes_with_distance: {
        Args: { user_lat: number; user_lng: number }
        Returns: {
          activo: boolean
          assigned_profiles: Json
          assigned_to: string
          categoria_id: string
          categories: Json
          created_at: string
          deleted_at: string
          descripcion: string
          distancia_metros: number
          geolocation: unknown
          id: string
          imagenes: string[]
          location: Json
          nombre: string
          priority: Database["public"]["Enums"]["report_priority"]
          profiles: Json
          status: Database["public"]["Enums"]["report_status"]
          tipo_categories: Json
          tipo_reporte_id: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["report_visibility"]
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_any_users: { Args: never; Returns: boolean }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["user_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role:
        | { Args: { required_roles: string[] }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["user_role"]
              _user_id: string
            }
            Returns: boolean
          }
      hide_conversation_for_user: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      hide_message_for_user: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      is_authenticated: { Args: never; Returns: boolean }
      is_conversation_admin: {
        Args: { conv_id: string; user_id_param: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_first_user: { Args: never; Returns: boolean }
      leave_group_for_user: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      leave_group_safe: { Args: { _conversation_id: string }; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      populate_geometry_columns:
        | { Args: { use_typmod?: boolean }; Returns: string }
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      prepare_email_change: {
        Args: { p_new_email: string; p_profile_id: string }
        Returns: undefined
      }
      reconnect_profile_after_email_change: {
        Args: {
          p_new_email: string
          p_new_user_id: string
          p_profile_id: string
        }
        Returns: undefined
      }
      record_failed_login: {
        Args: { p_email: string; p_ip_address?: unknown }
        Returns: Json
      }
      reset_login_attempts: { Args: { p_email: string }; Returns: undefined }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_askml:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geom: unknown }; Returns: number }
        | { Args: { geog: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      conversation_role: "miembro" | "administrador"
      estado_relacion: "pendiente" | "aceptado" | "rechazado" | "bloqueado"
      incident_severity: "baja" | "media" | "alta" | "critica"
      incident_status:
        | "reportado"
        | "en_revision"
        | "en_proceso"
        | "resuelto"
        | "cerrado"
        | "rechazado"
      media_provider: "cloudinary" | "supabase_storage"
      notification_type:
        | "informacion"
        | "advertencia"
        | "error"
        | "exito"
        | "asignacion"
        | "actualizacion"
        | "comentario"
        | "recordatorio"
      operation_type: "CREATE" | "UPDATE" | "SOFT_DELETE" | "LOGIN" | "LOGOUT"
      report_priority: "urgente" | "alto" | "medio" | "bajo"
      report_status:
        | "pendiente"
        | "en_progreso"
        | "resuelto"
        | "rechazado"
        | "cancelado"
        | "eliminado"
      report_visibility: "publico" | "privado"
      tipo_interaccion:
        | "me_gusta"
        | "me_encanta"
        | "me_divierte"
        | "me_entristece"
        | "me_enoja"
      tipo_relacion: "seguidor" | "amigo"
      user_permission:
        | "ver_reporte"
        | "crear_reporte"
        | "editar_reporte"
        | "eliminar_reporte"
        | "ver_usuario"
        | "crear_usuario"
        | "editar_usuario"
        | "eliminar_usuario"
        | "ver_categoria"
        | "crear_categoria"
        | "editar_categoria"
        | "eliminar_categoria"
        | "ver_estado"
        | "crear_estado"
        | "editar_estado"
        | "eliminar_estado"
      user_role:
        | "administrador"
        | "mantenimiento"
        | "usuario_regular"
        | "estudiante_personal"
        | "operador_analista"
        | "seguridad_uce"
      user_status: "activo" | "inactivo" | "bloqueado" | "eliminado"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conversation_role: ["miembro", "administrador"],
      estado_relacion: ["pendiente", "aceptado", "rechazado", "bloqueado"],
      incident_severity: ["baja", "media", "alta", "critica"],
      incident_status: [
        "reportado",
        "en_revision",
        "en_proceso",
        "resuelto",
        "cerrado",
        "rechazado",
      ],
      media_provider: ["cloudinary", "supabase_storage"],
      notification_type: [
        "informacion",
        "advertencia",
        "error",
        "exito",
        "asignacion",
        "actualizacion",
        "comentario",
        "recordatorio",
      ],
      operation_type: ["CREATE", "UPDATE", "SOFT_DELETE", "LOGIN", "LOGOUT"],
      report_priority: ["urgente", "alto", "medio", "bajo"],
      report_status: [
        "pendiente",
        "en_progreso",
        "resuelto",
        "rechazado",
        "cancelado",
        "eliminado",
      ],
      report_visibility: ["publico", "privado"],
      tipo_interaccion: [
        "me_gusta",
        "me_encanta",
        "me_divierte",
        "me_entristece",
        "me_enoja",
      ],
      tipo_relacion: ["seguidor", "amigo"],
      user_permission: [
        "ver_reporte",
        "crear_reporte",
        "editar_reporte",
        "eliminar_reporte",
        "ver_usuario",
        "crear_usuario",
        "editar_usuario",
        "eliminar_usuario",
        "ver_categoria",
        "crear_categoria",
        "editar_categoria",
        "eliminar_categoria",
        "ver_estado",
        "crear_estado",
        "editar_estado",
        "eliminar_estado",
      ],
      user_role: [
        "administrador",
        "mantenimiento",
        "usuario_regular",
        "estudiante_personal",
        "operador_analista",
        "seguridad_uce",
      ],
      user_status: ["activo", "inactivo", "bloqueado", "eliminado"],
    },
  },
} as const
