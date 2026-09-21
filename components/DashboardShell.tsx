"use client";

import React, { useState } from "react";
import { useTelemetry } from "./TelemetryProvider";
import { InverterOverview } from "./InverterOverview";
import { AdvancedMetrics } from "./AdvancedMetrics";
import { Cpu, LayoutDashboard, Sliders, Moon, Sun, Wifi, AlertTriangle, Clock } from "lucide-react";

export function DashboardShell() {
  const { viewMode, setViewMode, mqttStatus, mqttError, lastFetchTime } = useTelemetry();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Top Navbar with Animated Live Timestamp Badge */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Left Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                Sako Link
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">Sako Sunon Pro 5.5Kw Telemetry</p>
            </div>
          </div>

          {/* Center / Right Section: Live Animated Last Received Badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3.5 py-1 text-xs font-medium text-card-foreground shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Last Received:</span>
            <span className="font-mono font-semibold text-card-foreground">
              {lastFetchTime ? lastFetchTime.toLocaleTimeString() : "Connecting..."}
            </span>
          </div>

          {/* Mode Switcher & Dark Mode Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-border bg-muted/50 p-1">
              <button
                onClick={() => setViewMode("minimal")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === "minimal"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Minimal
              </button>
              <button
                onClick={() => setViewMode("advanced")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === "advanced"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Advanced
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile-only Last Received Bar */}
        <div className="flex sm:hidden items-center justify-center gap-2 border-t border-border/40 bg-muted/20 py-1.5 px-4 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Last Received:</span>
          <span className="font-mono font-semibold text-card-foreground">
            {lastFetchTime ? lastFetchTime.toLocaleTimeString() : "Connecting..."}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* HiveMQ Connection Bar */}
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            {mqttStatus === "connected" ? (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
                <span>HiveMQ Cloud Live Stream: <code className="font-mono text-[11px]">sako/inverter/telemetry</code></span>
              </div>
            ) : mqttStatus === "connecting" ? (
              <div className="flex items-center gap-2 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/20">
                <Wifi className="h-3.5 w-3.5 animate-pulse" />
                <span>Connecting to HiveMQ Cloud...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{mqttError || "HiveMQ Disconnected"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic View rendering */}
        {viewMode === "minimal" ? <InverterOverview /> : <AdvancedMetrics />}
      </main>
    </div>
  );
}
