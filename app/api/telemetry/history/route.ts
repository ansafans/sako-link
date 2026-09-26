import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today"; // today, 7d, 30d, custom
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = supabase
      .from("inverter_telemetry")
      .select("*")
      .order("recorded_at", { ascending: true });

    const now = new Date();

    if (range === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte("recorded_at", todayStart);
    } else if (range === "7d") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("recorded_at", sevenDaysAgo);
    } else if (range === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("recorded_at", thirtyDaysAgo);
    } else if (range === "custom" && startDate && endDate) {
      query = query.gte("recorded_at", startDate).lte("recorded_at", endDate);
    }

    const { data, error } = await query.limit(5000);

    if (error) {
      return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
    }

    // Transform recorded_at to displayable local timestamp using exact database timestamp
    const formattedData = (data || []).map((row) => {
      const recDate = new Date(row.recorded_at);
      const timeStr = recDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateStr = recDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });

      return {
        ...row,
        timestamp: `${timeStr}`,
        fullTimestamp: `${dateStr} ${timeStr}`,
        dateLabel: `${dateStr} ${timeStr}`,
      };
    });

    return NextResponse.json({ success: true, data: formattedData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, data: [], error: message }, { status: 500 });
  }
}
