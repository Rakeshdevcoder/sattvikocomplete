import React from "react";
import styles from "../styles/bestseller.module.css";
import ProductCard from "./ProductCard";

// Product interface to define the structure of our product data
interface Product {
  id: string;
  title: string;
  price: string;
  rating?: number;
  reviewCount?: number;
  images: {
    main: string;
    hover: string;
  };
  hasAntioxidants?: boolean;
  hasProbiotics?: boolean;
  weight: string;
}

const BestSellers: React.FC = () => {
  // Sample product data based on your images
  const products: Product[] = [
    {
      id: "8971515691304",
      title: "Sattviko Peri Peri Makhana",
      price: "122.00",
      rating: 5,
      reviewCount: 1,
      images: {
        main: "//sattviko.com/cdn/shop/files/peri_peri_makhana.webp?v=1722947092",
        hover:
          "//sattviko.com/cdn/shop/files/Peri_Makhana_s2.webp?v=1723204761",
      },
      hasProbiotics: true,
      weight: "40 GM",
    },
    {
      id: "8970513514792",
      title: "Sattviko Spicy Trail Mix",
      price: "125.00",
      images: {
        main: "//sattviko.com/cdn/shop/files/Sattviko_trail_mix.webp?v=1722076144",
        hover: "//sattviko.com/cdn/shop/files/Trail_Mix_s3.webp?v=1723204762",
      },
      weight: "80 GM",
    },
    {
      id: "9313739997480",
      title: "Sattviko Instant Oatmeal Banoffee Flavour",
      price: "100.00",
      rating: 5,
      reviewCount: 1,
      images: {
        main: "//sattviko.com/cdn/shop/files/Sattviko_Benoffee_Oatmeal.webp?v=1722079231",
        hover:
          "//sattviko.com/cdn/shop/files/Oatmeal_Banoffee_s2.webp?v=1723204761",
      },
      weight: "70 GM",
    },
    {
      id: "9114612662568",
      title: "Sattviko Mint Makhana Flavor",
      price: "122.00",
      images: {
        main: "//sattviko.com/cdn/shop/files/sattvikomintmakhanafinal.webp?v=1716527941",
        hover:
          "//sattviko.com/cdn/shop/files/Mint_Makhana_s4.webp?v=1723204761",
      },
      hasAntioxidants: true,
      weight: "40 GM",
    },
  ];

  return (
    <div className={styles.collectionSection}>
      <div className={styles.titleWrapper}>
        <h2 className={styles.title}>Best Sellers ♡</h2>
      </div>

      <div className={styles.productGrid}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className={styles.viewAllContainer}>
        <a
          href="/collections/best-sellers-healthy-snacks"
          className={styles.viewAllLink}
        >
          View all
        </a>
      </div>
    </div>
  );
};

export default BestSellers;
