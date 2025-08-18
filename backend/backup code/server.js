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

let masterDatabase = {};

function loadAndMergeDatabases() {
  masterDatabase = {};
  for (const [source, filePath] of Object.entries(dbPaths)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      for (const [fen, entries] of Object.entries(data)) {
        if (!masterDatabase[fen]) masterDatabase[fen] = [];
        const taggedEntries = entries.map((entry) => ({ ...entry, source }));
        masterDatabase[fen].push(...taggedEntries);
      }
    } catch (error) {
      if (error.code === "ENOENT")
        fs.writeFileSync(filePath, JSON.stringify({}));
      else console.error(`Error loading ${filePath}:`, error);
    }
  }
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

// === ENDPOINT BARU UNTUK MENGAMBIL SEMUA DATA DARI SATU JEBAKAN ===
app.get("/api/get-trap-by-name", (req, res) => {
  const { trapName } = req.query;
  if (!trapName) {
    return res.status(400).json({ error: "Trap name is required" });
  }
  const trapData = {};
  for (const fen in masterDatabase) {
    const entries = masterDatabase[fen];
    const matchingEntry = entries.find((entry) => entry.trapName === trapName);
    if (matchingEntry) {
      trapData[fen] = matchingEntry;
    }
  }
  res.json(trapData);
});

app.post("/api/add-pgn", (req, res) => {
  const { pgn, trapName, trapFor, source } = req.body;
  const filePath = dbPaths[source];
  if (!filePath)
    return res
      .status(400)
      .json({ success: false, message: "Invalid data source." });
  try {
    const currentDb = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const games = parse(pgn);
    games.forEach((game) => {
      const chess = new Chess();
      game.moves.forEach((move) => {
        const currentFen = chess.fen();
        const nextMove = move.notation.notation;
        const moveResult = chess.move(nextMove);
        if (moveResult === null) throw new Error(`Invalid move: ${nextMove}`);
        if (!currentDb[currentFen]) currentDb[currentFen] = [];
        currentDb[currentFen] = currentDb[currentFen].filter(
          (trap) => trap.trapName !== trapName
        );
        currentDb[currentFen].push({
          move: nextMove,
          trapName: trapName,
          trapFor: trapFor,
        });
      });
    });
    fs.writeFileSync(filePath, JSON.stringify(currentDb, null, 2));
    loadAndMergeDatabases();
    res.json({ success: true, message: `Saved to ${source} successfully.` });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to process PGN. ${error.message}`,
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
