import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Branches from './components/Branches';
import Home from './pages/Home';
import About from './pages/About';
import Highlights from './pages/Highlights';
import FAQs from './pages/FAQs';
import Contacts from './pages/Contacts';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/highlights" element={<Highlights />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/contacts" element={<Contacts />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
