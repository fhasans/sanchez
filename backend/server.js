const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Chess } = require("chess.js");
const { parse } = require("@mliebelt/pgn-parser");

const app = express();
const PORT = 4000;

const dbPaths = {
  traps: path.join(__dirname, "traps.json"),
  proGames: path.join(__dirname, "pro-games.json"),
  myGames: path.join(__dirname, "my-games.json"),
};

// Hapus baris 'let trapDatabase = ...' dari sini
let masterDatabase = {};

function loadAndMergeDatabases() {
  masterDatabase = {};
  console.log("Loading and merging databases...");
  for (const [source, filePath] of Object.entries(dbPaths)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      for (const [fen, entries] of Object.entries(data)) {
        if (!masterDatabase[fen]) masterDatabase[fen] = [];
        const taggedEntries = entries.map((entry) => ({ ...entry, source }));
        masterDatabase[fen].push(...taggedEntries);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log(`File not found: ${filePath}. Creating a new one.`);
        fs.writeFileSync(filePath, JSON.stringify({}));
      } else {
        console.error(`Error loading ${filePath}:`, error);
      }
    }
  }
  console.log("Databases loaded successfully.");
}

app.use(cors());
app.use(express.json());

app.get("/api/get-move", (req, res) => {
  const { fen } = req.query;
  const allMatchesForFen = masterDatabase[fen] || [];
  res.json(allMatchesForFen);
});

app.get("/api/get-trap-names", (req, res) => {
  const uniqueTraps = new Map();
  Object.values(masterDatabase)
    .flat()
    .forEach((data) => {
      if (!uniqueTraps.has(data.trapName)) {
        uniqueTraps.set(data.trapName, {
          name: data.trapName,
          trapFor: data.trapFor,
          source: data.source,
        });
      }
    });
  const trapList = Array.from(uniqueTraps.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  res.json(trapList);
});

app.get("/api/get-all-traps", (req, res) => {
  // Kirim masterDatabase yang sudah digabungkan
  res.json(masterDatabase);
});

// GANTI BLOK LAMA ANDA DENGAN YANG INI
app.post("/api/add-pgn", (req, res) => {
  const { pgn, trapName: baseTrapName, trapFor, source } = req.body; // Mengganti nama variabel agar lebih jelas
  const filePath = dbPaths[source];
  if (!filePath)
    return res
      .status(400)
      .json({ success: false, message: "Invalid data source." });

  try {
    const currentDb = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const pgnStrings = pgn.split(/\n\s*\n/).filter((p) => p.trim() !== "");
    if (pgnStrings.length === 0)
      throw new Error("No valid PGN data found in input.");

    // Lakukan loop pada setiap PGN dengan index dari batch
    pgnStrings.forEach((pgnString, index) => {
      // DIPERBAIKI: Penomoran sekarang didasarkan pada `index` dari PGN di dalam batch.
      // Logika ini dipindahkan ke loop luar.
      const uniqueTrapName =
        pgnStrings.length > 1 ? `${baseTrapName} ${index + 1}` : baseTrapName;

      const games = parse(pgnString);
      if (games.length === 0) return; // 'continue' untuk forEach

      games.forEach((game) => {
        const chess = new Chess();
        game.moves.forEach((move) => {
          const currentFen = chess.fen();
          const nextMove = move.notation.notation;
          const moveResult = chess.move(nextMove);
          if (moveResult === null)
            throw new Error(`Invalid move: ${nextMove} in PGN #${index + 1}.`);

          if (!currentDb[currentFen]) currentDb[currentFen] = [];
          // Hapus entri lama dengan nama unik yang sama
          currentDb[currentFen] = currentDb[currentFen].filter(
            (trap) => trap.trapName !== uniqueTrapName
          );
          // Tambahkan entri baru dengan nama unik yang benar
          currentDb[currentFen].push({
            move: nextMove,
            trapName: uniqueTrapName,
            trapFor: trapFor,
          });
        });
      });
    });

    fs.writeFileSync(filePath, JSON.stringify(currentDb, null, 2));
    loadAndMergeDatabases();

    const successMessage =
      pgnStrings.length > 1
        ? `Batch of ${pgnStrings.length} variations for '${baseTrapName}' saved successfully.`
        : `Trap '${baseTrapName}' saved successfully.`;

    res.json({ success: true, message: successMessage });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: `Failed to process PGN batch. ${error.message}`,
      });
  }
});

app.post("/api/reset-database", (req, res) => {
  try {
    for (const filePath of Object.values(dbPaths)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
    }
    loadAndMergeDatabases();
    res.json({ success: true, message: "All databases have been reset." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to reset databases." });
  }
});

app.listen(PORT, () => {
  loadAndMergeDatabases();
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
