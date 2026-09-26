import React, { useState, useEffect } from "react";
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
import { Terminal, Activity, Zap, Flame, BatteryCharging, Copy, Check, Code, List, Calendar, Database } from "lucide-react";

export function AdvancedMetrics() {
  const { latestData, history, rawPayload } = useTelemetry();
  const [copied, setCopied] = useState(false);
  const [jsonViewFormat, setJsonViewFormat] = useState<"formatted" | "raw">("formatted");

  // Supabase PostgreSQL Historical Query State
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d" | "custom">("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoadingHistory(true);
      try {
        let url = `/api/telemetry/history?range=${timeRange}`;
        if (timeRange === "custom" && startDate && endDate) {
          url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Convert recorded_at to user's exact client browser local timezone
          const formattedRows = json.data.map((row: any) => {
            const d = new Date(row.recorded_at);
            const timeStr = d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });
            const dateStr = d.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            });
            return {
              ...row,
              fullTimestamp: `${dateStr} ${timeStr}`,
              dateLabel: `${dateStr} ${timeStr}`,
            };
          });
          setHistoricalData(formattedRows);
        } else {
          setHistoricalData([]);
        }
      } catch (err) {
        console.error("Failed to fetch Supabase telemetry history:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [timeRange, startDate, endDate]);

  if (!latestData) return null;

  // Format raw payload nicely with syntax highlighting support
  const getFormattedJson = () => {
    if (!rawPayload) return "{}";
    try {
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
      {/* Live Stream Telemetry Charts (Always Real-Time) */}

      {/* Custom Date Pickers */}
      {timeRange === "custom" && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-xs text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Start:</span>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">End:</span>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* Live Stream Telemetry Charts (Always Real-Time) */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Live Telemetry Streams (3s Real-Time)</h3>
              <p className="text-xs text-muted-foreground">Active MQTT sliding buffer (Last 50 packets)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Voltage Dynamics Chart */}
          <div className="rounded-xl border border-border/70 bg-muted/10 p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-card-foreground">AC Voltage Profile</h4>
                <p className="text-[11px] text-muted-foreground">Grid input vs Inverter AC output (V)</p>
              </div>
            </div>
            <div className="h-48 w-full">
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
          <div className="rounded-xl border border-border/70 bg-muted/10 p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-card-foreground">Load & Apparent Power</h4>
                <p className="text-[11px] text-muted-foreground">Real power (W) vs Apparent power (VA)</p>
              </div>
            </div>
            <div className="h-48 w-full">
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
      </div>

      {/* Historical Data Analytics Section (Supabase PostgreSQL Query) */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Historical Telemetry Analytics (Supabase DB)</h3>
              <p className="text-xs text-muted-foreground">Filtered query results from 1-minute throttled database persistence</p>
            </div>
          </div>

          {/* Timeframe Range Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1 text-xs">
            {(["today", "7d", "30d", "custom"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-3 py-1 font-medium transition-all ${
                  timeRange === range
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range === "today"
                  ? "Today"
                  : range === "7d"
                  ? "Last 7 Days"
                  : range === "30d"
                  ? "Last 30 Days"
                  : "Custom Range"}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Range Date Filters */}
        {timeRange === "custom" && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 bg-muted/10 p-3 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Start Date:</span>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground">End Date:</span>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Historical Power Generation vs Load Chart */}
        <div className="rounded-xl border border-border/70 bg-muted/10 p-4 shadow-xs relative">
          {isLoadingHistory && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/80 text-xs text-muted-foreground font-medium">
              Querying Supabase PostgreSQL historical dataset...
            </div>
          )}
          {!isLoadingHistory && historicalData.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-card/90 p-4 text-center text-xs text-muted-foreground">
              <span>No historical data logged yet for this range.</span>
              <span className="mt-1 text-[11px] opacity-75">Data is saved to Supabase every 60 seconds.</span>
            </div>
          )}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-card-foreground">Solar Generation vs Load vs Grid Consumption</h4>
              <p className="text-[11px] text-muted-foreground">
                Historical trends ({timeRange === "today" ? "Today" : timeRange === "7d" ? "Last 7 Days" : timeRange === "30d" ? "Last 30 Days" : "Custom Range"})
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="pvHistGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis
                  dataKey="fullTimestamp"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis domain={[0, "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  labelFormatter={(label) => `Time: ${label}`}
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
                  dataKey="pv_power"
                  name="Solar PV (W)"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#pvHistGradient)"
                  strokeWidth={1.5}
                />
                <Line
                  type="monotone"
                  dataKey="ac_output_watts"
                  name="Active Load (W)"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="grid_watts"
                  name="Grid Utilized (W)"
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Energy Consumption & Summary Statistics Panel */}
        {historicalData.length > 0 && (() => {
          // Calculate total accumulated Watt-minutes from 1-minute throttled DB snapshots
          // Each snapshot row represents ~1 minute of continuous operational power
          let sumGridWatts = 0;
          let sumPvWatts = 0;
          let sumLoadWatts = 0;
          let sumBattWatts = 0;
          let maxLoadWatts = 0;
          let maxPvWatts = 0;
          let sumTemp = 0;
          let sumGridVolt = 0;

          historicalData.forEach((row) => {
            const gWatts = Number(row.grid_watts || 0);
            const pWatts = Number(row.pv_power || 0);
            const lWatts = Number(row.ac_output_watts || 0);
            const bVolts = Number(row.battery_voltage || 0);
            const bCurr = Number(row.battery_charging_current || 0);
            const bWatts = bVolts > 0 ? Math.abs(bCurr * bVolts) : 0;

            sumGridWatts += gWatts;
            sumPvWatts += pWatts;
            sumLoadWatts += lWatts;
            sumBattWatts += bWatts;

            if (lWatts > maxLoadWatts) maxLoadWatts = lWatts;
            if (pWatts > maxPvWatts) maxPvWatts = pWatts;

            sumTemp += Number(row.heatsink_temperature || 0);
            sumGridVolt += Number(row.grid_voltage || 0);
          });

          const totalSnapshots = historicalData.length;
          // Converting 1-minute snapshot averages to Energy Units (kWh): (Total Watt-Minutes) / 60 / 1000
          const gridKwh = (sumGridWatts / 60 / 1000).toFixed(2);
          const pvKwh = (sumPvWatts / 60 / 1000).toFixed(2);
          const battKwh = (sumBattWatts / 60 / 1000).toFixed(2);
          const loadKwh = (sumLoadWatts / 60 / 1000).toFixed(2);

          const avgGridVoltage = (sumGridVolt / totalSnapshots).toFixed(1);
          const avgTemp = (sumTemp / totalSnapshots).toFixed(1);
          const solarSelfSufficiency = sumLoadWatts > 0 ? Math.min(100, Math.round((sumPvWatts / sumLoadWatts) * 100)) : 0;

          return (
            <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-card-foreground">
                  Cumulative Energy & Operational Statistics ({timeRange === "today" ? "Today" : timeRange === "7d" ? "Last 7 Days" : timeRange === "30d" ? "Last 30 Days" : "Custom Range"})
                </h4>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {totalSnapshots} DB Snapshots Analyzed
                </span>
              </div>

              {/* 4 Core Energy Units Metric Tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Total Grid Usage */}
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5 shadow-xs">
                  <div className="text-[11px] font-medium text-sky-600 dark:text-sky-400">Total Grid Usage</div>
                  <div className="mt-1 text-lg font-bold tracking-tight text-card-foreground">
                    {gridKwh} <span className="text-xs font-semibold text-muted-foreground">kWh (Units)</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                    {sumGridWatts.toLocaleString()} W Cumulative
                  </div>
                </div>

                {/* Total Solar PV Generation */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 shadow-xs">
                  <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Total Solar PV Yield</div>
                  <div className="mt-1 text-lg font-bold tracking-tight text-card-foreground">
                    {pvKwh} <span className="text-xs font-semibold text-muted-foreground">kWh (Units)</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                    {sumPvWatts.toLocaleString()} W Cumulative
                  </div>
                </div>

                {/* Total Battery Energy */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 shadow-xs">
                  <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Total Battery Flow</div>
                  <div className="mt-1 text-lg font-bold tracking-tight text-card-foreground">
                    {battKwh} <span className="text-xs font-semibold text-muted-foreground">kWh (Units)</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                    {sumBattWatts.toLocaleString()} W Cumulative
                  </div>
                </div>

                {/* Total House Consumption */}
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 shadow-xs">
                  <div className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Total Consumption</div>
                  <div className="mt-1 text-lg font-bold tracking-tight text-card-foreground">
                    {loadKwh} <span className="text-xs font-semibold text-muted-foreground">kWh (Units)</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
                    {sumLoadWatts.toLocaleString()} W Cumulative
                  </div>
                </div>
              </div>

              {/* Useful Operational Insights Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs pt-1">
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="text-[11px] text-muted-foreground font-medium">Peak Solar Generation</div>
                  <div className="mt-1 text-sm font-semibold text-card-foreground">{maxPvWatts} W</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="text-[11px] text-muted-foreground font-medium">Peak Active Load</div>
                  <div className="mt-1 text-sm font-semibold text-card-foreground">{maxLoadWatts} W</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="text-[11px] text-muted-foreground font-medium">Solar Coverage Ratio</div>
                  <div className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{solarSelfSufficiency}% Self-Sufficient</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="text-[11px] text-muted-foreground font-medium">Avg Grid / Heatsink</div>
                  <div className="mt-1 text-sm font-semibold text-card-foreground">{avgGridVoltage}V • {avgTemp}°C</div>
                </div>
              </div>
            </div>
          );
        })()}
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
