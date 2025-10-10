// src/components/header/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from './PSI_logo.png';      // 같은 폴더에 파일이 있을 때
import styles from './header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      {/* 좌측: 로고 및 타이틀 */}
      <Link to="/" className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <img
            src={logo}               // 또는 public에 있을 땐 "/PSI_logo.png"
            alt="PSI Logo"
            width={100}
            height={40}
            className={styles.logoImage}
          />
          <span className={styles.logoText}>Trader Off Calculator</span>
        </div>
      </Link>

      {/* 우측: 탐색 링크 */}
      <nav className={styles.navContainer}>
        <Link to="/" className={styles.navLink}>HOME</Link>
        <Link to="/calculator" className={styles.navLink}>CALCULATOR</Link>
      </nav>
    </header>
  );
}
