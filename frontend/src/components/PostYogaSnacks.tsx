import React from "react";
import styles from "../styles/postyogasnacks.module.css";
import { ArrowRight } from "lucide-react";

interface SnackCardProps {
  title: string;
  description: string;
  imageSrc: string;
  altText: string;
  link: string;
}

const SnackCard: React.FC<SnackCardProps> = ({
  title,
  description,
  imageSrc,
  altText,
  link,
}) => {
  return (
    <div className={styles.snackCard}>
      <div className={styles.imageContainer}>
        <a href={link} className={styles.imageLink}>
          <img src={imageSrc} alt={altText} className={styles.image} />
        </a>
      </div>
      <div className={styles.cardInfo}>
        <a href={link} className={styles.titleLink}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </a>
        <p className={styles.description}>{description}</p>
        <a href={link} className={styles.shopNowLink}>
          Shop Now
          <span className={styles.iconWrap}>
            <ArrowRight size={14} />
          </span>
        </a>
      </div>
    </div>
  );
};

const PostYogaSnacks: React.FC = () => {
  const snackItems: SnackCardProps[] = [
    {
      title: "Antioxidant Makhana Snacks",
      description:
        "Sattviko makhana or popped lotus seed snack with added yogic herbs available in 6 flavors",
      imageSrc:
        "//sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=50 50w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=75 75w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=100 100w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=150 150w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=200 200w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=300 300w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=400 400w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=500 500w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=750 750w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=1000 1000w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=1250 1250w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=1500 1500w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=1750 1750w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=2000 2000w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=2250 2250w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=2500 2500w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=2750 2750w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=3000 3000w, //sattviko.com/cdn/shop/files/Barbeque_Makhana_Benefits.webp?v=1721304316&amp;width=3200 3200w",

      altText: "Antioxidant Makhana Snacks",
      link: "/collections/antioxidant-1",
    },
    {
      title: "Ashwagandha Makhana Snacks",
      description:
        "Sattviko Makhana Snack with added ashwagandha and brahmi. The mild sweet cinnamon flavor is great for your post yoga sweet craving",
      imageSrc:
        "//sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=50 50w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=75 75w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=100 100w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=150 150w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=200 200w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=300 300w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=400 400w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=500 500w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=750 750w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=1000 1000w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=1250 1250w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=1500 1500w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=1750 1750w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=2000 2000w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=2250 2250w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=2500 2500w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=2750 2750w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=3000 3000w, //sattviko.com/cdn/shop/files/Sweet_Cinnamon_Makhana_Benefits.webp?v=1721304316&amp;width=3200 3200w",

      altText: "Ashwagandha Makhana Snacks",
      link: "/collections/ashwagandha",
    },
    {
      title: "Omega 3 Makhana Snacks",
      description:
        "Crunchy, crispy & delicious pickle flavored popped lotus seed snack topped with flax & chia seed",
      imageSrc:
        "//sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=50 50w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=75 75w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=100 100w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=150 150w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=200 200w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=300 300w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=400 400w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=500 500w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=750 750w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=1000 1000w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=1250 1250w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=1500 1500w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=1750 1750w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=2000 2000w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=2250 2250w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=2500 2500w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=2750 2750w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=3000 3000w, //sattviko.com/cdn/shop/files/Lime_Pickle_Makhana_Benefits.webp?v=1721304316&amp;width=3200 3200w",

      altText: "Omega 3 Makhana Snacks",
      link: "/collections/omega-3",
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.titleWrapper}>
          <h2 className={styles.title}>Buy Post Yoga Snacks & Meals</h2>
        </div>
        <div className={styles.snackGrid}>
          {snackItems.map((item, index) => (
            <SnackCard
              key={index}
              title={item.title}
              description={item.description}
              imageSrc={item.imageSrc}
              altText={item.altText}
              link={item.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PostYogaSnacks;
