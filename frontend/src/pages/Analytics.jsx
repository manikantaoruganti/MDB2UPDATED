import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp,
  ArrowLeft,
  Map,
  Plane,
  Globe,
  Building2,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('airports');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (tab) {
        case 'airports':
          endpoint = '/analytics/busiest-airports?limit=15';
          break;
        case 'airlines':
          endpoint = '/analytics/top-airlines?limit=15';
          break;
        case 'routes':
          endpoint = '/analytics/popular-routes?limit=15';
          break;
        case 'countries':
          endpoint = '/analytics/airports-by-country?limit=20';
          break;
        default:
          endpoint = '/analytics/busiest-airports?limit=15';
      }
      const response = await axios.get(`${API}${endpoint}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8 fade-in">
          <Link
            to="/"
            className="mr-4 p-2 glass rounded-xl hover:scale-105 transition-transform"
            data-testid="back-to-home-btn"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-slate-400">
              Explore aviation data insights and trends
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 fade-in" data-testid="analytics-tabs">
          <TabButton
            active={activeTab === 'airports'}
            onClick={() => setActiveTab('airports')}
            icon={<Map className="w-5 h-5" />}
            label="Busiest Airports"
            testId="tab-airports"
          />
          <TabButton
            active={activeTab === 'airlines'}
            onClick={() => setActiveTab('airlines')}
            icon={<Plane className="w-5 h-5" />}
            label="Top Airlines"
            testId="tab-airlines"
          />
          <TabButton
            active={activeTab === 'routes'}
            onClick={() => setActiveTab('routes')}
            icon={<TrendingUp className="w-5 h-5" />}
            label="Popular Routes"
            testId="tab-routes"
          />
          <TabButton
            active={activeTab === 'countries'}
            onClick={() => setActiveTab('countries')}
            icon={<Globe className="w-5 h-5" />}
            label="By Country"
            testId="tab-countries"
          />
        </div>

        {/* Content */}
        <div className="fade-in">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="glass rounded-3xl p-8" data-testid="analytics-content">
              {activeTab === 'airports' && <AirportsTable data={data} />}
              {activeTab === 'airlines' && <AirlinesTable data={data} />}
              {activeTab === 'routes' && <RoutesTable data={data} />}
              {activeTab === 'countries' && <CountriesTable data={data} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label, testId }) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
        : 'glass text-slate-400 hover:text-white'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const AirportsTable = ({ data }) => (
  <div className="overflow-x-auto" data-testid="airports-table">
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-slate-700">
          <th className="pb-4 text-slate-400 font-semibold">Rank</th>
          <th className="pb-4 text-slate-400 font-semibold">Airport</th>
          <th className="pb-4 text-slate-400 font-semibold">City</th>
          <th className="pb-4 text-slate-400 font-semibold">Country</th>
          <th className="pb-4 text-slate-400 font-semibold">IATA</th>
          <th className="pb-4 text-slate-400 font-semibold text-right">
            Routes
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr
            key={index}
            className="border-b border-slate-800 hover:bg-white/5 transition-colors"
            data-testid={`airport-row-${index}`}
          >
            <td className="py-4 text-blue-400 font-bold">{index + 1}</td>
            <td className="py-4">{item.name}</td>
            <td className="py-4 text-slate-400">{item.city}</td>
            <td className="py-4 text-slate-400">{item.country}</td>
            <td className="py-4">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-mono">
                {item.iata}
              </span>
            </td>
            <td className="py-4 text-right font-semibold">
              {item.routes?.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AirlinesTable = ({ data }) => (
  <div className="overflow-x-auto" data-testid="airlines-table">
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-slate-700">
          <th className="pb-4 text-slate-400 font-semibold">Rank</th>
          <th className="pb-4 text-slate-400 font-semibold">Airline</th>
          <th className="pb-4 text-slate-400 font-semibold">IATA</th>
          <th className="pb-4 text-slate-400 font-semibold">Country</th>
          <th className="pb-4 text-slate-400 font-semibold text-right">
            Routes
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr
            key={index}
            className="border-b border-slate-800 hover:bg-white/5 transition-colors"
            data-testid={`airline-row-${index}`}
          >
            <td className="py-4 text-purple-400 font-bold">{index + 1}</td>
            <td className="py-4">{item.name}</td>
            <td className="py-4">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-mono">
                {item.iata || 'N/A'}
              </span>
            </td>
            <td className="py-4 text-slate-400">{item.country}</td>
            <td className="py-4 text-right font-semibold">
              {item.routes?.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RoutesTable = ({ data }) => (
  <div className="overflow-x-auto" data-testid="routes-table">
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-slate-700">
          <th className="pb-4 text-slate-400 font-semibold">Rank</th>
          <th className="pb-4 text-slate-400 font-semibold">Route</th>
          <th className="pb-4 text-slate-400 font-semibold">From</th>
          <th className="pb-4 text-slate-400 font-semibold">To</th>
          <th className="pb-4 text-slate-400 font-semibold text-right">
            Airlines
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr
            key={index}
            className="border-b border-slate-800 hover:bg-white/5 transition-colors"
            data-testid={`route-row-${index}`}
          >
            <td className="py-4 text-pink-400 font-bold">{index + 1}</td>
            <td className="py-4">
              <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-sm font-mono">
                {item.source} → {item.dest}
              </span>
            </td>
            <td className="py-4 text-slate-400">{item.source_name}</td>
            <td className="py-4 text-slate-400">{item.dest_name}</td>
            <td className="py-4 text-right font-semibold">
              {item.airlines?.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CountriesTable = ({ data }) => (
  <div className="overflow-x-auto" data-testid="countries-table">
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-slate-700">
          <th className="pb-4 text-slate-400 font-semibold">Rank</th>
          <th className="pb-4 text-slate-400 font-semibold">Country</th>
          <th className="pb-4 text-slate-400 font-semibold text-right">
            Airports
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr
            key={index}
            className="border-b border-slate-800 hover:bg-white/5 transition-colors"
            data-testid={`country-row-${index}`}
          >
            <td className="py-4 text-cyan-400 font-bold">{index + 1}</td>
            <td className="py-4">{item.country}</td>
            <td className="py-4 text-right font-semibold">
              {item.airports?.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Analytics;
