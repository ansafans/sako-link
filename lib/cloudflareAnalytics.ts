export const CLOUDFLARE_CONFIG = {
  accountId: "7802526b9b169b20b4b76dc49327662f",
  apiToken: "cfat_trMliVeKUHc8FtcO8Ln7FlDO2qmqiEGlGcoiZFK78965749e",
  accessKeyId: "e47e29493af14ed20fa0ee49c124e134",
  secretAccessKey: "2c73a52db9e2220df43539f2e7179c4c43b3b08f2b1c005a917fc344696bfe6b",
  s3Endpoint: "https://7802526b9b169b20b4b76dc49327662f.r2.cloudflarestorage.com",
  datasetName: "inverter_telemetry",
};

export interface TelemetryLogPayload {
  grid_voltage: number;
  grid_frequency: number;
  ac_output_voltage: number;
  ac_output_watts: number;
  ac_output_va: number;
  output_load_percent: number;
  bus_voltage: number;
  battery_voltage: number;
  battery_charging_current: number;
  battery_soc: number;
  heatsink_temperature: number;
  pv_current: number;
  pv_voltage: number;
  pv_power: number;
  timestamp?: string;
}
