"use client";

import React, { useState } from "react";
import { useTelemetry } from "./TelemetryProvider";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Terminal, Activity, Zap, Flame, BatteryCharging, Copy, Check, Code, List } from "lucide-react";

export function AdvancedMetrics() {
  const { latestData, history, rawPayload } = useTelemetry();
  const [copied, setCopied] = useState(false);
  const [jsonViewFormat, setJsonViewFormat] = useState<"formatted" | "raw">("formatted");

  if (!latestData) return null;

  // Format raw payload nicely with syntax highlighting support
  const getFormattedJson = () => {
    if (!rawPayload) return "{}";
    try {
      // Clean concatenated strings if any
      const matches = rawPayload.match(/\{[^{}]*\}/g);
      const targetStr = matches && matches.length > 0 ? matches[matches.length - 1] : rawPayload;
      const parsed = JSON.parse(targetStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawPayload;
    }
  };

  const formattedJsonStr = getFormattedJson();

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Realtime Telemetry Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Voltage Dynamics Chart */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-card-foreground">AC Voltage Profile</h3>
              <p className="text-xs text-muted-foreground">Grid input vs Inverter AC output (V)</p>
            </div>
            <Zap className="h-4 w-4 text-sky-500/80" />
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--card-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="grid_voltage"
                  name="Grid Voltage (V)"
                  stroke="#38bdf8"
                  fillOpacity={1}
                  fill="url(#gridGradient)"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="ac_output_voltage"
                  name="Output Voltage (V)"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Load Watts & VA Chart */}
        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-card-foreground">Load & Apparent Power</h3>
              <p className="text-xs text-muted-foreground">Real power (W) vs Apparent power (VA)</p>
            </div>
            <Activity className="h-4 w-4 text-emerald-500/80" />
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[0, "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--card-foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ac_output_watts"
                  name="Watts (W)"
                  stroke="#34d399"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="ac_output_va"
                  name="Apparent Power (VA)"
                  stroke="#818cf8"
                  strokeWidth={1.2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Diagnostics Metrics Table */}
      <div className="rounded-2xl border border-border/70 bg-card shadow-xs">
        <div className="border-b border-border/60 p-4">
          <h3 className="text-sm font-medium text-card-foreground">Comprehensive Register Telemetry</h3>
          <p className="text-xs text-muted-foreground">Raw parameter mapping fetched via ESP32 RS232 link</p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <MetricGroup
            title="AC Grid Parameters"
            icon={Zap}
            items={[
              { label: "Grid Voltage", value: `${latestData.grid_voltage} V` },
              { label: "Grid Frequency", value: `${latestData.grid_frequency} Hz` },
              { label: "AC Output Voltage", value: `${latestData.ac_output_voltage} V` },
              { label: "AC Output Frequency", value: `${latestData.ac_output_frequency} Hz` },
            ]}
          />
          <MetricGroup
            title="Load & Output"
            icon={Activity}
            items={[
              { label: "Active Output Power", value: `${latestData.ac_output_watts} W` },
              { label: "Apparent Power", value: `${latestData.ac_output_va} VA` },
              { label: "Load Percentage", value: `${latestData.output_load_percent} %` },
              { label: "Bus Voltage", value: `${latestData.bus_voltage} V` },
            ]}
          />
          <MetricGroup
            title="Solar & Battery"
            icon={BatteryCharging}
            items={[
              { label: "PV Array Input Voltage", value: `${latestData.pv_voltage} V` },
              { label: "PV Array Current", value: `${latestData.pv_current} A` },
              { label: "PV Array Power", value: `${latestData.pv_power} W` },
              { label: "Battery Charge Current", value: `${latestData.battery_charging_current} A` },
            ]}
          />
          <MetricGroup
            title="Thermal & Health"
            icon={Flame}
            items={[
              { label: "Battery Voltage", value: `${latestData.battery_voltage} V` },
              { label: "Battery State of Charge", value: `${latestData.battery_soc} %` },
              { label: "Heatsink Temp", value: `${latestData.heatsink_temperature} °C` },
              { label: "Inverter Status", value: "Normal / Operational" },
            ]}
          />
        </div>
      </div>

      {/* Beautified Raw Inverter JSON Inspector */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-card-foreground">Beautified ESP32 Telemetry JSON</h3>
              <p className="text-xs text-muted-foreground">Live payload received over MQTT <code className="font-mono text-[11px]">sako/inverter/telemetry</code></p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Format Selector */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              <button
                onClick={() => setJsonViewFormat("formatted")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                  jsonViewFormat === "formatted"
                    ? "bg-background text-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="h-3 w-3" />
                Pretty JSON
              </button>
              <button
                onClick={() => setJsonViewFormat("raw")}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition-all ${
                  jsonViewFormat === "raw"
                    ? "bg-background text-foreground shadow-xs font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3 w-3" />
                Raw Stream
              </button>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Copy JSON
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formatted Code Block */}
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-muted/20 p-4 font-mono text-xs leading-relaxed text-card-foreground">
          {jsonViewFormat === "formatted" ? (
            <pre className="text-emerald-700 dark:text-emerald-400/90 whitespace-pre-wrap">
              {formattedJsonStr}
            </pre>
          ) : (
            <div className="break-all text-muted-foreground">
              {rawPayload || "{}"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricGroup({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ElementType;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 opacity-80" />
        {title}
      </div>
      <dl className="space-y-2 text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium text-card-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
