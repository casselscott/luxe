import Link from "next/link";

export default function FashionFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="fashion-footer">
      <div className="footer-container">
        {/* Brand + Newsletter */}
        <div className="brand-section">
          <h2>FASHION HOUSE</h2>
          <p>
            Redefining elegance through timeless design, craftsmanship, and
            modern luxury.
          </p>

          {/* Newsletter */}
          <div className="newsletter">
            <h4>Join the Inner Circle</h4>
            <p>Be the first to know about exclusive drops and collections.</p>
            <form
              className="newsletter-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <input type="email" placeholder="Your email address" required />
              <button type="submit">→</button>
            </form>
          </div>

          {/* Social Icons */}
          <div className="social-icons">
            <a href="#" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.31.975.975 1.248 2.242 1.31 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.31 3.608-.975.975-2.242 1.248-3.608 1.31-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.31-.975-.975-1.248-2.242-1.31-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.334-2.633 1.31-3.608.975-.975 2.242-1.248 3.608-1.31 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.58.074-3.048.46-4.213 1.625-1.165 1.165-1.551 2.633-1.625 4.213-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.074 1.58.46 3.048 1.625 4.213 1.165 1.165 2.633 1.551 4.213 1.625 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.58-.074 3.048-.46 4.213-1.625 1.165-1.165 1.551-2.633 1.625-4.213.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.074-1.58-.46-3.048-1.625-4.213-1.165-1.165-2.633-1.551-4.213-1.625-1.28-.058-1.688-.072-4.947-.072z" />
                <path d="M12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                <circle cx="18.406" cy="5.594" r="1.44" />
              </svg>
            </a>
            <a href="#" aria-label="Pinterest">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.403.042-3.438.218-.936 1.407-5.965 1.407-5.965s-.359-.719-.359-1.781c0-1.67.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.27 1.041-1.009 2.348-1.503 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.88-3.58 3.17-5.91 3.04-2.01-.11-3.91-1.21-5.05-2.87-1.3-1.92-1.55-4.4-.7-6.52.86-2.15 2.88-3.75 5.13-4.05 1.14-.15 2.29.01 3.37.38.01 1.43-.01 2.86-.02 4.29-.57-.18-1.18-.28-1.8-.19-1.12.16-2.13.93-2.64 1.94-.41.81-.5 1.75-.28 2.62.25 1.04 1.09 1.95 2.17 2.22 1.26.31 2.64-.05 3.57-.95.69-.66 1.09-1.59 1.09-2.55.06-3.71.03-7.43.03-11.14.02-.01.04-.02.06-.02z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="footer-links">
          <div>
            <h4>Explore</h4>
            <Link href="#">Collections</Link> <br />
            <Link href="#">NewLook</Link> <br />
            <Link href="#">Summer Sales</Link> <br />
            <Link href="#">Best Gift Ideas</Link> <br />
          </div>
          <div>
            <h4>Company</h4>
            <Link href="#">About Us</Link> <br />
            <Link href="#">Careers</Link> <br />
            <Link href="#">Our Team</Link> <br />
            <Link href="#">Our Vision & Values</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link href="#">Contact</Link> <br />
            <Link href="#">Shipping</Link>
            <br />
            <Link href="#">Returns</Link> <br />
            <Link href="#">Our Policy</Link> <br />
          </div>
        </div>
      </div>

      {/* Bottom bar with payment methods and legal */}
      <div className="footer-bottom">
        <div className="bottom-left">
          <span>© {currentYear} Fashion House. All rights reserved.</span>
          <div className="legal-links">
            <Link href="#">Terms</Link>
            <Link href="#">Privacy</Link>
            <Link href="#">Cookies</Link>
          </div>
        </div>

        <div className="bottom-right">
          <div className="payment-methods">
            <span className="payment-icon">Visa</span>
            <span className="payment-icon">Mastercard</span>
            <span className="payment-icon">Amex</span>
            <span className="payment-icon">PayPal</span>
          </div>
          <button
            className="back-to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
          >
            ↑
          </button>
        </div>
      </div>

      <style jsx>{`
        .fashion-footer {
          background: #0a0a0a;
          color: #ffffff;
          border-top-left-radius: 48px;
          border-top-right-radius: 48px;
          padding: 80px 40px 30px;
          margin-top: 120px;
          position: relative;
          overflow: hidden;
        }

        /* Subtle background pattern */
        .fashion-footer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px
          );
          background-size: 30px 30px;
          pointer-events: none;
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr 2fr;
          gap: 80px;
          position: relative;
          z-index: 2;
        }

        .brand-section h2 {
          font-size: 28px;
          letter-spacing: 2px;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #fff, #aaa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-section p {
          font-size: 15px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 30px;
        }

        .newsletter h4 {
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          margin-bottom: 8px;
          color: #fff;
        }

        .newsletter p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
        }

        .newsletter-form {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding-bottom: 8px;
          margin-bottom: 24px;
        }

        .newsletter-form input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 15px;
          padding: 8px 0;
          outline: none;
        }

        .newsletter-form input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .newsletter-form button {
          background: transparent;
          border: none;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .newsletter-form button:hover {
          transform: translateX(4px);
        }

        .social-icons {
          display: flex;
          gap: 16px;
        }

        .social-icons a {
          display: inline-flex;
          padding: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .social-icons a:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }

        .social-icons svg {
          fill: #fff;
          width: 20px;
          height: 20px;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .footer-links h4 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 18px;
          color: rgba(255, 255, 255, 0.9);
        }

        .footer-links a {
          display: block;
          font-size: 15px;
          margin-bottom: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition:
            color 0.3s ease,
            transform 0.2s ease;
        }

        .footer-links a:hover {
          color: #ffffff;
          transform: translateX(5px);
        }

        .footer-bottom {
          max-width: 1280px;
          margin: 60px auto 0;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          position: relative;
          z-index: 2;
          flex-wrap: wrap;
          gap: 20px;
        }

        .bottom-left {
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .legal-links {
          display: flex;
          gap: 20px;
        }

        .legal-links a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          transition: color 0.3s;
        }

        .legal-links a:hover {
          color: #fff;
        }

        .bottom-right {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .payment-methods {
          display: flex;
          gap: 12px;
        }

        .payment-icon {
          font-size: 12px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .back-to-top {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #fff;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            background 0.3s,
            transform 0.3s;
        }

        .back-to-top:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .footer-container {
            grid-template-columns: 1fr;
            gap: 60px;
          }

          .footer-links {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }

          .bottom-left {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .bottom-right {
            width: 100%;
            justify-content: space-between;
          }
        }

        @media (max-width: 600px) {
          .footer-links {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .payment-methods {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </footer>
  );
}
