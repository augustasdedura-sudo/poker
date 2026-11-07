// The card room the table sits in: dark wood-paneled walls with a chair rail,
// two warm wall sconces, and a carpeted floor, all drawn in CSS. It stays fixed
// behind the page and dark enough that the table and controls read on top.

function Sconce({ side }: { side: "left" | "right" }) {
  return (
    <div
      className="absolute top-[20%] flex flex-col items-center"
      style={{ [side]: "6%" } as React.CSSProperties}
    >
      {/* the glow it throws on the paneling */}
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,186,108,0.26) 0%, rgba(255,170,90,0.10) 30%, rgba(255,170,90,0) 62%)",
        }}
      />
      {/* fabric shade, lit from inside */}
      <div
        className="relative h-7 w-9"
        style={{
          clipPath: "polygon(22% 0, 78% 0, 100% 100%, 0 100%)",
          background: "linear-gradient(180deg, #f6cf91 0%, #e3a85c 70%, #b8783a 100%)",
          boxShadow: "0 0 18px rgba(255,190,110,0.6)",
        }}
      />
      {/* brass arm and wall plate */}
      <div className="relative h-4 w-[3px] bg-gradient-to-b from-[#b58a45] to-[#6d4f22]" />
      <div className="relative h-3 w-5 rounded-sm bg-gradient-to-b from-[#a67c3c] to-[#5c421d]" />
    </div>
  );
}

export function RoomBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#140c08]">
      {/* Wood paneling: warm walnut with grain, panel seams and a lighter seam edge */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            // panel seams every 180px (dark groove + a faint lit edge)
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.42) 0 3px, rgba(255,206,160,0.035) 3px 4px, transparent 4px 180px)",
            // fine grain
            "repeating-linear-gradient(90deg, rgba(255,230,200,0.012) 0 1px, transparent 1px 6px)",
            "repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 13px)",
            // the wood itself, darker toward the floor
            "linear-gradient(180deg, #2c1a10 0%, #26170e 50%, #1a100a 74%)",
          ].join(","),
        }}
      />
      {/* Chair rail across the wall */}
      <div
        className="absolute inset-x-0 top-[60%] h-3"
        style={{
          background: "linear-gradient(180deg, #4a2e1b 0%, #2a190f 60%, #120a06 100%)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,210,160,0.08)",
        }}
      />
      {/* Carpet */}
      <div
        className="absolute inset-x-0 bottom-0 top-[76%]"
        style={{
          background: [
            "repeating-linear-gradient(45deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 9px)",
            "linear-gradient(180deg, #2a1210 0%, #1c0c0a 40%, #120807 100%)",
          ].join(","),
          boxShadow: "inset 0 18px 30px rgba(0,0,0,0.55)",
        }}
      />

      <Sconce side="left" />
      <Sconce side="right" />

      {/* Warm light from the table lamp spilling into the room */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 42%, rgba(255,214,150,0.10) 0%, rgba(255,214,150,0) 70%)",
        }}
      />
      {/* Corners fall off into shadow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(120% 95% at 50% 40%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.72) 100%)",
        }}
      />
    </div>
  );
}
