// CollectionHero.tsx
import React from "react";
import styles from "../../styles/makhanas/collectionhero.module.css";

const CollectionHero2: React.FC = () => {
  return (
    <div className={styles.collectionHero}>
      <div className={styles.heroInner}>
        <div className={styles.textWrapper}>
          <h1 className={styles.title}>
            <span className={styles.visuallyHidden}>Collection: </span>
            Instant Meals
          </h1>
          <div className={styles.description}>
            <p>
              <strong>
                Instant Meals – Wholesome. Nutritious. Ready in Minutes.
              </strong>
            </p>
            <p>
              Discover our range of <strong>Instant Meals </strong> crafted for
              today’s fast-paced lifestyle—without compromising on health. Each
              serving is a <strong> High Protein </strong>powerhouse and a{" "}
              <strong>Source of Dietary Fiber</strong>
              Source of Dietary Fiber, making it a smart choice for fitness
              enthusiasts and busy professionals alike.
            </p>
            <p>
              Infused with <strong>added Chia Seeds </strong> and{" "}
              <strong>13 carefully selected Yogic Herbs</strong>, our meals
              offer not just convenience but a balanced blend of taste,
              nutrition, and ancient wellness wisdom. Whether you're looking for
              a quick lunch, a light dinner, or a post-workout bite, these meals
              are your go-to for{" "}
              <strong>clean energy and easy digestion.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionHero2;
