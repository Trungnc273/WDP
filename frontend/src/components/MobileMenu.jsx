import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './MobileMenu.css';

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className="mobile-menu-toggle" onClick={toggleMenu}>
        <span className="hamburger-icon">☰</span>
      </button>

      {isOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu__header">
              <h3>Menu</h3>
              <button className="mobile-menu__close" onClick={toggleMenu}>
                ✕
              </button>
            </div>

            <div className="mobile-menu__content">
              <Link to="/" className="mobile-menu__item" onClick={toggleMenu}>
                🏠 Trang chủ
              </Link>
              <Link to="/products?category=vehicles" className="mobile-menu__item" onClick={toggleMenu}>
                🚗 Xe cộ
              </Link>
              <Link to="/products?category=property" className="mobile-menu__item" onClick={toggleMenu}>
                🏢 Bất động sản
              </Link>
              <Link to="/products?category=electronics" className="mobile-menu__item" onClick={toggleMenu}>
                📱 Đồ điện tử
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileMenu;
