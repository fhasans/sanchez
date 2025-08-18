// api/_supabaseClient.js

const { createClient } = require("@supabase/supabase-js");

// Membaca variabel dari file .env di root proyek
require("dotenv").config({ path: ".env" });

// Pengecekan kritis untuk memastikan variabel lingkungan ada
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Kesalahan Kritis: SUPABASE_URL dan SUPABASE_SERVICE_KEY harus didefinisikan di file .env"
  );
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Inisialisasi dan ekspor client Supabase
module.exports = createClient(supabaseUrl, supabaseKey);
