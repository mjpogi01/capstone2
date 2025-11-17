import React, { useState, useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { AiOutlineMail, AiOutlineLock, AiOutlinePhone } from "react-icons/ai";
import styles from "./SignUpModal.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useModal } from "../../contexts/ModalContext";
import logo from "../../images/yohanns_logo-removebg-preview 3.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import TermsAndConditionsModal from "./TermsAndConditionsModal";

const SignUpModal = ({ isOpen, onClose, onOpenSignIn }) => {
  const [formData, setFormData] = useState({
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { register, signInWithProvider } = useAuth();
  const { showSuccess } = useNotification();
  const { openSignUp } = useModal();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("yohannModalOpen");
      return () => {
        document.body.classList.remove("yohannModalOpen");
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        phone: formData.contact,
      };

      // Set flag to suppress welcome back notification for new signup
      localStorage.setItem('isNewSignup', 'true');
      
      const result = await register(userData);
      console.log("Sign up successful:", result);
      // Show terms and conditions modal after successful signup
      setShowTermsModal(true);
    } catch (error) {
      // Remove flag if signup fails
      localStorage.removeItem('isNewSignup');
      setError(error.message);
      console.error("Sign up error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithProvider(provider); // Will redirect for OAuth
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTermsAgree = () => {
    setShowTermsModal(false);
    showSuccess(
      'Account Created Successfully!',
      'Welcome to Yohann\'s Sportswear House! Your account has been created.'
    );
    // Reset form
    setFormData({
      email: "",
      contact: "",
      password: "",
      confirmPassword: "",
    });
    setError("");
    // Close signup modal and open sign-in modal
    onClose();
    // Small delay to ensure signup modal is closed before opening sign-in modal
    setTimeout(() => {
      onOpenSignIn();
    }, 100);
  };

  const handleTermsDisagree = () => {
    setShowTermsModal(false);
    // Close the signup modal
    onClose();
    // Reopen signup modal after a short delay to allow notification to show
    setTimeout(() => {
      // The notification will be shown by TermsAndConditionsModal
      // Reopen the signup modal so user can try again
      openSignUp();
    }, 800);
  };

  return (
    <div className={styles.signupModalOverlay} onClick={onClose}>
      <div className={styles.signupModal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className={styles.signupCloseBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Content Wrapper */}
        <div className={styles.signupModalContent}>
          {/* Header - Logo & Title */}
          <div className={styles.signupHeader}>
            <img
              src={logo}
              alt="Yohann's Sportswear House"
              className={styles.signupLogo}
            />
            <div>
              <h1 className={styles.signupTitle}>Create Account</h1>
              <p className={styles.signupSubtitle}>Join us today and start shopping.</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={styles.signupErrorAlert}>
              <span className={styles.signupErrorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form - Primary */}
          <form className={styles.signupForm} onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className={styles.signupFormGroup}>
              <label className={styles.signupLabel}>Email</label>
              <div className={styles.signupInputWrapper}>
                <AiOutlineMail className={styles.signupInputIcon} />
                <input
                  type="email"
                  name="email"
                  className={styles.signupInput}
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className={styles.signupFormGroup}>
              <label className={styles.signupLabel}>Phone</label>
              <div className={styles.signupInputWrapper}>
                <AiOutlinePhone className={styles.signupInputIcon} />
                <input
                  type="tel"
                  name="contact"
                  className={styles.signupInput}
                  placeholder="Phone number"
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.signupFormGroup}>
              <label className={styles.signupLabel}>Password</label>
              <div className={styles.signupInputWrapper}>
                <AiOutlineLock className={styles.signupInputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={styles.signupInput}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.signupPasswordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className={styles.signupFormGroup}>
              <label className={styles.signupLabel}>Confirm Password</label>
              <div className={styles.signupInputWrapper}>
                <AiOutlineLock className={styles.signupInputIcon} />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  className={styles.signupInput}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.signupPasswordToggle}
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Toggle confirm password visibility"
                  title={showConfirm ? "Hide password" : "Show password"}
                >
                  <FontAwesomeIcon icon={showConfirm ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className={styles.signupSignUpBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.signupSpinner}></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.signupDivider}>
            <span>OR</span>
          </div>

          {/* Social Buttons - Secondary */}
          <div className={styles.signupSocialButtons}>
            <button
              type="button"
              className={styles.signupSocialBtn}
              onClick={() => handleSocial("Google")}
              aria-label="Sign up with Google"
            >
              <FcGoogle />
              <span>Sign up with Google</span>
            </button>
            <button
              type="button"
              className={styles.signupSocialBtn}
              onClick={() => handleSocial("Facebook")}
              aria-label="Sign up with Facebook"
            >
              <FaFacebook />
              <span>Sign up with Facebook</span>
            </button>
          </div>

          {/* Sign In Prompt */}
          <div className={styles.signupSignInPrompt}>
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className={styles.signupSignInLink}
                onClick={onOpenSignIn}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onAgree={handleTermsAgree}
        onDisagree={handleTermsDisagree}
      />
    </div>
  );
};

export default SignUpModal;
