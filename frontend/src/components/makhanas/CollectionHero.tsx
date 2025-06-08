// CollectionHero.tsx
import React from "react";
import styles from "../../styles/makhanas/collectionhero.module.css";

const CollectionHero: React.FC = () => {
  return (
    <div className={styles.collectionHero}>
      <div className={styles.heroInner}>
        <div className={styles.textWrapper}>
          <h1 className={styles.title}>
            <span className={styles.visuallyHidden}>Collection: </span>
            Flavoured Makhana
          </h1>
          <div className={styles.description}>
            <p>
              <strong>A Wholesome Snack with a Functional Twist</strong>
            </p>
            <p>
              Discover our range of <em>Flavoured Makhana</em>, a deliciously
              healthy snack that goes beyond taste. These roasted fox nuts are
              packed with <strong>antioxidants</strong> to fight free radicals
              and support overall wellness. Enriched with{" "}
              <strong>probiotics</strong>, they also promote better gut health
              and digestion.
            </p>
            <p>
              Each bite delivers a good source of{" "}
              <strong>plant-based protein</strong>, making it an ideal snack for
              fitness enthusiasts and mindful eaters. We've thoughtfully added{" "}
              <strong>sesame seeds</strong> for an extra crunch and a boost of
              calcium and healthy fats, and <strong>Ashwagandha</strong>, the
              ancient adaptogen known to reduce stress and support vitality.
            </p>
            <p>
              Perfectly roasted and seasoned, our makhanas are not just
              snacks—they're a lifestyle upgrade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionHero;
