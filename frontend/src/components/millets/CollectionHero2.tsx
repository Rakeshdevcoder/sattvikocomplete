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
            Millet Puffs
          </h1>
          <div className={styles.description}>
            <p>
              <strong>
                Millet Puffs with Probiotics – A Crunchy Boost to Gut Health!
              </strong>
            </p>
            <p>
              Discover the perfect blend of taste and wellness with our Millet
              Puffs enriched with Probiotics. Made from nutrient-rich millets
              like ragi, jowar, and bajra, these light and crispy snacks are not
              only gluten-free but also packed with dietary fiber, essential
              minerals, and gut-friendly probiotics.
            </p>
            <p>
              Each bite supports digestion and boosts immunity while satisfying
              your snack cravings guilt-free. Whether you're looking for a
              healthy midday munch or a tasty treat for kids, our millet puffs
              offer the perfect mix of crunch, flavor, and functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionHero2;
