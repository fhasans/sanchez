// frontend/src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import AnalysisBoard from "./pages/AnalysisBoard";
import LearnTrap from "./pages/LearnTrap";
import "./App.css";

function App() {
  const [trapList, setTrapList] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // State untuk melacak proses loading

  // Fungsi untuk mengambil daftar nama trap dari API
  const fetchTrapNames = async () => {
    setIsLoading(true); // Mulai loading
    try {
      // Menggunakan URL relatif yang akan bekerja di lokal dan saat deploy
      // Menjadi baris ini:
      const namesResponse = await fetch(
        `/api/get-trap-names?cachebust=${new Date().getTime()}`
      );
      if (!namesResponse.ok) {
        throw new Error(`HTTP error! status: ${namesResponse.status}`);
      }
      const names = await namesResponse.json();
      setTrapList(names);
    } catch (error) {
      console.error("Failed to fetch trap names:", error);
      setTrapList([]); // Set ke array kosong jika ada error
    } finally {
      setIsLoading(false); // Selesai loading, baik sukses maupun gagal
    }
  };

  // Ambil data saat komponen pertama kali dimuat
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
          element={<LearnTrap trapList={trapList} isLoading={isLoading} />} // Teruskan state loading ke LearnTrap
        />
      </Routes>
    </div>
  );
}

export default App;
