// upload-initial-data.js
const fs = require("fs");
const path = require("path");
// Kita tidak perlu dotenv di sini karena kita akan memanggil supabaseClient
// yang sudah mengurusnya
const supabase = require("./api/_supabaseClient");

// Pastikan nama file ini sesuai dengan yang ada di root proyek Anda
const dbPaths = {
  traps: path.join(__dirname, "traps.json"),
  proGames: path.join(__dirname, "pro-games.json"),
  myGames: path.join(__dirname, "my-games.json"),
};

async function uploadData() {
  console.log("Memulai proses upload data ke Supabase...");
  let allRows = [];

  for (const [source, filePath] of Object.entries(dbPaths)) {
    try {
      // Pastikan file ada sebelum dibaca
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        console.log(`Memproses file ${source}...`);
        for (const [fen, entries] of Object.entries(data)) {
          const rows = entries.map((entry) => ({
            fen,
            move: entry.move,
            trapName: entry.trapName,
            trapFor: entry.trapFor,
            source,
          }));
          allRows.push(...rows);
        }
      } else {
        console.warn(`Peringatan: File tidak ditemukan, dilewati: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error saat memproses ${filePath}:`, error.message);
    }
  }

  if (allRows.length > 0) {
    console.log(
      `Mengunggah total ${allRows.length} baris... Ini mungkin memakan waktu.`
    );

    // Supabase merekomendasikan mengunggah dalam batch kecil jika data sangat besar
    const BATCH_SIZE = 1000;
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      console.log(`Mengunggah batch ${i / BATCH_SIZE + 1}...`);
      const { error } = await supabase.from("chess_moves").insert(batch);
      if (error) {
        console.error(
          "Error saat mengunggah batch ke Supabase:",
          error.message
        );
        return; // Hentikan jika ada error
      }
    }
    console.log("Data berhasil diunggah!");
  } else {
    console.log("Tidak ada data untuk diunggah.");
  }
}

uploadData();
