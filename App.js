import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CotizacionForm from './CotizacionForm';
import HistorialCotizaciones from './HistorialCotizaciones';
import GenerarReporte from './GenerarReporte';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CotizacionForm />} />
        <Route path="/historial" element={<HistorialCotizaciones />} />
        <Route path="/generar-reporte" element={<GenerarReporte />} />
      </Routes>
    </Router>
  );
}

export default App;
