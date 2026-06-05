export default function PageLoader() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(12, 11, 8, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28,
    }}>

      {/* ── Container gambar ── */}
      <div style={{ position: "relative", width: 320, height: 320 }}>

        {/* ── BELAKANG: loading-spinner.png — BERPUTAR — z-index 1 ── */}
        <img
          src="/loading-spinner.png"
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 320, height: 320,
            zIndex: 1,
            objectFit: "contain",
            animationName: "rotateSun",
            animationDuration: "5s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            filter: "drop-shadow(0 0 20px rgba(200,150,10,0.6)) drop-shadow(0 0 50px rgba(180,120,5,0.35)) drop-shadow(0 0 90px rgba(160,100,5,0.2))",
          }}
        />

        {/* ── DEPAN: loading-center.png — DIAM — z-index 2 ── */}
        <img
          src="/loading-center.png"
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 170, height: 170,
            zIndex: 2,
            objectFit: "contain",
            filter: "drop-shadow(0 0 20px rgba(220,165,10,0.75)) drop-shadow(0 0 50px rgba(200,140,5,0.45)) drop-shadow(0 0 90px rgba(180,120,5,0.25))",
            animationName: "centerPulse",
            animationDuration: "3s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
      </div>

      {/* ── Teks ── */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontSize: 22, fontWeight: 800, letterSpacing: "0.15em",
          color: "#C8960A", marginBottom: 8,
          textShadow: "0 0 18px rgba(200,150,10,0.35)",
          animationName: "centerPulse",
          animationDuration: "3s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
        }}>
          SOMERE
        </div>
        <div style={{ fontSize: 13, color: "#5C5040", letterSpacing: "0.08em" }}>
          Memuat...
        </div>
      </div>

      <style>{`
        @keyframes rotateSun {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes centerPulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(220,165,10,0.65)) drop-shadow(0 0 50px rgba(200,140,5,0.35)) drop-shadow(0 0 90px rgba(180,120,5,0.20)); }
          50%       { filter: drop-shadow(0 0 30px rgba(240,185,10,0.90)) drop-shadow(0 0 70px rgba(220,155,5,0.55)) drop-shadow(0 0 120px rgba(190,130,5,0.35)); }
        }
      `}</style>
    </div>
  );
}
