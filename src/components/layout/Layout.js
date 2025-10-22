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
          <p>Disclaimer 1: We are not responsible for the accuracy or reliability of the calculation results. Users should verify the outcomes independently.</p>
        </div>
      </footer>
    </div>
  );
}