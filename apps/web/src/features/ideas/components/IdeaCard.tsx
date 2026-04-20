import { IdeaStageSchema } from "@ideavault/core";
import type { IdeaRow } from "../hooks/useIdeas";
import { StagePill } from "./StagePill";
import styles from "./IdeaCard.module.css";

type Props = {
  idea: IdeaRow;
  active?: boolean;
  onClick: () => void;
};

export function IdeaCard({ idea, active, onClick }: Props) {
  const stageResult = IdeaStageSchema.safeParse(idea.stage);
  const stage = stageResult.success ? stageResult.data : ("seed" as const);

  return (
    <div
      className={`${styles.card}${active ? ` ${styles.active}` : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{idea.title}</h3>
        <StagePill stage={stage} />
      </div>
      {idea.description && <p className={styles.description}>{idea.description}</p>}
      <div className={styles.meta}>
        <span className={styles.category}>{idea.category}</span>
      </div>
    </div>
  );
}
