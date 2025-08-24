// frontend/src/pages/LearnTrap.jsx

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const [expandedCategory, setExpandedCategory] = useState(null);

  const groupedTraps = useMemo(() => {
    if (isLoading || !trapList) return {};

    const groups = {};
    trapList.forEach((trap) => {
      // Extracts the base name (e.g., "halloween" from "halloween 28")
      const baseName = trap.name.replace(/\s+\d+$/, "").trim();
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(trap);
    });
    return groups;
  }, [trapList, isLoading]);

  useEffect(() => {
    if (selectedTrap) {
      const entriesForFen = currentTrapData[fen] || [];
      const trapMove = entriesForFen[0];
      setSuggestedMove(trapMove ? trapMove.move : null);
    } else {
      setSuggestedMove(null);
    }
  }, [fen, selectedTrap, currentTrapData]);

  async function handleTrapClick(trapName) {
    if (trapName === selectedTrap) return;

    game.reset();
    updateGameState();
    setSelectedTrap(trapName);
    setCurrentTrapData({});

    if (trapName) {
      const trapInfo = trapList.find((trap) => trap.name === trapName);
      if (trapInfo) setBoardOrientation(trapInfo.trapFor);

      try {
        const response = await fetch(
          `/api/get-trap-details?trapName=${encodeURIComponent(trapName)}`
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

  // --- START OF ADDED CODE ---
  // Handles clicking a category header to expand or collapse it.
  function handleCategoryClick(categoryName) {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null); // Collapse if it's already open
    } else {
      setExpandedCategory(categoryName); // Expand the new category
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
    <div className="learn-trap-layout">
      {/* Column 1: Chessboard and controls */}
      <div className="board-column">
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
      </div>

      {/* Column 2: The new scrollable trap list card */}
      <div className="trap-list-card">
        <strong style={{ color: "white" }}>
          Learn Pro Games / Gambit / Trap:
        </strong>
        <div
          style={{
            borderBottom: "",
            border: "1px solid white",
          }}
        />
        {isLoading ? (
          <p>Loading traps...</p>
        ) : (
          <div className="trap-list-scrollable">
            {Object.keys(groupedTraps).map((categoryName) => (
              <div key={categoryName} className="trap-category">
                <button
                  className="category-header"
                  onClick={() => handleCategoryClick(categoryName)}
                >
                  {categoryName}
                  <span>{expandedCategory === categoryName ? "−" : "+"}</span>
                </button>

                {expandedCategory === categoryName && (
                  <ul className="trap-items">
                    {groupedTraps[categoryName].map((trap) => (
                      <li key={trap.name}>
                        <button
                          className={selectedTrap === trap.name ? "active" : ""}
                          onClick={() => handleTrapClick(trap.name)}
                        >
                          {trap.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LearnTrap;
