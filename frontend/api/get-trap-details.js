// api/get-trap-details.js

const supabase = require("./_supabaseClient");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { trapName } = req.query;
  if (!trapName) {
    return res.status(400).json({ message: "Trap name is required." });
  }

  try {
    const { data, error } = await supabase
      .from("chess_moves")
      .select("*")
      .eq("trapName", trapName);

    if (error) {
      console.error("Error dari Supabase get-trap-details:", error);
      return res.status(500).json({ message: error.message });
    }

    const trapDataByFen = data.reduce((acc, move) => {
      if (!acc[move.fen]) acc[move.fen] = [];
      acc[move.fen].push(move);
      return acc;
    }, {});

    res.status(200).json(trapDataByFen);
  } catch (error) {
    console.error("Error di dalam fungsi get-trap-details:", error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
