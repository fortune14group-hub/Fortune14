import Link from 'next/link';
import Logo from './Logo';
import styles from './header.module.css';

export default function Header({ children, className = '', logoPriority = false }) {
  const headerClassName = className ? `${styles.header} ${className}` : styles.header;
  const innerClassName = children ? `${styles.inner} ${styles.innerWithContent}` : styles.inner;

  return (
    <header className={headerClassName}>
      <div className={innerClassName}>
        <Link href="/" aria-label="Gå till startsidan" className={styles.brand}>
          <Logo className={styles.logo} priority={logoPriority} />
        </Link>
        {children ? <div className={styles.slot}>{children}</div> : null}
      </div>
    </header>
  );
}
