import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc"; // ✅ New Google G
import { FaFacebook } from "react-icons/fa"; // ✅ Updated Facebook f
import styles from "./SignUpModal.module.css"; // ✅ scoped CSS
import logo from "../images/yohanns_logo-removebg-preview 3.png";
import jerseyImage from "../images/Group 118.png";

const SignUpModal = ({ isOpen, onClose, onOpenSignIn, leftWidth }) => {
  const [formData, setFormData] = useState({
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    console.log("Sign up attempt:", formData);
  };

  const handleSocial = (provider) => console.log(`Sign up with ${provider}`);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* LEFT IMAGE */}
        <div
          className={styles.modalLeft}
          style={leftWidth ? { ["--modal-left-width"]: leftWidth } : undefined}
        >
          <img
            src={jerseyImage}
            alt="Sportswear"
            className={styles.jerseyImage}
          />
        </div>

        {/* RIGHT FORM */}
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
            <h2 className={styles.modalTitle}>Create an account</h2>
            <p className={styles.modalSubtitle}>Fill all credentials</p>
          </div>

          {/* FORM */}
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
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
                <input
                  type="tel"
                  name="contact"
                  className={styles.formInput}
                  placeholder="Contact No."
                  value={formData.contact}
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

              <div className={styles.formGroup}>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    className={styles.formInput}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirm ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.signinButton}>
                Sign Up
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
                aria-label="Sign up with Google"
              >
                <FcGoogle className={styles.socialIcon} />
              </button>
              <button
                type="button"
                className={`${styles.socialButton} ${styles.facebook}`}
                onClick={() => handleSocial("Facebook")}
                aria-label="Sign up with Facebook"
              >
                <FaFacebook className={styles.socialIcon} />
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className={styles.modalFooter}>
            <p>
              Already Have An Account?{" "}
              <button
                type="button"
                className={styles.signupLink}
                onClick={onOpenSignIn}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;
