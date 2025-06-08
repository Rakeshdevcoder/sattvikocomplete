import CollectionHero from "../components/makhanas/CollectionHero";
import ProductList from "../components/makhanas/ProductList";

const Makhanas = () => {
  return (
    <>
      <div style={{ marginLeft: "100.4px", marginRight: "100.4px" }}>
        <CollectionHero />
        <ProductList category="Makhanas" />
      </div>
    </>
  );
};

export default Makhanas;
