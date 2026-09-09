import { ImageResponse } from "next/og";

export const alt =
  "What This Work Is Worth — A reflection for CAC and MDT professionals from Selfward.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(145deg, #0B1220 0%, #132744 55%, #244675 100%)",
          color: "white",
          padding: "64px 72px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "0.26em",
              color: "rgba(255,255,255,0.72)",
            }}
          >
            SELFWARD
          </div>

          <div
            style={{
              width: 48,
              height: 4,
              borderRadius: 999,
              background: "#F97316",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 960,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: "0.22em",
              color: "#FFB59A",
              marginBottom: 26,
            }}
          >
            A REFLECTION FOR CAC & MDT PROFESSIONALS
          </div>

          <div
            style={{
              fontSize: 76,
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "-0.045em",
              color: "#FFFFFF",
            }}
          >
            What This Work Is Worth
          </div>

          <div
            style={{
              marginTop: 30,
              fontSize: 24,
              fontWeight: 700,
              color: "rgba(255,255,255,0.58)",
            }}
          >
            Heracles · 7 min reflection
          </div>
        </div>

      </div>
    ),
    size
  );
}
