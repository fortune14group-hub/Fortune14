import Link from 'next/link';
import Header from './Header';
import styles from './auth-layout.module.css';

export function AuthLayout({ children, topbarActions }) {
  const actions =
    typeof topbarActions === 'undefined' ? (
      <Link href="/" className={styles.topbarLink}>
        Till startsida
      </Link>
    ) : (
      topbarActions
    );

  return (
    <div className={styles.screen}>
      <Header className={styles.screenHeader} logoPriority>
        {actions ? <div className={styles.topbarActions}>{actions}</div> : null}
      </Header>
      <main className={styles.shell}>{children}</main>
    </div>
  );
}

export function AuthCard({ children, size = 'default' }) {
  const className = size === 'wide' ? `${styles.card} ${styles.cardWide}` : styles.card;
  return <section className={className}>{children}</section>;
}

export function AuthCardHeader({ eyebrow, title, description, children }) {
  return (
    <header className={styles.cardHeader}>
      {eyebrow ? <span className={styles.tag}>{eyebrow}</span> : null}
      {title ? <h1 className={styles.cardTitle}>{title}</h1> : null}
      {description ? <p className={styles.cardLead}>{description}</p> : null}
      {children}
    </header>
  );
}

export function AuthCardBody({ children }) {
  return <div className={styles.cardBody}>{children}</div>;
}

export const authStyles = styles;
