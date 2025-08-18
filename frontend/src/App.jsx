import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import AnalysisBoard from "./pages/AnalysisBoard";
import LearnTrap from "./pages/LearnTrap";
import "./App.css";

function App() {
  // State diangkat ke komponen induk
  const [trapList, setTrapList] = useState([]);
  const [allTraps, setAllTraps] = useState({});

  // Fungsi untuk mengambil data, sekarang bisa dipanggil dari mana saja
  const fetchData = async () => {
    try {
      const namesResponse = await fetch(
        "http://localhost:4000/api/get-trap-names"
      );
      const names = await namesResponse.json();
      setTrapList(names);

      const allTrapsResponse = await fetch(
        "http://localhost:4000/api/get-all-traps"
      );
      const allTrapsData = await allTrapsResponse.json();
      setAllTraps(allTrapsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  // Ambil data saat aplikasi pertama kali dimuat
  useEffect(() => {
    fetchData();
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
          element={<AnalysisBoard onDatabaseUpdate={fetchData} />} // Teruskan fungsi update
        />
        <Route
          path="/learn"
          element={<LearnTrap trapList={trapList} allTraps={allTraps} />} // Teruskan data sebagai props
        />
      </Routes>
    </div>
  );
}

export default App;
