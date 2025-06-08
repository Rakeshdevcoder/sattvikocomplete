// CollectionHero.tsx
import React from "react";
import styles from "../../styles/makhanas/collectionhero.module.css";

const CollectionHero6: React.FC = () => {
  return (
    <div className={styles.collectionHero}>
      <div className={styles.heroInner}>
        <div className={styles.textWrapper}>
          <h1 className={styles.title}>
            <span className={styles.visuallyHidden}>Collection: </span>
            Combo Packs
          </h1>
          <div className={styles.description}>
            <p>
              Offering a nutritious and delicious snack rich in protein, fiber,
              and essential minerals. Perfect for guilt-free munching, our
              variety of flavors caters to every taste. Enjoy a healthy, crunchy
              treat anytime, anywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionHero6;
