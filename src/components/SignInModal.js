import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";   // ✅ Google colored G
import { FaFacebook } from "react-icons/fa"; // ✅ Facebook "f"
import styles from "./SignInModal.module.css";
import logo from "../images/yohanns_logo-removebg-preview 3.png";
import jerseyImage from "../images/Group 118.png";

const SignInModal = ({ isOpen, onClose, onOpenSignUp, leftWidth }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Sign in attempt:", formData);
  };

  const handleSocial = (provider) => console.log(`Sign in with ${provider}`);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* LEFT SIDE IMAGE */}
        <div
          className={styles.modalLeft}
          style={leftWidth ? { "--modal-left-width": leftWidth } : undefined}
        >
          <img
            src={jerseyImage}
            alt="Sportswear"
            className={styles.jerseyImage}
          />
        </div>

        {/* RIGHT SIDE FORM */}
        <div className={styles.modalRight}>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

          <div className={styles.modalHeader}>
            <img
              src={logo}
              alt="YOHANNS Sportswear House"
              className={styles.modalLogo}
            />
            <h2 className={styles.modalTitle}>Sign In</h2>
            <p className={styles.modalSubtitle}>Welcome back! Please login</p>
          </div>

          {/* FORM */}
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <input
                type="email"
                name="email"
                className={styles.formInput}
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={styles.formInput}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.signinButton}>
                Sign In
              </button>
            </div>
          </form>

          {/* SOCIAL LOGIN */}
          <div className={styles.socialLogin}>
            <div className={styles.separator}>
              <span>or</span>
            </div>
            <div className={styles.socialButtons}>
              <button
                type="button"
                className={`${styles.socialButton} ${styles.google}`}
                onClick={() => handleSocial("Google")}
                aria-label="Sign in with Google"
              >
                <FcGoogle className={styles.socialIcon} />
              </button>
              <button
                type="button"
                className={`${styles.socialButton} ${styles.facebook}`}
                onClick={() => handleSocial("Facebook")}
                aria-label="Sign in with Facebook"
              >
                <FaFacebook className={styles.socialIcon} />
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className={styles.modalFooter}>
            <p>
              Don’t Have An Account?{" "}
              <button
                type="button"
                className={styles.signupLink}
                onClick={onOpenSignUp}
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;
