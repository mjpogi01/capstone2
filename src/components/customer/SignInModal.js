import React, { useState, useEffect, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { AiOutlineMail, AiOutlineLock } from "react-icons/ai";
import ReCAPTCHA from "react-google-recaptcha";
import styles from "./SignInModal.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../../images/yohanns_logo-removebg-preview 3.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const SignInModal = ({ isOpen, onClose, onOpenSignUp }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const captchaRef = useRef(null);
  const errorShownRef = useRef(false);
  const { login, signInWithProvider } = useAuth();
  const navigate = useNavigate();

  // reCAPTCHA site key from environment variables
  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "6LdUzg8sAAAAAM-2lXxMP1LeK8hYonnF0qC1CF1u";

  // Check if reCAPTCHA script is loaded
  useEffect(() => {
    const checkRecaptchaLoaded = () => {
      if (typeof window.grecaptcha !== 'undefined' && window.grecaptcha.ready) {
        return true;
      }
      return false;
    };

    // Wait for reCAPTCHA to load with timeout
    if (isOpen && !checkRecaptchaLoaded()) {
      const timeout = setTimeout(() => {
        if (!checkRecaptchaLoaded()) {
          setCaptchaError(true);
          setError("reCAPTCHA failed to load. Please check your internet connection and refresh the page.");
        }
      }, 5000); // 5 second timeout

      const checkInterval = setInterval(() => {
        if (checkRecaptchaLoaded()) {
          clearTimeout(timeout);
          clearInterval(checkInterval);
          setCaptchaError(false);
        }
      }, 500);

      return () => {
        clearTimeout(timeout);
        clearInterval(checkInterval);
      };
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("yohannModalOpen");
      // Reset CAPTCHA when modal opens
      setCaptchaVerified(false);
      errorShownRef.current = false;
      // Don't reset captchaError here - let the check above handle it
      setError("");
      if (captchaRef.current) {
        try {
          captchaRef.current.reset();
        } catch (err) {
          console.warn('reCAPTCHA reset error:', err);
        }
      }
      return () => {
        document.body.classList.remove("yohannModalOpen");
      };
    }
  }, [isOpen]);

  const handleCaptchaChange = (value) => {
    setCaptchaVerified(!!value);
    if (value) {
      // Clear error when CAPTCHA is successfully verified
      errorShownRef.current = false;
      if (error && error.includes("CAPTCHA")) {
        setError("");
      }
    }
  };

  const handleCaptchaError = () => {
    // Only show error once to prevent blinking
    if (!errorShownRef.current) {
      errorShownRef.current = true;
      setCaptchaError(true);
      setError("reCAPTCHA failed to load. Please check your internet connection and refresh the page.");
      setCaptchaVerified(false);
    }
  };

  const handleCaptchaExpired = () => {
    setCaptchaVerified(false);
    setError("reCAPTCHA expired. Please verify again.");
  };

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Validate CAPTCHA (only if not in error state)
        if (!captchaError && !captchaVerified) {
          setError("Please complete the CAPTCHA verification");
          setIsLoading(false);
          return;
        }

        // If CAPTCHA has error, allow login but show warning
        if (captchaError) {
          console.warn('Login proceeding without CAPTCHA verification due to error');
        }

    try {
      const result = await login(formData);
      onClose();

      const user = result.user;
      const role = user.user_metadata?.role || "customer";
      if (role === "owner") {
        navigate("/owner");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(error.message);
      // Reset CAPTCHA on error
      if (captchaRef.current) {
        captchaRef.current.reset();
        setCaptchaVerified(false);
      }
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

  return (
    <div className={styles.signinModalOverlay} onClick={onClose}>
      <div className={styles.signinModal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className={styles.signinCloseBtn}
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Content Wrapper */}
        <div className={styles.signinModalContent}>
          {/* Header - Logo & Title */}
          <div className={styles.signinHeader}>
            <img
              src={logo}
              alt="Yohann's Sportswear House"
              className={styles.signinLogo}
            />
            <div>
              <h1 className={styles.signinTitle}>Welcome Back!</h1>
              <p className={styles.signinSubtitle}>Sign in to continue your journey.</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={styles.signinErrorAlert}>
              <span className={styles.signinErrorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form - Primary */}
          <form className={styles.signinForm} onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className={styles.signinFormGroup}>
              <label className={styles.signinLabel}>Email</label>
              <div className={styles.signinInputWrapper}>
                <AiOutlineMail className={styles.signinInputIcon} />
                <input
                  type="email"
                  name="email"
                  className={styles.signinInput}
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.signinFormGroup}>
              <div className={styles.signinPasswordHeader}>
                <label className={styles.signinLabel}>Password</label>
                <a href="#forgot" className={styles.signinForgotLink}>
                  Forgot password?
                </a>
              </div>
              <div className={styles.signinInputWrapper}>
                <AiOutlineLock className={styles.signinInputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={styles.signinInput}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.signinPasswordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className={styles.signinCaptchaContainer}>
              {!captchaError ? (
                <ReCAPTCHA
                  ref={captchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={handleCaptchaChange}
                  onErrored={handleCaptchaError}
                  onExpired={handleCaptchaExpired}
                  theme="dark"
                />
              ) : (
                <div style={{ 
                  padding: '10px', 
                  textAlign: 'center', 
                  color: '#ff6b6b',
                  fontSize: '0.9rem' 
                }}>
                  reCAPTCHA unavailable. You can still sign in.
                </div>
              )}
            </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  className={styles.signinSignInBtn}
                  disabled={isLoading || (!captchaError && !captchaVerified)}
                >
              {isLoading ? (
                <>
                  <span className={styles.signinSpinner}></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.signinDivider}>
            <span>OR</span>
          </div>

          {/* Social Buttons - Secondary */}
          <div className={styles.signinSocialButtons}>
            <button
              type="button"
              className={styles.signinSocialBtn}
              onClick={() => handleSocial("Google")}
              aria-label="Sign in with Google"
            >
              <FcGoogle />
              <span>Sign in with Google</span>
            </button>
            <button
              type="button"
              className={styles.signinSocialBtn}
              onClick={() => handleSocial("Facebook")}
              aria-label="Sign in with Facebook"
            >
              <FaFacebook />
              <span>Sign in with Facebook</span>
            </button>
          </div>

          {/* Sign Up Prompt */}
          <div className={styles.signinSignUpPrompt}>
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                className={styles.signinSignUpLink}
                onClick={onOpenSignUp}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInModal;

