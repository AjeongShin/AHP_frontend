// src/components/header/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from './PSI_logo.png';      
import styles from './header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      {/* Left side: Logo*/}
      <Link to="/" className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <img
            src={logo}              
            alt="PSI Logo"
            width={100}
            height={40}
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Pairwise Comparison Tool</span>
        </div>
      </Link>

      {/* Right side: Link */}
      <nav className={styles.navContainer}>
        <Link to="/" className={styles.navLink}>HOME</Link>
        <Link to="/calculator" state={{ reset: true }} className={styles.navLink}>CALCULATOR</Link>
      </nav>
    </header>
  );
}
