import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import DataSourcesPage from './pages/DataSourcesPage';
import ContactPage from './pages/ContactPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Navbar />
        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/map"         element={<MapPage />} />
          <Route path="/about"       element={<AboutPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/data"        element={<DataSourcesPage />} />
          <Route path="/contact"     element={<ContactPage />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
