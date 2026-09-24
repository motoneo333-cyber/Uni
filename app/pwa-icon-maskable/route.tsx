import { ImageResponse } from "next/og";

// Ícono "maskable": Android puede recortarlo en círculo/squircle, así que el
// contenido tiene que quedar bien adentro de la zona segura (relleno hasta
// el borde, letra chica y centrada).
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
          fontSize: 180,
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
