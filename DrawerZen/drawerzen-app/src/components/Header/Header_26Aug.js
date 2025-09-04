import React from 'react';
import styled from 'styled-components';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
const HeaderContainer = styled.header`
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border-color);
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 1.75rem;
  color: var(--dark-text);
  font-weight: 900;
  margin: 0;
  cursor: pointer;
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: ${props => props.$active ? 'var(--blue-accent)' : 'var(--light-text)'};
  text-decoration: none;
  font-weight: ${props => props.$active ? '700' : '500'};
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
    transform: ${props => props.$active ? 'scaleX(1)' : 'scaleX(0)'};
    transition: transform 0.3s ease;
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
  
  @media (max-width: 768px) {
    display: block;
    font-size: 0.875rem;
    color: #6b7280;
  }
`;
const LogoutButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 1rem;

  &:hover {
    background-color: #c82333;
  }
`;

export default function Header() {
    const { signOut } = useAuth();
  const location = useLocation();
  
  const steps = [
    { path: '/', label: 'Upload', value: 0 },
    { path: '/layout', label: 'Layout', value: 25 },
    { path: '/review', label: 'Review', value: 50 },
    { path: '/checkout', label: 'Checkout', value: 75 }
  ];
  
  const currentStep = steps.find(step => step.path === location.pathname) || steps[0];
  const currentIndex = steps.findIndex(step => step.path === location.pathname) + 1;

  return (
    <HeaderContainer>
      <HeaderContent>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo>Drawerzen</Logo>
        </Link>
        <Nav>
          {steps.map((step, index) => (
            <NavLink 
              key={step.path} 
              to={step.path}
              $active={location.pathname === step.path ? 1 : 0}
            >
              {index + 1}. {step.label}
            </NavLink>
          ))}
          <LogoutButton onClick={signOut}>
          Logout
        </LogoutButton>
        </Nav>
        <MobileStep>
          Step {currentIndex} of {steps.length}
        </MobileStep>
      </HeaderContent>
      <ProgressBar>
        <div style={{ width: `${currentStep.value}%` }} />
      </ProgressBar>
    </HeaderContainer>
  );
}