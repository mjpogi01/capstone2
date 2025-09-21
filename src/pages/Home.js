import React, { useState } from 'react';
import Hero from '../components/Hero';
import ProductCategories from '../components/ProductCategories';
import CustomDesign from '../components/CustomDesign';
import Newsletter from '../components/Newsletter';

const Home = () => {
  const [activeCategory, setActiveCategory] = useState('jerseys');

  return (
    <>
      <Hero />
      <ProductCategories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      <CustomDesign />
      <Newsletter />
    </>
  );
};

export default Home; 