import Link from 'next/link';
import styles from './page.module.css';

export default function BlogPage() {
  return (
    <main className={styles.blogPage}>
      <div className={styles.inner}>
        <h1>Blogg</h1>
        <p>Innehåll kommer inom kort.</p>
        <Link href="/" className={styles.backLink}>
          Tillbaka till startsidan
        </Link>
      </div>
    </main>
  );
}
