import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plane, TrendingUp, Map, Globe } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/analytics/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <div className="flex items-center justify-center mb-6">
            <Plane className="w-16 h-16 text-blue-400 mr-4" />
            <h1 className="text-6xl font-bold gradient-text">
              Flight Analytics
            </h1>
          </div>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Discover flight routes, analyze aviation data, and get AI-powered
            recommendations using vector similarity search
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 fade-in">
            <StatCard
              icon={<Map className="w-8 h-8" />}
              title="Airports"
              value={stats?.total_airports?.toLocaleString() || '0'}
              color="blue"
              testId="stat-airports"
            />
            <StatCard
              icon={<Plane className="w-8 h-8" />}
              title="Airlines"
              value={stats?.total_airlines?.toLocaleString() || '0'}
              color="purple"
              testId="stat-airlines"
            />
            <StatCard
              icon={<TrendingUp className="w-8 h-8" />}
              title="Routes"
              value={stats?.total_routes?.toLocaleString() || '0'}
              color="pink"
              testId="stat-routes"
            />
            <StatCard
              icon={<Globe className="w-8 h-8" />}
              title="Countries"
              value={stats?.total_countries?.toLocaleString() || '0'}
              color="cyan"
              testId="stat-countries"
            />
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in">
          <Link to="/analytics">
            <div
              className="glass rounded-3xl p-8 cursor-pointer"
              data-testid="analytics-card"
            >
              <TrendingUp className="w-12 h-12 text-blue-400 mb-4" />
              <h2 className="text-2xl font-bold mb-3">Analytics Dashboard</h2>
              <p className="text-slate-400 mb-6">
                Explore busiest airports, top airlines, popular routes, and more
                with interactive visualizations
              </p>
              <button className="btn-primary" data-testid="view-analytics-btn">
                View Analytics →
              </button>
            </div>
          </Link>

          <Link to="/recommendations">
            <div
              className="glass rounded-3xl p-8 cursor-pointer"
              data-testid="recommendations-card"
            >
              <Plane className="w-12 h-12 text-purple-400 mb-4" />
              <h2 className="text-2xl font-bold mb-3">Route Recommendations</h2>
              <p className="text-slate-400 mb-6">
                Get AI-powered route suggestions using TF-IDF vector embeddings
                and cosine similarity
              </p>
              <button
                className="btn-primary"
                data-testid="find-routes-btn"
              >
                Find Routes →
              </button>
            </div>
          </Link>
        </div>

        {/* Tech Info */}
        <div className="mt-16 glass rounded-2xl p-8 fade-in">
          <h3 className="text-2xl font-bold mb-6 text-center">Technology Stack</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-blue-400 font-semibold mb-2">Database</div>
              <p className="text-sm text-slate-400">
                MongoDB with vector embeddings for similarity search
              </p>
            </div>
            <div className="text-center">
              <div className="text-purple-400 font-semibold mb-2">
                Machine Learning
              </div>
              <p className="text-sm text-slate-400">
                TF-IDF vectorization with cosine similarity ranking
              </p>
            </div>
            <div className="text-center">
              <div className="text-pink-400 font-semibold mb-2">Data Source</div>
              <p className="text-sm text-slate-400">
                OpenFlights dataset: 7,698 airports, 67,240 routes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color, testId }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
    purple:
      'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
    pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400',
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400',
  };

  return (
    <div
      className={`stat-card glass rounded-2xl p-6 bg-gradient-to-br ${colorClasses[color]} border`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/20`}>{icon}</div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-slate-400">{title}</p>
        <p
          className={`text-3xl font-bold ${colorClasses[color].split(' ')[2]}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
