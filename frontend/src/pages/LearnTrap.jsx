// frontend/src/pages/LearnTrap.jsx

import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "../App.css";

// Terima prop isLoading dan trapList
function LearnTrap({ trapList, isLoading }) {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;

  const [fen, setFen] = useState(game.fen());
  const [suggestedMove, setSuggestedMove] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [gameHistory, setGameHistory] = useState([]);
  const [selectedTrap, setSelectedTrap] = useState("");
  const [currentTrapData, setCurrentTrapData] = useState({});

  useEffect(() => {
    if (selectedTrap) {
      const entriesForFen = currentTrapData[fen] || [];
      const trapMove = entriesForFen[0];
      setSuggestedMove(trapMove ? trapMove.move : null);
    } else {
      setSuggestedMove(null);
    }
  }, [fen, selectedTrap, currentTrapData]);

  async function handleTrapSelection(event) {
    const selectedName = event.target.value;
    game.reset();
    updateGameState();
    setSelectedTrap(selectedName);
    setCurrentTrapData({});

    if (selectedName) {
      const trapInfo = trapList.find((trap) => trap.name === selectedName);
      if (trapInfo) setBoardOrientation(trapInfo.trapFor);

      try {
        // MENGGUNAKAN URL RELATIF
        const response = await fetch(
          `/api/get-trap-details?trapName=${encodeURIComponent(selectedName)}`
        );
        const data = await response.json();
        setCurrentTrapData(data);
      } catch (error) {
        console.error("Failed to fetch trap details:", error);
      }
    } else {
      setBoardOrientation("white");
    }
  }

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

  return (
    <>
      <div className="game-controls" style={{ marginTop: "20px" }}>
        <div
          className="trap-loader-container"
          style={{ width: "100%", justifyContent: "center" }}
        >
          <strong>Learn a Gambit:</strong>

          {/* Tampilkan pesan loading atau dropdown berdasarkan state isLoading */}
          {isLoading ? (
            <p style={{ margin: "0 10px" }}>Loading traps...</p>
          ) : (
            <select value={selectedTrap} onChange={handleTrapSelection}>
              <option value="">-- Select a Trap --</option>
              {trapList &&
                trapList.map((trap) => (
                  <option key={trap.name} value={trap.name}>
                    {trap.name} ({trap.source})
                  </option>
                ))}
            </select>
          )}
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
