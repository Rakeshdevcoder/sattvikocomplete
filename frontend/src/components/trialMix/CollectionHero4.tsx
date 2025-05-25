// CollectionHero.tsx
import React from "react";
import styles from "../../styles/makhanas/collectionhero.module.css";

const CollectionHero4: React.FC = () => {
  return (
    <div className={styles.collectionHero}>
      <div className={styles.heroInner}>
        <div className={styles.textWrapper}>
          <h1 className={styles.title}>
            <span className={styles.visuallyHidden}>Collection: </span>
            Trail Mix
          </h1>
          <div className={styles.description}>
            <p>
              <strong>
                Nutrient-packed trail mix, crafted for unbeatable taste and
                energy on the go.
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionHero4;
