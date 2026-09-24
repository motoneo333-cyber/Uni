import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4f46e5",
          color: "white",
          fontSize: 270,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        K
      </div>
    ),
    { width: 512, height: 512 }
  );
}
