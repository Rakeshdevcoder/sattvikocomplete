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
            Nuts & Dry Fruits
          </h1>
          <div className={styles.description}>
            <p>
              Fuel your body with nature’s power-packed snacks! Our premium
              selection of Nuts & Dry Fruits is a rich source of{" "}
              <strong>High Protein</strong> , essential for muscle growth and
              repair, along with <strong>Omega-3 fatty acids </strong> that
              support heart and brain health. Naturally loaded with{" "}
              <strong>Vitamin D</strong>, these superfoods help strengthen your
              bones and boost immunity. Whether you're looking for a quick
              energy boost or a nutritious addition to your daily diet, our
              range offers the perfect blend of taste and health in every bite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionHero2;
