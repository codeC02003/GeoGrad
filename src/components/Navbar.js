import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <span className="navbar-brand-name">GeoGrad</span>
        <span className="navbar-brand-sub">U.S. Master's Explorer</span>
      </div>

      <nav className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Home</NavLink>
        <NavLink to="/map"          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Map</NavLink>
        <NavLink to="/about"        className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>About</NavLink>
        <NavLink to="/how-it-works" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>How It Works</NavLink>
        <NavLink to="/data"         className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Data</NavLink>
        <NavLink to="/contact"      className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Contact</NavLink>
      </nav>

      <button className="nav-cta" onClick={() => navigate('/map')}>
        Explore Map
      </button>
    </header>
  );
}
