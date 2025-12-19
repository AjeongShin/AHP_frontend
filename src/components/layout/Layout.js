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
          <p>Developed by <a href="https://www.psi.ch/en/lea">the Laboratory for Energy Systems Analysis (LEA)</a> at the Paul Scherrer Institute (PSI).</p>
          <p>This software was developed with the support of the Swiss Federal Office of Energy (SFOE) as part of the SWEET project SURE.</p>

          <p>Disclaimer 1: We are not responsible for the accuracy or reliability of the calculation results. Users should verify the outcomes independently.</p>
          <p>Disclaimer 2: The MCDA methods presented are selectively chosen based on specific criteria such as applicability, simplicity, and relevance to common use cases. This tool does not encompass the entire spectrum of MCDA methodologies, and the selection is guided by practical considerations, including computational efficiency and ease of interpretation.</p>
        </div>
      </footer>
    </div>
  );
}