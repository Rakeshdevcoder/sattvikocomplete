// frontend/src/pages/Nuts.tsx (continued)
) {
  additionalInfo = " | With Probiotics";
} else if (product.hasAntioxidants) {
  additionalInfo = " | With Anti Oxidants";
}

return `${title} ${product.weight}${additionalInfo}`;
};

const formattedTitle = formatTitle();

const renderStars = () => {
if (!product.rating) return null;

return (
  <div className={productStyles.rating}>
    <div className={productStyles.stars}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={
            i < Math.round(product.rating!)
              ? productStyles.starFilled
              : productStyles.starEmpty
          }
        >
          ★
        </span>
      ))}
    </div>
    {product.reviewCount && (
      <span className={productStyles.reviewCount}>
        {product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""}
      </span>
    )}
  </div>
);
};

return (
<div className={productStyles.cardWrapper}>
  <div
    className={productStyles.card}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    <a href={`/products/${product.id}`} className={productStyles.imageLink}>
      <div className={productStyles.imageContainer}>
        <img
          src={
            isHovered && product.images.hover
              ? product.images.hover
              : product.images.main
          }
          alt={formattedTitle}
          className={productStyles.productImage}
          loading="lazy"
        />
      </div>
    </a>

    <div className={productStyles.contentContainer}>
      <div className={productStyles.titleContainer}>
        <h3 className={productStyles.cardHeading}>
          
            href={`/products/${product.id}`}
            className={productStyles.productLink}
          >
            {formattedTitle}
          </a>
        </h3>
      </div>

      {product.rating && product.rating > 0 && (
        <div className={productStyles.ratingContainer}>{renderStars()}</div>
      )}

      <div className={productStyles.price}>
        <span className={productStyles.priceRegular}>Rs. {product.price}</span>
      </div>
    </div>
  </div>
</div>
);
};

return (
<>
<div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
  {/* Collection Hero */}
  <div className={styles.collectionHero}>
    <div className={styles.heroInner}>
      <div className={styles.textWrapper}>
        <h1 className={styles.title}>
          <span className={styles.visuallyHidden}>Collection: </span>
          Nuts & Dry Fruits
        </h1>
        <div className={styles.description}>
          <p>
            Fuel your body with nature's power-packed snacks! Our premium
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

  {/* Product List */}
  {loading && <div className={listStyles.loading}>Loading products...</div>}
  {error && <div className={listStyles.error}>{error}</div>}
  {!loading && !error && products.length === 0 && (
    <div className={listStyles.noProducts}>No products found.</div>
  )}
  {!loading && !error && products.length > 0 && (
    <div className={listStyles.productGrid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )}
</div>
</>
);
};

export default Nuts;