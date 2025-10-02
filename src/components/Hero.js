import React, { useEffect, useState } from 'react';
import './Hero.css';
import slide1a from '../images/Slide/1a.png';
import slide1b from '../images/Slide/1b.png';
import slide1c from '../images/Slide/1c.png';

const Hero = () => {
	const slides = [slide1a, slide1b, slide1c];
	const [current, setCurrent] = useState(0);
	const [searchQuery, setSearchQuery] = useState('');
	const [showFilter, setShowFilter] = useState(false);

	const filterOptions = [
		{ category: 'Categories', options: ['Jerseys', 'T-Shirts', 'Long Sleeves', 'Uniforms', 'Accessories'] },
		{ category: 'Price Range', options: ['Under P500', 'P500 - P1000', 'P1000 - P1500', 'Above P1500'] },
		{ category: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom'] },
		{ category: 'Color', options: ['Blue', 'Red', 'White', 'Black', 'Green', 'Yellow', 'Purple'] },
		{ category: 'Brand', options: ["Yohann's Own", 'Replicated', 'Custom Design'] }
	];

	useEffect(() => {
		const id = setInterval(() => {
			setCurrent((prev) => (prev + 1) % slides.length);
		}, 4000);
		return () => clearInterval(id);
	}, [slides.length]);

	return (
		<section className="hero">
			<div className="hero-content">
				<div className="hero-controls">
					<div className="hero-searchbar">
						<input
							className="hero-search-input"
							type="text"
							placeholder="Search products..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<button className="hero-search" aria-label="Search">
							<svg viewBox="0 0 24 24" role="img" aria-hidden="true">
								<circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
								<line x1="15.5" y1="15.5" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
							</svg>
						</button>
						<div className="hero-filter-wrap">
							<button className="hero-filter" aria-label="Filter" onClick={() => setShowFilter((v) => !v)}>
								<svg viewBox="0 0 24 24" role="img" aria-hidden="true">
									<path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" fill="currentColor" />
								</svg>
							</button>
							{showFilter && (
								<div className="hero-dropdown-menu">
									<div className="hero-filter-categories-row">
										{filterOptions.map((filter, index) => (
											<div key={index} className="hero-filter-category">
												<h4 className="hero-filter-category-title">{filter.category}</h4>
												<div className="hero-filter-options">
													{filter.options.map((option, optionIndex) => (
														<label key={optionIndex} className="hero-filter-option">
															<input type="checkbox" />
															<span>{option}</span>
														</label>
													))}
												</div>
											</div>
										))}
									</div>
									<div className="hero-filter-actions">
										<button className="apply-filters">Apply Filters</button>
										<button className="clear-filters">Clear All</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
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