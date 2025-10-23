import React, { useState } from 'react';
import './Newsletter.css';

const Newsletter = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email);
    setEmail('');
  };

  return (
    <section className="newsletter">
      <div className="newsletter-content">
        {/* Left Album Images */}
        <div className="newsletter-album newsletter-album-left">
          <div className="album-image album-top-left">
            <img 
              src="/image_highlights/basketball.png" 
              alt="Basketball Player" 
              className="album-img"
            />
          </div>
          <div className="album-image album-bottom-left">
            <img 
              src="/image_highlights/volleyball.png" 
              alt="Volleyball Player" 
              className="album-img"
            />
          </div>
        </div>

        {/* Newsletter Text & Form */}
        <div className="newsletter-text">
          <h2 className="newsletter-title">LEVEL UP YOUR GAME WITH YOHANN'S</h2>
          <p className="newsletter-subtitle">
            New heat. Fresh fits. More teams on deck. Big drops coming - don't miss out.
          </p>
          <p className="newsletter-description">
            Be the first to know about our latest product drops and exclusive offers.
          </p>
          
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="email-input"
              required
            />
            <button type="submit" className="subscribe-btn">SUBSCRIBE</button>
          </form>
        </div>

        {/* Right Album Images */}
        <div className="newsletter-album newsletter-album-right">
          <div className="album-image album-top-right">
            <img 
              src="/image_highlights/basketball1.png" 
              alt="Basketball Player 1" 
              className="album-img"
            />
          </div>
          <div className="album-image album-bottom-right">
            <img 
              src="/image_highlights/football.png" 
              alt="Football Player" 
              className="album-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter; 