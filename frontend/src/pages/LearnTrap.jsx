import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "../App.css";

// Terima trapList dan allTraps sebagai props
function LearnTrap({ trapList, allTraps }) {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;

  const [fen, setFen] = useState(game.fen());
  const [suggestedMove, setSuggestedMove] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [gameHistory, setGameHistory] = useState([]);
  const [selectedTrap, setSelectedTrap] = useState("");

  // HAPUS useEffect yang mengambil data dari sini

  useEffect(() => {
    if (selectedTrap) {
      const entriesForFen = allTraps[fen] || [];
      const trapData = entriesForFen.find(
        (trap) => trap.trapName === selectedTrap
      );
      setSuggestedMove(trapData ? trapData.move : null);
    }
  }, [fen, selectedTrap, allTraps]);

  function updateGameState() {
    setFen(game.fen());
    setGameHistory(game.history());
  }
  function handlePreviousMove() {
    game.undo();
    updateGameState();
  }
  function handleNextMove() {
    if (suggestedMove) {
      game.move(suggestedMove);
      updateGameState();
    }
  }

  function handleTrapSelection(event) {
    const selectedName = event.target.value;
    game.reset();
    updateGameState();
    setSelectedTrap(selectedName);

    if (selectedName) {
      const trapInfo = trapList.find((trap) => trap.name === selectedName);
      if (trapInfo) setBoardOrientation(trapInfo.trapFor);

      const startFen = new Chess().fen();
      // Cari langkah pertama di database lokal yang diterima dari props
      const entriesForStartFen = allTraps[startFen] || [];
      const trapData = entriesForStartFen.find(
        (trap) => trap.trapName === selectedName
      );
      setSuggestedMove(trapData ? trapData.move : null);
    } else {
      setBoardOrientation("white");
      setSuggestedMove(null);
    }
  }

  return (
    <>
      <div className="game-controls" style={{ marginTop: "20px" }}>
        <div
          className="trap-loader-container"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <strong>Learn a Gambit:</strong>
          <select value={selectedTrap} onChange={handleTrapSelection}>
            <option value="">-- Select a Trap --</option>
            {trapList.map((trap) => (
              <option key={trap.name} value={trap.name}>
                {trap.name} ({trap.source})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="board-container">
        <Chessboard
          position={fen}
          boardOrientation={boardOrientation}
          arePiecesDraggable={false}
        />
      </div>
      <div className="info-container">
        {suggestedMove ? (
          <p className="suggestion">
            Next Move: <strong>{suggestedMove}</strong>
          </p>
        ) : (
          <p>
            {selectedTrap
              ? `End of the line for ${selectedTrap}.`
              : "Select a trap to begin."}
          </p>
        )}
        <div className="button-controls">
          <div className="playback-controls">
            <button
              onClick={handlePreviousMove}
              disabled={gameHistory.length === 0}
            >
              &lt;
            </button>
            <button onClick={handleNextMove} disabled={!suggestedMove}>
              &gt;
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default LearnTrap;
