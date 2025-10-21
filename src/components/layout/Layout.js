import React from 'react';
import Header from '../header/Header';
import styles from './layout.module.css';

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.content}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© 2025 PSI Trade Off Calculator</p>
        </div>
      </footer>
    </div>
  );
}