import { ImageResponse } from "next/og";

export const alt = "EconoRank · Global GDP & Live Company Market Cap Rankings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(135deg, #0B1618 0%, #0F2528 55%, #0B4A3E 100%)",
          color: "#F6F4EF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 15,
              background: "linear-gradient(135deg, #0D3B34 0%, #0B6E5C 100%)",
              border: "2px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 6,
              padding: "12px 10px",
            }}
          >
            <div
              style={{
                width: 8,
                height: 14,
                borderRadius: 3,
                background: "rgba(246,244,239,0.72)",
              }}
            />
            <div
              style={{
                width: 8,
                height: 22,
                borderRadius: 3,
                background: "rgba(246,244,239,0.9)",
              }}
            />
            <div
              style={{
                width: 8,
                height: 31,
                borderRadius: 3,
                background: "#7EE8D2",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            <span>Econo</span>
            <span style={{ color: "#7EE8D2" }}>Rank</span>
          </div>
          <div
            style={{
              marginLeft: "auto",
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(126,232,210,0.35)",
              background: "rgba(126,232,210,0.12)",
              color: "#7EE8D2",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            econorank.com
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
            }}
          >
            A clearer view of the global economy.
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#B9CECA",
              lineHeight: 1.4,
            }}
          >
            IMF WEO GDP, GDP per capita, PPP rankings & real-time global company
            market cap across 30+ exchanges.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {[
            "IMF WEO · 190+ Economies",
            "Live Top 11,000+ Companies",
            "78 World Languages",
          ].map((pill) => (
            <div
              key={pill}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 20,
                fontWeight: 600,
                color: "#E4F1EE",
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
