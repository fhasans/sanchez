// api/test-env.js

module.exports = (req, res) => {
  // Atur header CORS
  res.setHeader("Access-Control-Allow-Origin", "*");

  const supbaseUrl = process.env.SUPABASE_URL;
  const supbaseKeyExists = !!process.env.SUPABASE_SERVICE_KEY; // Kita hanya cek apakah kuncinya ada

  // Ini akan muncul di Log Vercel, bukan di browser
  console.log("--- DEBUGGING ENVIRONMENT VARIABLES ---");
  console.log("SUPABASE_URL DARI SERVER:", supbaseUrl);
  console.log("SUPABASE_SERVICE_KEY ADA?:", supbaseKeyExists);
  console.log("------------------------------------");

  // Kirim kembali nilai variabel ke browser untuk kita lihat
  res.status(200).json({
    message: "Ini adalah variabel yang dilihat oleh fungsi Vercel:",
    SUPABASE_URL_VALUE: supbaseUrl || "!!! KOSONG (UNDEFINED) !!!",
    SUPABASE_SERVICE_KEY_EXISTS: supbaseKeyExists,
  });
};
