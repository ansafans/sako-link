export interface InverterTelemetry {
  grid_voltage: number;
  grid_frequency: number;
  ac_output_voltage: number;
  ac_output_frequency: number;
  ac_output_va: number;
  ac_output_watts: number;
  output_load_percent: number;
  bus_voltage: number;
  battery_voltage: number;
  battery_charging_current: number;
  battery_soc: number;
  heatsink_temperature: number;
  pv_current: number;
  pv_voltage: number;
  pv_power: number;
  timestamp: string;
}

export type ViewMode = 'minimal' | 'advanced';
