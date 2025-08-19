// api/add-pgn.js

const supabase = require("./_supabaseClient");
const { Chess } = require("chess.js");
const { parse } = require("@mliebelt/pgn-parser");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { pgn, trapName: baseTrapName, trapFor, source } = req.body;
  // ... (Salin seluruh logika dari dalam blok `app.post("/api/add-pgn", ...)` Anda yang sudah di-migrasi ke sini)
  // Ini adalah kode yang sudah disempurnakan:
  try {
    const pgnStrings = pgn.split(/\n\s*\n/).filter((p) => p.trim() !== "");
    if (pgnStrings.length === 0)
      throw new Error("No valid PGN data found in input.");
    const trapNamePattern =
      pgnStrings.length > 1 ? `${baseTrapName} %` : baseTrapName;
    await supabase
      .from("chess_moves")
      .delete()
      .like("trapName", trapNamePattern)
      .eq("source", source);
    let allNewRows = [];
    pgnStrings.forEach((pgnString, index) => {
      const uniqueTrapName =
        pgnStrings.length > 1 ? `${baseTrapName} ${index + 1}` : baseTrapName;
      const games = parse(pgnString);
      if (games.length === 0) return;
      games.forEach((game) => {
        const chess = new Chess();
        game.moves.forEach((move) => {
          const currentFen = chess.fen();
          const nextMove = move.notation.notation;
          if (chess.move(nextMove) === null)
            throw new Error(`Invalid move: ${nextMove}`);
          allNewRows.push({
            fen: currentFen,
            move: nextMove,
            trapName: uniqueTrapName,
            trapFor: trapFor,
            source: source,
          });
        });
      });
    });
    if (allNewRows.length > 0)
      await supabase.from("chess_moves").insert(allNewRows);
    const successMessage = `Successfully saved: ${baseTrapName}`;
    res.status(200).json({ success: true, message: successMessage });
  } catch (error) {
    console.error("Error di dalam fungsi add-pgn:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
