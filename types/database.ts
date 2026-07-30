/**
 * types/database.ts
 * ──────────────────
 * Auto-generated TypeScript types for Hotel Super Townhouse database.
 * Generated from: Supabase project jzcmfpvscdsvkijpgdlj
 * Schema: public
 * Generated: 2024-08-01
 *
 * DO NOT manually edit this file.
 * Regenerate with: npx supabase gen types typescript --project-id jzcmfpvscdsvkijpgdlj > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_guests: {
        Row: {
          booking_id: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          id_number: string | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          is_primary: boolean
          nationality: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_primary?: boolean
          nationality?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_primary?: boolean
          nationality?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_guests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_rooms: {
        Row: {
          booking_id: string
          breakfast_included: boolean
          created_at: string
          extra_bed: boolean
          id: string
          price_per_night: number
          room_id: string
          room_type_id: string
          total_price: number
        }
        Insert: {
          booking_id: string
          breakfast_included?: boolean
          created_at?: string
          extra_bed?: boolean
          id?: string
          price_per_night: number
          room_id: string
          room_type_id: string
          total_price: number
        }
        Update: {
          booking_id?: string
          breakfast_included?: boolean
          created_at?: string
          extra_bed?: boolean
          id?: string
          price_per_night?: number
          room_id?: string
          room_type_id?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_rooms_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_rooms_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          arrival_time: string | null
          balance_amount: number | null
          booking_reference: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          checked_in_at: string | null
          checked_out_at: string | null
          confirmed_at: string | null
          created_at: string
          currency: string
          departure_time: string | null
          discount_amount: number
          guest_id: string
          id: string
          internal_notes: string | null
          nights: number | null
          num_adults: number
          num_children: number
          offer_id: string | null
          paid_amount: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          refund_amount: number | null
          refund_status: string | null
          source: string
          special_requests: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          arrival_time?: string | null
          balance_amount?: number | null
          booking_reference?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in: string
          check_out: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          departure_time?: string | null
          discount_amount?: number
          guest_id: string
          id?: string
          internal_notes?: string | null
          nights?: number | null
          num_adults?: number
          num_children?: number
          offer_id?: string | null
          paid_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refund_amount?: number | null
          refund_status?: string | null
          source?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          arrival_time?: string | null
          balance_amount?: number | null
          booking_reference?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in?: string
          check_out?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          departure_time?: string | null
          discount_amount?: number
          guest_id?: string
          id?: string
          internal_notes?: string | null
          nights?: number | null
          num_adults?: number
          num_children?: number
          offer_id?: string | null
          paid_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          refund_amount?: number | null
          refund_status?: string | null
          source?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_read: boolean
          is_replied: boolean
          message: string
          phone: string | null
          replied_at: string | null
          replied_by: string | null
          reply_text: string | null
          source: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_read?: boolean
          is_replied?: boolean
          message: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply_text?: string | null
          source?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_read?: boolean
          is_replied?: boolean
          message?: string
          phone?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply_text?: string | null
          source?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          helpful_no: number
          helpful_yes: number
          id: string
          is_active: boolean
          is_featured: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number
          helpful_no?: number
          helpful_yes?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          helpful_no?: number
          helpful_yes?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          alt_text: string | null
          category: string
          created_at: string
          description: string | null
          display_order: number
          file_size: number | null
          height: number | null
          id: string
          is_active: boolean
          is_featured: boolean
          mime_type: string | null
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          mime_type?: string | null
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          mime_type?: string | null
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      homepage_content: {
        Row: {
          background_image_url: string | null
          content: Json
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          section: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          content?: Json
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          section: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          content?: Json
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hotel_information: {
        Row: {
          address_line1: string
          address_line2: string | null
          check_in_time: string
          check_out_time: string
          city: string
          country: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          early_check_in_fee: number | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          late_check_out_fee: number | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          meta: Json | null
          name: string
          pan: string | null
          phone_primary: string | null
          phone_secondary: string | null
          postal_code: string
          social_facebook: string | null
          social_instagram: string | null
          social_twitter: string | null
          social_youtube: string | null
          star_rating: number | null
          state: string
          tagline: string | null
          total_rooms: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string
          address_line2?: string | null
          check_in_time?: string
          check_out_time?: string
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          early_check_in_fee?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          late_check_out_fee?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          meta?: Json | null
          name?: string
          pan?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          postal_code?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          star_rating?: number | null
          state?: string
          tagline?: string | null
          total_rooms?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          check_in_time?: string
          check_out_time?: string
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          early_check_in_fee?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          late_check_out_fee?: number | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          meta?: Json | null
          name?: string
          pan?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          postal_code?: string
          social_facebook?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          star_rating?: number | null
          state?: string
          tagline?: string | null
          total_rooms?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      hotel_policies: {
        Row: {
          category: string
          content: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string
          cgst_amount: number
          company_name: string | null
          created_at: string
          currency: string
          discount_amount: number
          due_at: string | null
          guest_address: string | null
          guest_email: string
          guest_gstin: string | null
          guest_id: string
          guest_name: string
          guest_phone: string | null
          id: string
          igst_amount: number
          invoice_number: string
          issued_at: string
          line_items: Json
          payment_id: string | null
          sgst_amount: number
          storage_path: string | null
          subtotal: number
          total_amount: number
          total_tax: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          cgst_amount?: number
          company_name?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          due_at?: string | null
          guest_address?: string | null
          guest_email: string
          guest_gstin?: string | null
          guest_id: string
          guest_name: string
          guest_phone?: string | null
          id?: string
          igst_amount?: number
          invoice_number?: string
          issued_at?: string
          line_items?: Json
          payment_id?: string | null
          sgst_amount?: number
          storage_path?: string | null
          subtotal: number
          total_amount: number
          total_tax?: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          cgst_amount?: number
          company_name?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          due_at?: string | null
          guest_address?: string | null
          guest_email?: string
          guest_gstin?: string | null
          guest_id?: string
          guest_name?: string
          guest_phone?: string | null
          id?: string
          igst_amount?: number
          invoice_number?: string
          issued_at?: string
          line_items?: Json
          payment_id?: string | null
          sgst_amount?: number
          storage_path?: string | null
          subtotal?: number
          total_amount?: number
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          estimated_cost: number | null
          id: string
          images: string[] | null
          priority: Database["public"]["Enums"]["maintenance_priority"]
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          room_id: string
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_id: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          room_id?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_booking: boolean
          email_marketing: boolean
          email_payment: boolean
          email_review_request: boolean
          id: string
          push_booking: boolean
          push_marketing: boolean
          push_payment: boolean
          sms_booking: boolean
          sms_marketing: boolean
          sms_payment: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_booking?: boolean
          email_marketing?: boolean
          email_payment?: boolean
          email_review_request?: boolean
          id?: string
          push_booking?: boolean
          push_marketing?: boolean
          push_payment?: boolean
          sms_booking?: boolean
          sms_marketing?: boolean
          sms_payment?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_booking?: boolean
          email_marketing?: boolean
          email_payment?: boolean
          email_review_request?: boolean
          id?: string
          push_booking?: boolean
          push_marketing?: boolean
          push_payment?: boolean
          sms_booking?: boolean
          sms_marketing?: boolean
          sms_payment?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          booking_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          data: Json | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          is_read: boolean
          read_at: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          body: string
          booking_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          data?: Json | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          body?: string
          booking_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          data?: Json | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          is_read?: boolean
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          applicable_room_types: string[] | null
          code: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          is_featured: boolean
          max_discount_amount: number | null
          min_booking_amount: number | null
          min_nights: number | null
          short_description: string | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_room_types?: string[] | null
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_discount_amount?: number | null
          min_booking_amount?: number | null
          min_nights?: number | null
          short_description?: string | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_room_types?: string[] | null
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_discount_amount?: number | null
          min_booking_amount?: number | null
          min_nights?: number | null
          short_description?: string | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          fee_amount: number
          gateway_name: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gateway_response: Json | null
          gateway_signature: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          net_amount: number | null
          notes: string | null
          paid_at: string | null
          payment_reference: string
          refund_amount: number | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tax_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          fee_amount?: number
          gateway_name?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          gateway_signature?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string
          refund_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          fee_amount?: number
          gateway_name?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gateway_response?: Json | null
          gateway_signature?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          net_amount?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string
          refund_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string
          email_verified: boolean
          full_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          gstin: string | null
          id: string
          id_number: string | null
          id_type: Database["public"]["Enums"]["id_type"] | null
          is_active: boolean
          last_login_at: string | null
          nationality: string | null
          phone: string | null
          phone_verified: boolean
          postal_code: string | null
          preferences: Json | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email: string
          email_verified?: boolean
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          gstin?: string | null
          id: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_active?: boolean
          last_login_at?: string | null
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          preferences?: Json | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string
          email_verified?: boolean
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          gstin?: string | null
          id?: string
          id_number?: string | null
          id_type?: Database["public"]["Enums"]["id_type"] | null
          is_active?: boolean
          last_login_at?: string | null
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          preferences?: Json | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_replied_at: string | null
          admin_replied_by: string | null
          admin_reply: string | null
          booking_id: string | null
          cleanliness_rating: number | null
          comfort_rating: number | null
          comment: string
          created_at: string
          guest_id: string
          helpful_count: number
          id: string
          images: string[] | null
          is_verified_guest: boolean
          location_rating: number | null
          overall_rating: number
          room_id: string | null
          room_type_id: string | null
          service_rating: number | null
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          updated_at: string
          value_rating: number | null
        }
        Insert: {
          admin_replied_at?: string | null
          admin_replied_by?: string | null
          admin_reply?: string | null
          booking_id?: string | null
          cleanliness_rating?: number | null
          comfort_rating?: number | null
          comment: string
          created_at?: string
          guest_id: string
          helpful_count?: number
          id?: string
          images?: string[] | null
          is_verified_guest?: boolean
          location_rating?: number | null
          overall_rating: number
          room_id?: string | null
          room_type_id?: string | null
          service_rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          value_rating?: number | null
        }
        Update: {
          admin_replied_at?: string | null
          admin_replied_by?: string | null
          admin_reply?: string | null
          booking_id?: string | null
          cleanliness_rating?: number | null
          comfort_rating?: number | null
          comment?: string
          created_at?: string
          guest_id?: string
          helpful_count?: number
          id?: string
          images?: string[] | null
          is_verified_guest?: boolean
          location_rating?: number | null
          overall_rating?: number
          room_id?: string | null
          room_type_id?: string | null
          service_rating?: number | null
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          updated_at?: string
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_admin_replied_by_fkey"
            columns: ["admin_replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      room_amenities: {
        Row: {
          amenity_id: string
          created_at: string
          id: string
          notes: string | null
          room_id: string | null
          room_type_id: string | null
        }
        Insert: {
          amenity_id: string
          created_at?: string
          id?: string
          notes?: string | null
          room_id?: string | null
          room_type_id?: string | null
        }
        Update: {
          amenity_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          room_id?: string | null
          room_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_amenities_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_amenities_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      room_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          display_order: number
          file_size: number | null
          height: number | null
          id: string
          is_primary: boolean
          mime_type: string | null
          room_id: string | null
          room_type_id: string | null
          storage_path: string
          updated_at: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean
          mime_type?: string | null
          room_id?: string | null
          room_type_id?: string | null
          storage_path: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          file_size?: number | null
          height?: number | null
          id?: string
          is_primary?: boolean
          mime_type?: string | null
          room_id?: string | null
          room_type_id?: string | null
          storage_path?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_images_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          base_price: number
          bed_type: string | null
          breakfast_included: boolean
          breakfast_price: number | null
          cancellation_policy: string | null
          created_at: string
          description: string | null
          display_order: number
          extra_bed_available: boolean
          extra_bed_price: number | null
          holiday_price: number | null
          id: string
          is_active: boolean
          max_adults: number
          max_children: number
          max_occupancy: number
          name: string
          short_description: string | null
          size_sqft: number | null
          slug: string
          thumbnail_url: string | null
          updated_at: string
          view_type: string | null
          weekend_price: number | null
        }
        Insert: {
          base_price: number
          bed_type?: string | null
          breakfast_included?: boolean
          breakfast_price?: number | null
          cancellation_policy?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          extra_bed_available?: boolean
          extra_bed_price?: number | null
          holiday_price?: number | null
          id?: string
          is_active?: boolean
          max_adults?: number
          max_children?: number
          max_occupancy?: number
          name: string
          short_description?: string | null
          size_sqft?: number | null
          slug: string
          thumbnail_url?: string | null
          updated_at?: string
          view_type?: string | null
          weekend_price?: number | null
        }
        Update: {
          base_price?: number
          bed_type?: string | null
          breakfast_included?: boolean
          breakfast_price?: number | null
          cancellation_policy?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          extra_bed_available?: boolean
          extra_bed_price?: number | null
          holiday_price?: number | null
          id?: string
          is_active?: boolean
          max_adults?: number
          max_children?: number
          max_occupancy?: number
          name?: string
          short_description?: string | null
          size_sqft?: number | null
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string
          view_type?: string | null
          weekend_price?: number | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          cleaning_status: Database["public"]["Enums"]["cleaning_status"]
          created_at: string
          deleted_at: string | null
          description: string | null
          floor: number
          id: string
          is_available: boolean
          is_featured: boolean
          last_cleaned_at: string | null
          last_maintained_at: string | null
          notes: string | null
          override_price: number | null
          override_weekend_price: number | null
          room_number: string
          room_type_id: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
          wing: string | null
        }
        Insert: {
          cleaning_status?: Database["public"]["Enums"]["cleaning_status"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          floor?: number
          id?: string
          is_available?: boolean
          is_featured?: boolean
          last_cleaned_at?: string | null
          last_maintained_at?: string | null
          notes?: string | null
          override_price?: number | null
          override_weekend_price?: number | null
          room_number: string
          room_type_id: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          wing?: string | null
        }
        Update: {
          cleaning_status?: Database["public"]["Enums"]["cleaning_status"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          floor?: number
          id?: string
          is_available?: boolean
          is_featured?: boolean
          last_cleaned_at?: string | null
          last_maintained_at?: string | null
          notes?: string | null
          override_price?: number | null
          override_weekend_price?: number | null
          room_number?: string
          room_type_id?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
          wing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_metadata: {
        Row: {
          canonical_url: string | null
          created_at: string
          description: string | null
          id: string
          keywords: string[] | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          page_path: string
          robots: string | null
          structured_data: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          page_path: string
          robots?: string | null
          structured_data?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[] | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          page_path?: string
          robots?: string | null
          structured_data?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          group_name: string
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name?: string
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          created_at: string
          date_joined: string
          date_left: string | null
          department: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          phone: string
          profile_id: string | null
          role: Database["public"]["Enums"]["staff_role"]
          shift: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_joined?: string
          date_left?: string | null
          department?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone: string
          profile_id?: string | null
          role: Database["public"]["Enums"]["staff_role"]
          shift?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_joined?: string
          date_left?: string | null
          department?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string
          profile_id?: string | null
          role?: Database["public"]["Enums"]["staff_role"]
          shift?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_id?: string
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
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_booking_reference: { Args: never; Returns: string }
      has_role: { Args: { role_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
        | "waitlisted"
      cleaning_status: "clean" | "dirty" | "in_progress" | "inspected"
      gender: "male" | "female" | "other" | "prefer_not_to_say"
      id_type:
        | "aadhar"
        | "passport"
        | "driving_license"
        | "pan"
        | "voter_id"
        | "other"
      maintenance_priority: "low" | "medium" | "high" | "urgent"
      maintenance_status: "reported" | "in_progress" | "resolved" | "cancelled"
      notification_channel: "email" | "sms" | "push" | "in_app"
      notification_type:
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_reminder"
        | "payment_received"
        | "payment_failed"
        | "review_request"
        | "admin_alert"
        | "marketing"
        | "system"
      payment_method:
        | "online"
        | "pay_at_hotel"
        | "bank_transfer"
        | "upi"
        | "card"
        | "cash"
        | "other"
      payment_status:
        | "pending"
        | "authorized"
        | "paid"
        | "partially_refunded"
        | "refunded"
        | "failed"
        | "cancelled"
      review_status: "pending" | "approved" | "rejected" | "flagged"
      room_status:
        | "available"
        | "occupied"
        | "reserved"
        | "maintenance"
        | "out_of_service"
      staff_role:
        | "reception"
        | "housekeeping"
        | "maintenance"
        | "manager"
        | "chef"
        | "security"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
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
      booking_status: [
        "pending",
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
        "waitlisted",
      ],
      cleaning_status: ["clean", "dirty", "in_progress", "inspected"],
      gender: ["male", "female", "other", "prefer_not_to_say"],
      id_type: [
        "aadhar",
        "passport",
        "driving_license",
        "pan",
        "voter_id",
        "other",
      ],
      maintenance_priority: ["low", "medium", "high", "urgent"],
      maintenance_status: ["reported", "in_progress", "resolved", "cancelled"],
      notification_channel: ["email", "sms", "push", "in_app"],
      notification_type: [
        "booking_confirmed",
        "booking_cancelled",
        "booking_reminder",
        "payment_received",
        "payment_failed",
        "review_request",
        "admin_alert",
        "marketing",
        "system",
      ],
      payment_method: [
        "online",
        "pay_at_hotel",
        "bank_transfer",
        "upi",
        "card",
        "cash",
        "other",
      ],
      payment_status: [
        "pending",
        "authorized",
        "paid",
        "partially_refunded",
        "refunded",
        "failed",
        "cancelled",
      ],
      review_status: ["pending", "approved", "rejected", "flagged"],
      room_status: [
        "available",
        "occupied",
        "reserved",
        "maintenance",
        "out_of_service",
      ],
      staff_role: [
        "reception",
        "housekeeping",
        "maintenance",
        "manager",
        "chef",
        "security",
        "other",
      ],
    },
  },
} as const
