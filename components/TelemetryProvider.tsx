"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import mqtt, { MqttClient } from "mqtt";
import { InverterTelemetry, ViewMode } from "@/types/inverter";
import { parseTelemetryPayload } from "@/lib/telemetryParser";

interface TelemetryContextType {
  latestData: InverterTelemetry | null;
  history: InverterTelemetry[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  rawPayload: string;
  mqttStatus: "connected" | "connecting" | "disconnected" | "error";
  mqttError: string | null;
  lastFetchTime: Date | null;
}

const HIVEMQ_CONFIG = {
  host: "339a73185da943b089e5b2f702228ffa.s1.eu.hivemq.cloud",
  port: 8884, // WebSocket Secure (WSS) port for browser HiveMQ Cloud
  protocol: "wss" as const,
  username: "hivemq.webclient.1789957750554",
  password: "qatsCP78hpJ2M4JN6h9bxgFzQMAFup8B",
  topic: "sako/inverter/telemetry",
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("minimal");
  const [rawPayload, setRawPayload] = useState<string>("");
  const [latestData, setLatestData] = useState<InverterTelemetry | null>(null);
  const [history, setHistory] = useState<InverterTelemetry[]>([]);
  const [mqttStatus, setMqttStatus] = useState<"connected" | "connecting" | "disconnected" | "error">("connecting");
  const [mqttError, setMqttError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  const pushRawPayload = useCallback((payload: string) => {
    const now = new Date();
    setLastFetchTime(now);
    setRawPayload(payload);
    const parsed = parseTelemetryPayload(payload);
    if (parsed) {
      setLatestData({
        ...parsed,
        timestamp: now.toLocaleTimeString(),
      });
      setHistory((prev) => [...prev.slice(-49), { ...parsed, timestamp: now.toLocaleTimeString() }]);
    }
  }, []);

  // Connect exclusively to HiveMQ Cloud WebSocket MQTT stream
  useEffect(() => {
    setMqttStatus("connecting");
    setMqttError(null);

    const clientUrl = `${HIVEMQ_CONFIG.protocol}://${HIVEMQ_CONFIG.host}:${HIVEMQ_CONFIG.port}/mqtt`;
    let client: MqttClient | null = null;

    try {
      client = mqtt.connect(clientUrl, {
        username: HIVEMQ_CONFIG.username,
        password: HIVEMQ_CONFIG.password,
        clientId: `sako-link-web-${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
      });

      client.on("connect", () => {
        setMqttStatus("connected");
        setMqttError(null);
        client?.subscribe(HIVEMQ_CONFIG.topic, (err) => {
          if (err) {
            console.error("Subscription error:", err);
            setMqttError(`Subscribe failed: ${err.message}`);
          }
        });
      });

      client.on("message", (topic, message) => {
        if (topic === HIVEMQ_CONFIG.topic) {
          const rawStr = message.toString();
          pushRawPayload(rawStr);
        }
      });

      client.on("error", (err) => {
        console.error("HiveMQ MQTT error:", err);
        setMqttStatus("error");
        setMqttError(err.message || "Connection error");
      });

      client.on("offline", () => {
        setMqttStatus("disconnected");
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize MQTT";
      setMqttStatus("error");
      setMqttError(errorMsg);
    }

    return () => {
      if (client) {
        client.end(true);
      }
    };
  }, [pushRawPayload]);

  return (
    <TelemetryContext.Provider
      value={{
        latestData,
        history,
        viewMode,
        setViewMode,
        rawPayload,
        mqttStatus,
        mqttError,
        lastFetchTime,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
}
