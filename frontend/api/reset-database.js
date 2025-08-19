// api/reset-database.js

const supabase = require("./_supabaseClient");

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

  try {
    await supabase.from("chess_moves").delete().neq("id", 0);
    res
      .status(200)
      .json({ success: true, message: "Database has been reset." });
  } catch (error) {
    console.error("Error di dalam fungsi reset-database:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
