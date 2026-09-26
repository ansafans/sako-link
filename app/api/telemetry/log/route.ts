import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { parseTelemetryPayload } from "@/lib/telemetryParser";

export async function POST(req: NextRequest) {
  try {
    let bodyText = "";
    try {
      bodyText = await req.text();
    } catch {
      return NextResponse.json({ error: "Empty request body" }, { status: 400 });
    }

    if (!bodyText) {
      return NextResponse.json({ error: "Empty request payload from ESP32" }, { status: 400 });
    }

    // Parse telemetry payload directly from ESP32 HTTP POST body
    // Handles clean JSON, concatenated ESP32 packets, or stringified payloads
    const parsed = parseTelemetryPayload(bodyText);

    let pv_power = 0;
    let ac_output_watts = 0;
    let grid_watts = 0;
    let bus_voltage = 0;
    let heatsink_temperature = 0;

    if (parsed) {
      pv_power = parsed.pv_power;
      ac_output_watts = parsed.ac_output_watts;
      bus_voltage = parsed.bus_voltage;
      heatsink_temperature = parsed.heatsink_temperature;

      // Dynamic Grid Power (Watts) Calculation
      const isPvActive = parsed.pv_power > 10 || parsed.pv_voltage > 120;
      const isGridActive = parsed.grid_voltage > 100;
      const isLoadActive = parsed.ac_output_watts > 5;
      if (isGridActive) {
        if (isPvActive && isLoadActive && parsed.pv_power < parsed.ac_output_watts) {
          grid_watts = Math.max(0, parsed.ac_output_watts - parsed.pv_power);
        } else if (!isPvActive && isLoadActive) {
          grid_watts = parsed.ac_output_watts;
        }
        if (parsed.battery_charging_current > 0 && !isPvActive) {
          grid_watts += Math.round(parsed.battery_charging_current * parsed.battery_voltage);
        }
      }
    } else {
      // Fallback for direct json object parsing
      try {
        const json = JSON.parse(bodyText);
        pv_power = Number(json.pv_power || 0);
        ac_output_watts = Number(json.ac_output_watts || 0);
        grid_watts = Number(json.grid_watts || 0);
        bus_voltage = Number(json.bus_voltage || 0);
        heatsink_temperature = Number(json.heatsink_temperature || 0);
      } catch {
        return NextResponse.json({ error: "Invalid telemetry payload format from ESP32" }, { status: 400 });
      }
    }

    // Safety throttling: Prevent inserting duplicate rows if ESP32 sends POST faster than 55s
    const { data: latestRecords } = await supabase
      .from("inverter_telemetry")
      .select("recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (latestRecords && latestRecords.length > 0) {
      const lastRecordedTime = new Date(latestRecords[0].recorded_at).getTime();
      const nowTime = new Date().getTime();
      if (nowTime - lastRecordedTime < 55000) {
        return NextResponse.json({ success: true, status: "throttled", message: "Record logged recently" });
      }
    }

    // Save record to Supabase
    const { data, error } = await supabase.from("inverter_telemetry").insert([
      {
        pv_power,
        ac_output_watts,
        grid_watts,
        bus_voltage,
        heatsink_temperature,
        recorded_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
