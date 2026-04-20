import type { IdeaStage } from "@ideavault/core";
import styles from "./StagePill.module.css";

const LABELS: Record<IdeaStage, string> = {
  seed: "Semilla",
  growing: "Creciendo",
  ready: "Lista",
};

type Props = { stage: IdeaStage };

export function StagePill({ stage }: Props) {
  return <span className={`${styles.pill} ${styles[stage]}`}>{LABELS[stage]}</span>;
}
