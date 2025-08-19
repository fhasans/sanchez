// api/get-move.js

const supabase = require("./_supabaseClient");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { fen } = req.query;
  if (!fen) {
    return res.status(400).json({ message: "FEN is required." });
  }

  try {
    const { data, error } = await supabase
      .from("chess_moves")
      .select("*")
      .eq("fen", fen);

    if (error) {
      console.error("Error dari Supabase get-move:", error);
      return res.status(500).json({ message: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error di dalam fungsi get-move:", error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
