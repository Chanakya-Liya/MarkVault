import styles from './TOCPanel.module.css'

export default function TOCPanel({ items, activeId, onItemClick }) {
  if (!items.length) return null

  return (
    <nav className={styles.toc} aria-label="Table of contents">
      <div className={styles.title}>Contents</div>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <button
              className={`${styles.item} ${styles[`level${item.level}`]} ${item.id === activeId ? styles.active : ''}`}
              onClick={() => onItemClick(item.id)}
              title={item.text}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
