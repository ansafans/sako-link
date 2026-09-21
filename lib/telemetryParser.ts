import { InverterTelemetry } from "@/types/inverter";

/**
 * Parses ESP32 RS232 raw JSON strings.
 * ESP32 sometimes publishes concatenated JSON packets like:
 * `{"grid_voltage":227.6,...}34{"grid_voltage":228.5,...}`
 */
export function parseTelemetryPayload(rawInput: string): InverterTelemetry | null {
  if (!rawInput || typeof rawInput !== "string") return null;

  try {
    // Standard parse attempt
    return parseSingleJson(rawInput);
  } catch {
    // Clean concatenated or noisy string by extracting valid JSON objects
    const jsonMatches = rawInput.match(/\{[^{}]*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      // Pick the last valid JSON packet in stream (latest timestamp payload)
      for (let i = jsonMatches.length - 1; i >= 0; i--) {
        try {
          return parseSingleJson(jsonMatches[i]);
        } catch {
          // ignore broken sub-match and continue loop
        }
      }
    }
  }

  return null;
}

function parseSingleJson(str: string): InverterTelemetry {
  const data = JSON.parse(str);
  return {
    grid_voltage: Number(data.grid_voltage || 0),
    grid_frequency: Number(data.grid_frequency || 0),
    ac_output_voltage: Number(data.ac_output_voltage || 0),
    ac_output_frequency: Number(data.ac_output_frequency || 0),
    ac_output_va: Number(data.ac_output_va || 0),
    ac_output_watts: Number(data.ac_output_watts || 0),
    output_load_percent: Number(data.output_load_percent || 0),
    bus_voltage: Number(data.bus_voltage || 0),
    battery_voltage: Number(data.battery_voltage || 0),
    battery_charging_current: Number(data.battery_charging_current || 0),
    battery_soc: Number(data.battery_soc || 0),
    heatsink_temperature: Number(data.heatsink_temperature || 0),
    pv_current: Number(data.pv_current || 0),
    pv_voltage: Number(data.pv_voltage || 0),
    pv_power: Number(data.pv_power || 0),
    timestamp: new Date().toLocaleTimeString(),
  };
}

export const INITIAL_MOCK_PAYLOAD = `{"grid_voltage":227.6,"grid_frequency":50.2,"ac_output_voltage":227.6,"ac_output_frequency":50.2,"ac_output_va":182,"ac_output_watts":126,"output_load_percent":3,"bus_voltage":380,"battery_voltage":0,"battery_charging_current":0,"battery_soc":0,"heatsink_temperature":39,"pv_current":0,"pv_voltage":260.7,"pv_power":0}`;
