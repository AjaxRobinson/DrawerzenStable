import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const HeaderContainer = styled.header`
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border-color);
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  color: var(--dark-text);
  font-weight: 900;
  margin: 0;
  cursor: pointer;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1.5rem;
  align-items: center;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 70%;
    background: white;
    flex-direction: column;
    justify-content: flex-start;
    padding-top: 5rem;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    z-index: 999;

    &.open {
      transform: translateX(0);
    }
  }
`;

const NavLink = styled(Link)`
  color: ${props => (props.$active ? 'var(--blue-accent)' : 'var(--light-text)')};
  text-decoration: none;
  font-weight: ${props => (props.$active ? '700' : '500')};
  transition: color 0.2s;
  position: relative;

  &:hover {
    color: var(--blue-accent);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--blue-accent);
    transform: ${props => (props.$active ? 'scaleX(1)' : 'scaleX(0)')};
    transition: transform 0.3s ease;
  }

  @media (max-width: 768px) {
    font-size: 1.25rem;
    padding: 1rem 0;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: var(--border-color);

  div {
    height: 100%;
    background: var(--blue-accent);
    transition: width 0.3s ease;
  }
`;

const MobileStep = styled.div`
  display: none;
  text-align: center;
  padding: 0.5rem 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  background: white;
  border-bottom: 1px solid var(--border-color);

  @media (max-width: 768px) {
    display: block;
  }
`;

const LogoutButton = styled.button`
  background-color: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1rem;
  font-size: 0.9rem;

  &:hover {
    background-color: #c82333;
  }

  @media (max-width: 768px) {
    margin: 1rem 0;
    padding: 0.75rem 1.5rem;
    width: 80%;
  }
`;

const Hamburger = styled.div`
  display: none;
  flex-direction: column;
  cursor: pointer;
  z-index: 1000;

  span {
    height: 3px;
    width: 25px;
    background: var(--dark-text);
    margin: 4px 0;
    transition: 0.3s;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

export default function Header() {
  const { signOut } = useAuth();
  // In components that display images
//   const { user } = useAuth();
//   const [imageUrl, setImageUrl] = useState('');

//   useEffect(() => {
//   const loadImage = async () => {
//     if (user && imagePath) {
//       const result = await SupabaseService.getPrivateImageUrl(imagePath);
//       if (result.success) {
//         setImageUrl(result.publicUrl);
//       }
//     }
//   };
  
//   loadImage();
// }, [user, imagePath]);

  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const steps = [
    { path: '/', label: 'Upload', value: 0 },
    { path: '/layout', label: 'Layout', value: 25 },
    { path: '/review', label: 'Review', value: 50 },
    { path: '/checkout', label: 'Checkout', value: 75 },
  ];

  const currentStep = steps.find((step) => step.path === location.pathname) || steps[0];
  const currentIndex = steps.findIndex((step) => step.path === location.pathname) + 1;

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      <HeaderContainer>
        <HeaderContent>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo>Drawerzen</Logo>
          </Link>

          <Hamburger onClick={toggleMenu}>
            <span />
            <span />
            <span />
          </Hamburger>

          <Nav className={menuOpen ? 'open' : ''}>
            {steps.map((step, index) => (
              <NavLink
                key={step.path}
                to={step.path}
                $active={location.pathname === step.path ? 1 : 0}
                onClick={() => setMenuOpen(false)}
              >
                {index + 1}. {step.label}
              </NavLink>
            ))}
            <LogoutButton onClick={signOut}>Logout</LogoutButton>
          </Nav>
        </HeaderContent>
        <ProgressBar>
          <div style={{ width: `${currentStep.value}%` }} />
        </ProgressBar>
      </HeaderContainer>
      
      <MobileStep>
        Step {currentIndex} of {steps.length}
      </MobileStep>
    </>
  );
}