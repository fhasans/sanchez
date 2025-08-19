// api/get-trap-names.js

const supabase = require("./_supabaseClient");

module.exports = async (req, res) => {
  // Mengatur header CORS untuk Vercel
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Menangani pre-flight request dari browser
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Memanggil fungsi SQL yang sudah kita buat di Supabase
    const { data, error } = await supabase.rpc("get_distinct_traps");

    if (error) {
      // Jika ada error dari Supabase, kirim sebagai respons
      console.error("Error dari Supabase RPC:", error);
      return res.status(500).json({ message: error.message });
    }

    // Kirim data yang berhasil didapat
    res.status(200).json(data);
  } catch (error) {
    // Menangkap error tak terduga lainnya
    console.error("Error di dalam fungsi get-trap-names:", error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
