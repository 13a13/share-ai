
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { Toaster } from "./components/ui/toaster";
import React, { Suspense } from 'react';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
