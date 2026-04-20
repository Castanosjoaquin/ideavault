import type { IdeaDevelopment } from "@ideavault/core";
import styles from "./DevBlock.module.css";

type Props = { dev: IdeaDevelopment };

export function DevBlock({ dev }: Props) {
  return (
    <div className={styles.root}>
      <Section title="Problema" text={dev.problema} />
      <Section title="Propuesta" text={dev.propuesta} />
      <ListSection title="Pasos" items={dev.pasos} />
      <ListSection title="Desafíos" items={dev.desafios} />
      <ListSection title="Recursos" items={dev.recursos} />
      <Section title="Próxima acción" text={dev.proxima_accion} />
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.section}>
      <span className={styles.sectionTitle}>{title}</span>
      <p className={styles.text}>{text}</p>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.section}>
      <span className={styles.sectionTitle}>{title}</span>
      <ul className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={styles.listItem}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
