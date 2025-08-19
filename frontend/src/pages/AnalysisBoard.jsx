// frontend/src/pages/AnalysisBoard.jsx

import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "../App.css";

const sourceNames = {
  traps: "Traps/Gambits",
  proGames: "Pro Games",
  myGames: "My Games",
};

function AnalysisBoard({ onDatabaseUpdate }) {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;

  const [fen, setFen] = useState(game.fen());
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [gameHistory, setGameHistory] = useState([]);
  const [foundMoves, setFoundMoves] = useState([]);
  const [preferredLine, setPreferredLine] = useState(null);
  const [suggestedMove, setSuggestedMove] = useState(null);

  const [newPgn, setNewPgn] = useState("");
  const [trapName, setTrapName] = useState("");
  const [trapFor, setTrapFor] = useState("white");
  const [saveToSource, setSaveToSource] = useState("traps");
  const [statusMessage, setStatusMessage] = useState("");
  const [showResetButton, setShowResetButton] = useState(false);

  useEffect(() => {
    const getMovesForPosition = async () => {
      try {
        const response = await fetch(`/api/get-move?fen=${fen}`);
        const data = await response.json();
        setFoundMoves(data || []);
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
        console.error("Failed to fetch moves:", error);
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
    setPreferredLine(null);
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

  function handleLineSelection(moveData) {
    setPreferredLine({ source: moveData.source, trapName: moveData.trapName });
    game.move(moveData.move);
    updateGameState();
  }

  async function handleSubmitPgn(event) {
    event.preventDefault();
    if (!trapName.trim() || !newPgn.trim()) {
      setStatusMessage("Error: Name and PGN fields cannot be empty.");
      setTimeout(() => setStatusMessage(""), 5000);
      return;
    }
    setStatusMessage("Saving...");
    try {
      const response = await fetch(`/api/add-pgn`, {
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
      onDatabaseUpdate();
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setTimeout(() => setStatusMessage(""), 5000);
    }
  }

  async function handleResetDatabase() {
    if (
      window.confirm(
        "Are you sure you want to delete ALL data? This cannot be undone."
      )
    ) {
      setStatusMessage("Resetting database...");
      try {
        await fetch(`/api/reset-database`, {
          method: "POST",
        });
        setStatusMessage("All databases have been reset.");
        resetBoard();
        onDatabaseUpdate();
      } catch (error) {
        setStatusMessage(`Error: ${error.message}`);
      } finally {
        setTimeout(() => setStatusMessage(""), 5000);
      }
    }
  }

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
                      key={`${moveData.trapName}-${index}`}
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
        <h2>Add New Line / Batch</h2>
        <p className="instructions">
          You can paste multiple PGN variations here. Just separate them with a
          blank line.
        </p>
        <form onSubmit={handleSubmitPgn}>
          <input
            type="text"
            value={trapName}
            onChange={(e) => {
              const value = e.target.value;
              setTrapName(value);
              // Cek apakah nilai yang diketik adalah kata kunci rahasia
              if (value === "**********") {
                setShowResetButton(true);
              }
            }}
            placeholder="Enter Name (e.g., Vienna Gambit)..."
            required
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
            placeholder="Paste one or more PGNs here, separated by a blank line..."
            rows="10"
            required
          />
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
        {showResetButton && (
          <button onClick={handleResetDatabase} className="reset-db-button">
            Reset Database
          </button>
        )}
      </div>
    </>
  );
}

export default AnalysisBoard;
