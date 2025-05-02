import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/Home.css';
import { BarChart, PieChart, DollarSign, FileText } from 'lucide-react';

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      <div className="hero-section">
        <div className="hero-content">
          <h1>Track Your Expenses with Ease</h1>
          <p>Manage your personal finances, track expenses, and gain insights into your spending habits.</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/login" className="btn btn-secondary">Sign In</Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <DollarSign size={32} />
            </div>
            <h3>Expense Tracking</h3>
            <p>Record and categorize your daily expenses with ease.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <BarChart size={32} />
            </div>
            <h3>Visual Analytics</h3>
            <p>View your spending patterns with intuitive charts and graphs.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <PieChart size={32} />
            </div>
            <h3>Budget Management</h3>
            <p>Set budgets for different categories and track your progress.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <FileText size={32} />
            </div>
            <h3>Expense Reports</h3>
            <p>Generate and download detailed expense reports as PDF.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
