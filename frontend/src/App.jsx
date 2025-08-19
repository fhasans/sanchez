// frontend/src/App.jsx (Versi Final yang Tangguh)

import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import AnalysisBoard from "./pages/AnalysisBoard";
import LearnTrap from "./pages/LearnTrap";
import "./App.css";

function App() {
  const [trapList, setTrapList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi yang lebih tangguh dengan percobaan ulang (retry)
  const fetchTrapNames = async (retries = 3) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/get-trap-names?cachebust=${new Date().getTime()}`
      );

      // Jika server error (seperti 500 atau 404 saat cold start), coba lagi
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const names = await response.json();
      setTrapList(names);
      setIsLoading(false); // Berhasil, berhenti loading
      return; // Keluar dari fungsi jika berhasil
    } catch (error) {
      console.error(
        `Gagal mengambil nama trap. Sisa percobaan: ${retries - 1}`,
        error
      );

      // Jika masih ada sisa percobaan, tunggu sebentar lalu coba lagi
      if (retries > 1) {
        setTimeout(() => fetchTrapNames(retries - 1), 1000); // Tunggu 1 detik
      } else {
        setIsLoading(false); // Habis percobaan, berhenti loading
      }
    }
  };

  useEffect(() => {
    fetchTrapNames();
  }, []);

  return (
    <div className="app-container">
      <nav className="main-nav">
        <Link to="/">Analysis Board</Link>
        <Link to="/learn">Learn a Gambit</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={<AnalysisBoard onDatabaseUpdate={fetchTrapNames} />}
        />
        <Route
          path="/learn"
          element={<LearnTrap trapList={trapList} isLoading={isLoading} />}
        />
      </Routes>
    </div>
  );
}

export default App;
