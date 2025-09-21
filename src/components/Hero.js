import React, { useEffect, useState } from 'react';
import './Hero.css';
import slide1a from '../images/Slide/1a.png';
import slide1b from '../images/Slide/1b.png';
import slide1c from '../images/Slide/1c.png';

const Hero = () => {
	const slides = [slide1a, slide1b, slide1c];
	const [current, setCurrent] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setCurrent((prev) => (prev + 1) % slides.length);
		}, 4000);
		return () => clearInterval(id);
	}, [slides.length]);

	return (
		<section className="hero">
			<div className="hero-content">
				<div className="hero-text">
					<h1 className="hero-title">
						Gear Up for Greatness!
					</h1>
					<h2 className="hero-subtitle">
						<span className="highlight">Elevate Your Game</span> With{' '}
						<span className="highlight">Premium Sportswear!</span>
					</h2>
					<p className="hero-description">
						Yohann's Sportswear House is your one-stop shop for quality sportswear, 
						custom jerseys, uniforms, and accessories like tote bags, umbrellas, and towels. 
						Trusted by teams, clubs, and organizations worldwide.
					</p>
					<div className="hero-buttons">
						<button className="btn btn-primary">SHOP NOW</button>
						<button className="btn btn-secondary">INQUIRE NOW</button>
					</div>
				</div>
				
				<div className="hero-image">
					<img src={slides[current]} alt={`Slide ${current + 1}`} className="hero-photo" />
				</div>
			</div>
		</section>
	);
};

export default Hero; 