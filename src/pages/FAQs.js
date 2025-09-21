import React, { useState } from 'react';
import './FAQs.css';

const FAQs = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      question: "What types of sportswear do you offer?",
      answer: "We offer a wide range of sportswear including custom jerseys, t-shirts, long sleeves, uniforms, and accessories. We specialize in custom designs for teams, schools, and organizations."
    },
    {
      question: "Do you provide custom design services?",
      answer: "Yes! We have professional designers who can help create custom designs for your sportswear. You can bring your own design or work with our team to create something unique."
    },
    {
      question: "What are your pricing ranges?",
      answer: "Our prices vary depending on the product and customization level. We offer options from under P500 to above P1500, with competitive pricing for bulk orders."
    },
    {
      question: "How long does it take to complete an order?",
      answer: "Standard orders typically take 3-5 business days, while custom designs may take 7-10 business days. Rush orders are available for an additional fee."
    },
    {
      question: "Do you have multiple branch locations?",
      answer: "Yes! We have 7 convenient locations across Batangas and Oriental Mindoro, including our main branch in San Pascual, Batangas."
    },
    {
      question: "What sizes are available?",
      answer: "We carry sizes from XS to XXL, and we also offer custom sizing for special requirements. Our staff can help you find the perfect fit."
    },
    {
      question: "Do you offer bulk discounts?",
      answer: "Yes, we offer special pricing for bulk orders. Contact us for a quote based on your quantity requirements."
    },
    {
      question: "Can I visit your branches to see products?",
      answer: "Absolutely! We encourage customers to visit our branches to see our products in person and get personalized assistance from our staff."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="faqs-container">
      <div className="faqs-wrapper">
        {/* Hero Section */}
        <div className="faqs-hero">
          <h1 className="faqs-title">
            FAQs
          </h1>
          <p className="faqs-subtitle">
            Find answers to common questions about our products and services
          </p>
        </div>

        {/* FAQs Section */}
        <div className="faqs-section">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                onClick={() => toggleFAQ(index)}
                className="faq-question-button"
              >
                <span className="faq-question-text">{faq.question}</span>
                <span className={`faq-toggle-icon ${openFAQ === index ? 'open' : ''}`}>
                  +
                </span>
              </button>
              {openFAQ === index && (
                <div className="faq-answer">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="faqs-contact">
          <h2 className="faqs-contact-title">
            Still Have Questions?
          </h2>
          <p className="faqs-contact-description">
            Contact us directly for personalized assistance
          </p>
          <div className="faqs-contact-buttons">
            <a href="/branches" className="faqs-contact-button primary">
              Visit Our Branches
            </a>
            <a href="#contacts" className="faqs-contact-button secondary">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQs; 