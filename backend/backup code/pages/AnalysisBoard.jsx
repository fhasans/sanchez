import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "../App.css";

// Helper untuk memberi nama sumber yang lebih ramah
const sourceNames = {
  traps: "Traps/Gambits",
  proGames: "Pro Games",
  myGames: "My Games",
};

function AnalysisBoard() {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;

  const [fen, setFen] = useState(game.fen());
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [gameHistory, setGameHistory] = useState([]);

  // State untuk logika explorer
  const [foundMoves, setFoundMoves] = useState([]);
  const [preferredLine, setPreferredLine] = useState(null); // e.g., { source: 'traps', trapName: 'Vienna Gambit' }
  const [suggestedMove, setSuggestedMove] = useState(null);

  // Form states
  const [newPgn, setNewPgn] = useState("");
  const [trapName, setTrapName] = useState("");
  const [trapFor, setTrapFor] = useState("white");
  const [saveToSource, setSaveToSource] = useState("traps"); // Default save ke traps.json
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const getMovesForPosition = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/api/get-move?fen=${fen}`
        );
        const data = await response.json();
        setFoundMoves(data || []);

        // Otomatis pilih saran jika ada jalur yang sedang diikuti
        if (preferredLine && data.length > 0) {
          const preferredMove = data.find(
            (m) =>
              m.source === preferredLine.source &&
              m.trapName === preferredLine.trapName
          );
          setSuggestedMove(preferredMove ? preferredMove.move : null);
        } else {
          setSuggestedMove(data.length > 0 ? data[0].move : null);
        }
      } catch (error) {
        setFoundMoves([]);
      }
    };
    getMovesForPosition();
    setGameHistory(game.history());
  }, [fen, preferredLine]);

  function updateGameState() {
    setFen(game.fen());
    setGameHistory(game.history());
  }
  function onPieceDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: "q" });
    if (move === null) return false;
    setPreferredLine(null); // Hapus preferensi saat langkah manual dibuat
    updateGameState();
    return true;
  }
  function resetBoard() {
    game.reset();
    setPreferredLine(null);
    updateGameState();
  }
  function handlePreviousMove() {
    game.undo();
    setPreferredLine(null);
    updateGameState();
  }
  function handleAutoMove() {
    if (suggestedMove) {
      game.move(suggestedMove);
      updateGameState();
    }
  }

  // Fungsi baru saat pengguna mengklik salah satu pilihan
  function handleLineSelection(moveData) {
    setPreferredLine({ source: moveData.source, trapName: moveData.trapName });
    game.move(moveData.move);
    updateGameState();
  }

  async function handleSubmitPgn(event) {
    event.preventDefault();
    setStatusMessage("Saving...");
    try {
      const response = await fetch("http://localhost:4000/api/add-pgn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgn: newPgn,
          trapName,
          trapFor,
          source: saveToSource,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setStatusMessage(result.message);
      setNewPgn("");
      setTrapName("");
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setTimeout(() => setStatusMessage(""), 5000);
    }
  }

  // ... (handleResetDatabase tidak berubah)

  return (
    <>
      <div className="board-container" style={{ marginTop: "20px" }}>
        <Chessboard
          position={fen}
          onPieceDrop={onPieceDrop}
          boardOrientation={boardOrientation}
        />
      </div>
      <div className="info-container">
        {/* Tampilan Daftar Pilihan Langkah */}
        <div className="moves-explorer">
          {foundMoves.length > 0 ? (
            <>
              <h4>Moves found for this position:</h4>
              <ul>
                {foundMoves.map((moveData, index) => {
                  const isPreferred =
                    preferredLine &&
                    moveData.source === preferredLine.source &&
                    moveData.trapName === preferredLine.trapName;
                  return (
                    <li
                      key={index}
                      className={isPreferred ? "preferred" : ""}
                      onClick={() => handleLineSelection(moveData)}
                    >
                      <strong>{moveData.move}</strong>
                      <span>
                        (from {sourceNames[moveData.source]}:{" "}
                        {moveData.trapName})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p>Analysis Mode: No known moves from this position.</p>
          )}
        </div>

        <div className="button-controls">
          <button onClick={handleAutoMove} disabled={!suggestedMove}>
            Auto Move
          </button>
          <div className="playback-controls">
            <button
              onClick={handlePreviousMove}
              disabled={gameHistory.length === 0}
            >
              &lt;
            </button>
          </div>
          <button onClick={resetBoard}>Reset Board</button>
        </div>
      </div>
      <div className="pgn-form-container">
        <h2>Add New Line</h2>
        <form onSubmit={handleSubmitPgn}>
          <input
            type="text"
            value={trapName}
            onChange={(e) => setTrapName(e.target.value)}
            placeholder="Enter Name (e.g., Vienna Gambit)..."
          />
          <div className="trap-for-container">
            <label>
              <input
                type="radio"
                value="white"
                checked={trapFor === "white"}
                onChange={(e) => setTrapFor(e.target.value)}
              />{" "}
              For White
            </label>
            <label>
              <input
                type="radio"
                value="black"
                checked={trapFor === "black"}
                onChange={(e) => setTrapFor(e.target.value)}
              />{" "}
              For Black
            </label>
          </div>
          <textarea
            value={newPgn}
            onChange={(e) => setNewPgn(e.target.value)}
            placeholder="Paste PGN text here..."
            rows="5"
          />
          {/* Opsi untuk menyimpan ke database yang berbeda */}
          <div className="save-to-container">
            <strong>Save to:</strong>
            <select
              value={saveToSource}
              onChange={(e) => setSaveToSource(e.target.value)}
            >
              <option value="traps">Traps/Gambits</option>
              <option value="proGames">Pro Games</option>
              <option value="myGames">My Games</option>
            </select>
          </div>
          <button type="submit">Save to Database</button>
        </form>
        {statusMessage && <p className="status-message">{statusMessage}</p>}
        {/* ... (tombol reset database) */}
      </div>
    </>
  );
}

export default AnalysisBoard;
