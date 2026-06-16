import React, { useMemo } from "react";
import { Tooltip, Typography } from "antd";

const { Text } = Typography;

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const COLOR_SCALE = [
  "#ebedf0",
  "#9be9a8",
  "#40c463",
  "#30a14e",
  "#216e39",
];

const getColor = (minutes, maxMinutes) => {
  if (!minutes || minutes === 0) return COLOR_SCALE[0];
  if (maxMinutes === 0) return COLOR_SCALE[0];
  const ratio = minutes / maxMinutes;
  if (ratio <= 0.25) return COLOR_SCALE[1];
  if (ratio <= 0.5) return COLOR_SCALE[2];
  if (ratio <= 0.75) return COLOR_SCALE[3];
  return COLOR_SCALE[4];
};

const ProductivityHeatmap = ({ data }) => {
  const maxMinutes = useMemo(() => {
    if (!data || data.length === 0) return 0;
    let max = 0;
    data.forEach((dayData) => {
      if (dayData.hours) {
        dayData.hours.forEach((h) => {
          if (h.minutes > max) max = h.minutes;
        });
      }
    });
    return max;
  }, [data]);

  // Build a 7x24 grid from data
  const grid = useMemo(() => {
    const result = Array.from({ length: 7 }, (_, dayIndex) => {
      const targetDay = dayIndex === 6 ? 1 : dayIndex + 2;
      const dayData = data?.find((d) => d.day === targetDay) || {};
      const dayName = dayData.dayName || DAY_LABELS[dayIndex];
      const hours = Array.from({ length: 24 }, (_, hourIndex) => {
        const hourData = dayData.hours?.find((h) => h.hour === hourIndex) || {};
        return {
          hour: hourIndex,
          sessions: hourData.sessions || 0,
          minutes: hourData.minutes || 0,
        };
      });
      return { day: dayIndex, dayName, hours };
    });
    return result;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
        <Text type="secondary">Không có dữ liệu heatmap</Text>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      {/* Hour labels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48px repeat(24, 1fr)",
          gap: "2px",
          marginBottom: "2px",
          minWidth: "600px",
        }}
      >
        <div /> {/* Empty corner */}
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              fontSize: "10px",
              color: "#8c8c8c",
              fontWeight: 500,
            }}
          >
            {i}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {grid.map((dayRow) => (
        <div
          key={dayRow.day}
          style={{
            display: "grid",
            gridTemplateColumns: "48px repeat(24, 1fr)",
            gap: "2px",
            marginBottom: "2px",
            minWidth: "600px",
          }}
        >
          {/* Day label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: "8px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#595959",
            }}
          >
            {dayRow.dayName}
          </div>

          {/* Hour cells */}
          {dayRow.hours.map((hourData) => (
            <Tooltip
              key={hourData.hour}
              title={`${dayRow.dayName}, ${String(hourData.hour).padStart(2, "0")}:00 — ${hourData.sessions} phiên, ${hourData.minutes} phút`}
              placement="top"
            >
              <div
                style={{
                  aspectRatio: "1",
                  backgroundColor: getColor(hourData.minutes, maxMinutes),
                  borderRadius: "2px",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  minHeight: "14px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.2)";
                  e.currentTarget.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";
                  e.currentTarget.style.zIndex = "1";
                  e.currentTarget.style.position = "relative";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.zIndex = "auto";
                  e.currentTarget.style.position = "static";
                }}
              />
            </Tooltip>
          ))}
        </div>
      ))}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "4px",
          marginTop: "12px",
          paddingRight: "8px",
        }}
      >
        <Text style={{ fontSize: "11px", color: "#8c8c8c", marginRight: "4px" }}>
          Ít
        </Text>
        {COLOR_SCALE.map((color, i) => (
          <div
            key={i}
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: color,
              borderRadius: "2px",
            }}
          />
        ))}
        <Text style={{ fontSize: "11px", color: "#8c8c8c", marginLeft: "4px" }}>
          Nhiều
        </Text>
      </div>
    </div>
  );
};

export default ProductivityHeatmap;
