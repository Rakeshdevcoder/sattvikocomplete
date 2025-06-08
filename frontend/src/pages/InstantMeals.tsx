import CollectionHero3 from "../components/instant_meals/CollectionHero3";
import ProductList from "../components/makhanas/ProductList";

const InstantMeals = () => {
  return (
    <>
      <div style={{ marginLeft: "180.4px", marginRight: "180.4px" }}>
        <CollectionHero3 />
        <ProductList category="Instant Meals" />
      </div>
    </>
  );
};

export default InstantMeals;
