"use client";

import React, { useRef, useState, useEffect } from "react";
import { useTelemetry } from "./TelemetryProvider";
import { Zap, Sun, Battery, Home, Cpu, Thermometer, Radio } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

export function InverterOverview() {
  const { latestData } = useTelemetry();

  // Container & Node element references for dynamic SVG line alignment
  const containerRef = useRef<HTMLDivElement>(null);
  const pvRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inverterRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);
  const batteryRef = useRef<HTMLDivElement>(null);

  // Calculated connection anchor coordinates
  const [coords, setCoords] = useState<{
    pvRight: Point;
    gridRight: Point;
    inverterLeft: Point;
    inverterRight: Point;
    inverterBottom: Point;
    loadLeft: Point;
    batteryTop: Point;
  }>({
    pvRight: { x: 0, y: 0 },
    gridRight: { x: 0, y: 0 },
    inverterLeft: { x: 0, y: 0 },
    inverterRight: { x: 0, y: 0 },
    inverterBottom: { x: 0, y: 0 },
    loadLeft: { x: 0, y: 0 },
    batteryTop: { x: 0, y: 0 },
  });

  // Calculate pixel-perfect coordinates relative to container
  const updateCoordinates = () => {
    if (
      !containerRef.current ||
      !pvRef.current ||
      !gridRef.current ||
      !inverterRef.current ||
      !loadRef.current ||
      !batteryRef.current
    )
      return;

    const cRect = containerRef.current.getBoundingClientRect();
    const pvR = pvRef.current.getBoundingClientRect();
    const gridR = gridRef.current.getBoundingClientRect();
    const invR = inverterRef.current.getBoundingClientRect();
    const loadR = loadRef.current.getBoundingClientRect();
    const batR = batteryRef.current.getBoundingClientRect();

    setCoords({
      pvRight: {
        x: pvR.right - cRect.left,
        y: pvR.top + pvR.height / 2 - cRect.top,
      },
      gridRight: {
        x: gridR.right - cRect.left,
        y: gridR.top + gridR.height / 2 - cRect.top,
      },
      inverterLeft: {
        x: invR.left - cRect.left,
        y: invR.top + invR.height / 2 - cRect.top,
      },
      inverterRight: {
        x: invR.right - cRect.left,
        y: invR.top + invR.height / 2 - cRect.top,
      },
      inverterBottom: {
        x: invR.left + invR.width / 2 - cRect.left,
        y: invR.bottom - cRect.top,
      },
      loadLeft: {
        x: loadR.left - cRect.left,
        y: loadR.top + loadR.height / 2 - cRect.top,
      },
      batteryTop: {
        x: batR.left + batR.width / 2 - cRect.left,
        y: batR.top - cRect.top,
      },
    });
  };

  useEffect(() => {
    updateCoordinates();
    window.addEventListener("resize", updateCoordinates);
    return () => window.removeEventListener("resize", updateCoordinates);
  }, [latestData]);

  if (!latestData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card p-6 text-muted-foreground shadow-xs">
        Connecting to ESP32 Telemetry stream...
      </div>
    );
  }

  const {
    grid_voltage,
    grid_frequency,
    ac_output_voltage,
    ac_output_watts,
    output_load_percent,
    pv_voltage,
    pv_power,
    battery_voltage,
    battery_charging_current,
    battery_soc,
    heatsink_temperature,
  } = latestData;

  // Active Source & Battery State Logic
  const isPvActive = pv_power > 10 || pv_voltage > 120;
  const isGridActive = grid_voltage > 100;
  const isBatteryDischarging = battery_voltage > 12 && (battery_charging_current < 0 || (!isGridActive && !isPvActive));
  const isBatteryCharging = battery_charging_current > 0 || (battery_voltage > 12 && (isPvActive || isGridActive));
  const isLoadActive = ac_output_watts > 5;

  let activeSourceLabel = "Utility Grid";
  if (isPvActive && pv_power > 50) {
    activeSourceLabel = "Solar Array (PV)";
  } else if (isGridActive) {
    activeSourceLabel = "Utility Grid";
  } else if (isBatteryDischarging) {
    activeSourceLabel = "Battery Storage";
  }

  // Smooth Bezier Curve helper
  const makeBezierCurve = (p1: Point, p2: Point) => {
    const dx = Math.abs(p2.x - p1.x) / 2;
    return `M ${p1.x},${p1.y} C ${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`;
  };

  // Vertical Curve helper
  const makeVerticalCurve = (p1: Point, p2: Point) => {
    const dy = Math.abs(p2.y - p1.y) / 2;
    return `M ${p1.x},${p1.y} C ${p1.x},${p1.y + dy} ${p2.x},${p2.y - dy} ${p2.x},${p2.y}`;
  };

  return (
    <div className="space-y-6">
      {/* Power Flow Diagram Canvas */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-card-foreground">
              Sako Sunon Pro 5.5Kw Flow Topology
            </h2>
            <p className="text-xs text-muted-foreground">
              Real-time energy routing: <span className="font-medium text-foreground">{activeSourceLabel}</span> ➔ Load & Battery
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3.5 py-1 text-xs font-medium text-card-foreground">
            <Radio className="h-3.5 w-3.5 text-emerald-600/90 dark:text-emerald-400/90 animate-pulse" />
            Active Source: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeSourceLabel}</span>
          </div>
        </div>

        {/* Dynamic Canvas Container */}
        <div ref={containerRef} className="relative py-2">
          {/* Dynamically Aligned SVG Overlay */}
          <svg className="absolute inset-0 pointer-events-none h-full w-full z-0">
            {/* PV ➔ Inverter Line */}
            {coords.pvRight.x > 0 && (
              <path
                d={makeBezierCurve(coords.pvRight, coords.inverterLeft)}
                fill="none"
                stroke={isPvActive ? "#f59e0b" : "var(--border)"}
                strokeWidth={isPvActive ? "2.5" : "1.5"}
                strokeOpacity={isPvActive ? "0.85" : "0.35"}
                className={isPvActive ? "animate-flow-forward" : ""}
              />
            )}

            {/* Grid ➔ Inverter Line */}
            {coords.gridRight.x > 0 && (
              <path
                d={makeBezierCurve(coords.gridRight, coords.inverterLeft)}
                fill="none"
                stroke={isGridActive ? "#0284c7" : "var(--border)"}
                strokeWidth={isGridActive ? "2.5" : "1.5"}
                strokeOpacity={isGridActive ? "0.85" : "0.35"}
                className={isGridActive ? "animate-flow-forward" : ""}
              />
            )}

            {/* Inverter ➔ Active Load Line */}
            {coords.inverterRight.x > 0 && (
              <path
                d={makeBezierCurve(coords.inverterRight, coords.loadLeft)}
                fill="none"
                stroke={isLoadActive ? "#10b981" : "var(--border)"}
                strokeWidth={isLoadActive ? "2.5" : "1.5"}
                strokeOpacity={isLoadActive ? "0.85" : "0.35"}
                className={isLoadActive ? "animate-flow-forward" : ""}
              />
            )}

            {/* Inverter ↔ Battery Storage Line */}
            {coords.inverterBottom.x > 0 && (
              <path
                d={makeVerticalCurve(coords.inverterBottom, coords.batteryTop)}
                fill="none"
                stroke={isBatteryCharging || isBatteryDischarging ? "#10b981" : "var(--border)"}
                strokeWidth={isBatteryCharging || isBatteryDischarging ? "2.5" : "1.5"}
                strokeOpacity={isBatteryCharging || isBatteryDischarging ? "0.85" : "0.35"}
                className={
                  isBatteryCharging
                    ? "animate-flow-forward" // Inverter ➔ Battery (Downwards)
                    : isBatteryDischarging
                    ? "animate-flow-reverse" // Battery ➔ Inverter (Upwards)
                    : ""
                }
              />
            )}
          </svg>

          {/* Node Grid Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-7 md:items-center relative z-10">
            {/* Inputs Column */}
            <div className="space-y-4 md:col-span-2">
              {/* Solar PV Box */}
              <div
                ref={pvRef}
                className={`relative rounded-xl border p-4 transition-all ${
                  isPvActive
                    ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs"
                    : "border-border/60 bg-muted/10 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`rounded-lg p-2 ${
                        isPvActive
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-card-foreground">Solar (PV)</span>
                  </div>
                  {isPvActive && <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />}
                </div>
                <div className="mt-3">
                  <div className="text-lg font-semibold text-card-foreground">{pv_power} W</div>
                  <div className="text-[11px] text-muted-foreground">{pv_voltage} V</div>
                </div>
              </div>

              {/* Grid Utility Box */}
              <div
                ref={gridRef}
                className={`relative rounded-xl border p-4 transition-all ${
                  isGridActive
                    ? "border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10 shadow-xs"
                    : "border-border/60 bg-muted/10 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`rounded-lg p-2 ${
                        isGridActive
                          ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-card-foreground">Grid Utility</span>
                  </div>
                  {isGridActive && <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-ping" />}
                </div>
                <div className="mt-3">
                  <div className="text-lg font-semibold text-card-foreground">{grid_voltage} V</div>
                  <div className="text-[11px] text-muted-foreground">{grid_frequency} Hz</div>
                </div>
              </div>
            </div>

            {/* Spacer Column 1 */}
            <div className="hidden md:block md:col-span-1" />

            {/* Central Inverter Hub */}
            <div
              ref={inverterRef}
              className="md:col-span-1 flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 p-5 text-center shadow-xs my-2"
            >
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Cpu className="h-6 w-6" />
              </div>
              <span className="mt-2 text-xs font-semibold text-card-foreground">Sako Sunon Pro 5.5Kw</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{latestData.bus_voltage}V DC Bus</span>
            </div>

            {/* Spacer Column 2 */}
            <div className="hidden md:block md:col-span-1" />

            {/* Output Node (Load) */}
            <div
              ref={loadRef}
              className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 dark:bg-emerald-500/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-600 dark:text-emerald-400">
                    <Home className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-card-foreground">Active Load</span>
                </div>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="mt-3">
                <div className="text-lg font-semibold text-card-foreground">{ac_output_watts} W</div>
                <div className="text-[11px] text-muted-foreground">
                  {ac_output_voltage}V • {output_load_percent}% Capacity
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Battery Node (Clean Multi-Line Layout) */}
          <div className="mt-8 flex flex-col items-center border-t border-border/50 pt-6">
            <div
              ref={batteryRef}
              className="w-full max-w-md rounded-xl border border-border/60 bg-muted/15 p-4 relative z-10 shadow-xs"
            >
              {/* Line 1: Header + Battery Icon + Badges */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`rounded-lg p-2 ${
                      isBatteryDischarging || isBatteryCharging
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Battery className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-card-foreground">
                    Battery Storage Reserve
                  </span>
                </div>

                {isBatteryCharging && (
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                    Charging (Inverter ➔ Battery)
                  </span>
                )}
                {isBatteryDischarging && (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                    Discharging (Battery ➔ Inverter)
                  </span>
                )}
              </div>

              {/* Line 2 & 3: Multi-line metrics grid */}
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                {/* Column 1: Battery Telemetry */}
                <div>
                  <div className="text-[11px] text-muted-foreground font-medium">Voltage & SOC</div>
                  <div className="mt-0.5 text-sm font-semibold text-card-foreground">
                    {battery_voltage} V <span className="text-xs font-normal text-muted-foreground">({battery_soc}%)</span>
                  </div>
                </div>

                {/* Column 2: Charge / Discharge Current & Temp */}
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground font-medium">Current & Temp</div>
                  <div className="mt-0.5 text-xs font-semibold text-card-foreground flex items-center justify-end gap-1.5">
                    <span>{battery_charging_current} A</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="flex items-center text-amber-600 dark:text-amber-400">
                      <Thermometer className="h-3 w-3 mr-0.5" />
                      {heatsink_temperature} °C
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Metric Gauges */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricTile label="Output Load" value={`${output_load_percent}%`} sub={`Max 5500W`} icon={Home} />
        <MetricTile label="AC Output" value={`${ac_output_voltage}V`} sub={`50.2 Hz`} icon={Zap} />
        <MetricTile label="Internal Bus" value={`${latestData.bus_voltage}V`} sub="DC Bus" icon={Cpu} />
        <MetricTile label="PV Voltage" value={`${pv_voltage}V`} sub="Solar Input" icon={Sun} />
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="h-4 w-4 opacity-75" />
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-card-foreground">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
