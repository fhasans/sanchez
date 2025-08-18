const fs = require("fs");
const path = require("path");
const { Chess } = require("chess.js");
const { parse } = require("@mliebelt/pgn-parser");

const pgnDir = path.join(__dirname, "data");
const dbPath = path.join(__dirname, "database.json");

const trapDatabase = {};

const pgnFiles = fs.readdirSync(pgnDir).filter((file) => file.endsWith(".pgn"));

pgnFiles.forEach((file) => {
  // Ambil nama jebakan dari nama file (misal: "vienna-trap.pgn" -> "Vienna Trap")
  const trapName = file
    .replace(".pgn", "")
    .replace(/-/g, " ") // Ganti tanda hubung dengan spasi
    .replace(/\b\w/g, (l) => l.toUpperCase()); // Ubah jadi Title Case

  console.log(`Processing ${trapName}...`);
  const pgnData = fs.readFileSync(path.join(pgnDir, file), "utf-8");

  const games = parse(pgnData);

  games.forEach((game) => {
    const chess = new Chess();
    game.moves.forEach((move) => {
      const currentFen = chess.fen();
      const nextMove = move.notation.notation;

      // Simpan dengan STRUKTUR BARU
      trapDatabase[currentFen] = {
        move: nextMove,
        trapName: trapName,
      };

      chess.move(nextMove);
    });
  });
});

fs.writeFileSync(dbPath, JSON.stringify(trapDatabase, null, 2));

console.log(`Database created successfully from /data folder at ${dbPath}`);
