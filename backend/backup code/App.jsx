import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import AnalysisBoard from "./pages/AnalysisBoard";
import LearnTrap from "./pages/LearnTrap";
import "./App.css";

function App() {
  const [trapList, setTrapList] = useState([]);
  const [allTraps, setAllTraps] = useState({});

  const fetchData = async () => {
    try {
      const namesResponse = await fetch(
        "http://localhost:4000/api/get-trap-names"
      );
      const names = await namesResponse.json();
      setTrapList(names);

      // Kita tidak lagi membutuhkan /api/get-all-traps karena Analysis Board mengambil datanya sendiri
    } catch (error) {
      console.error("Failed to fetch trap names:", error);
    }
  };

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
          element={<LearnTrap trapList={trapList} />} // Hanya teruskan daftar nama
        />
      </Routes>
    </div>
  );
}

export default App;
