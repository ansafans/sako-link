import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iaclcmqpiaewuxxphbgf.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_d0tD5jOqhalZzSsJF63ezg_CfUijbst";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SupabaseTelemetryRow {
  id?: number;
  recorded_at?: string;
  pv_power: number;
  ac_output_watts: number;
  grid_watts: number;
  bus_voltage: number;
  heatsink_temperature: number;
}
