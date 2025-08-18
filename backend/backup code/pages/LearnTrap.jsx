import React, { useState, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "../App.css";

function LearnTrap() {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;

  const [fen, setFen] = useState(game.fen());
  const [suggestedMove, setSuggestedMove] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [gameHistory, setGameHistory] = useState([]);
  const [trapList, setTrapList] = useState([]);
  const [selectedTrap, setSelectedTrap] = useState("");

  // State lokal HANYA untuk data jebakan yang sedang aktif
  const [activeTrapData, setActiveTrapData] = useState({});

  // Hanya ambil daftar nama saat komponen dimuat
  useEffect(() => {
    const fetchTrapNames = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/get-trap-names"
        );
        const names = await response.json();
        setTrapList(names);
      } catch (error) {
        console.error("Failed to fetch trap names:", error);
      }
    };
    fetchTrapNames();
  }, []);

  // Efek ini sekarang hanya bergantung pada data yang sudah ada di state
  useEffect(() => {
    const entry = activeTrapData[fen];
    setSuggestedMove(entry ? entry.move : null);
  }, [fen, activeTrapData]);

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

  async function handleTrapSelection(event) {
    const selectedName = event.target.value;
    game.reset();
    updateGameState();
    setSelectedTrap(selectedName);

    if (selectedName) {
      const trapInfo = trapList.find((trap) => trap.name === selectedName);
      if (trapInfo) setBoardOrientation(trapInfo.trapFor);

      // Ambil semua data untuk jebakan yang dipilih
      try {
        const response = await fetch(
          `http://localhost:4000/api/get-trap-by-name?trapName=${encodeURIComponent(
            selectedName
          )}`
        );
        const data = await response.json();
        setActiveTrapData(data); // Simpan data jebakan yang aktif

        // Cari langkah pertama dari data yang baru saja diambil
        const startFen = new Chess().fen();
        const firstMoveData = data[startFen];
        setSuggestedMove(firstMoveData ? firstMoveData.move : null);
      } catch (error) {
        console.error("Failed to fetch trap data:", error);
        setActiveTrapData({});
        setSuggestedMove(null);
      }
    } else {
      setBoardOrientation("white");
      setSuggestedMove(null);
      setActiveTrapData({});
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
