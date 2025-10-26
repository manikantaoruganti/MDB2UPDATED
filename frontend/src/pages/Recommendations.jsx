import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search, Plane, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Recommendations = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!source || !destination) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(
        `${API}/recommendations/similar-routes?source=${source}&destination=${destination}&top_k=15`
      );
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
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
              Route Recommendations
            </h1>
            <p className="text-slate-400">
              Find similar routes using AI-powered vector similarity
            </p>
          </div>
        </div>

        {/* Search Form */}
        <div className="glass rounded-3xl p-8 mb-8 fade-in" data-testid="search-form">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400">
                  Source Airport (IATA)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., JFK, LAX, LHR"
                  value={source}
                  onChange={(e) => setSource(e.target.value.toUpperCase())}
                  maxLength={3}
                  data-testid="source-input"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-400">
                  Destination Airport (IATA)
                </label>
                <Input
                  type="text"
                  placeholder="e.g., SFO, ORD, CDG"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.toUpperCase())}
                  maxLength={3}
                  data-testid="destination-input"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full btn-primary h-12"
              disabled={!source || !destination || loading}
              data-testid="search-btn"
            >
              <Search className="w-5 h-5 mr-2" />
              {loading ? 'Searching...' : 'Find Similar Routes'}
            </Button>
          </form>
        </div>

        {/* Info Box */}
        <div className="glass rounded-2xl p-6 mb-8 fade-in">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold mb-2">How it works</h3>
              <p className="text-sm text-slate-400">
                Our AI engine uses TF-IDF vectorization and cosine similarity to
                find routes similar to your search. The similarity score
                indicates how closely related each route is to your query based
                on route patterns and characteristics.
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner" />
          </div>
        )}

        {!loading && searched && recommendations.length > 0 && (
          <div className="fade-in" data-testid="recommendations-results">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">
                Similar Routes ({recommendations.length})
              </h2>
            </div>
            <div className="grid gap-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="glass rounded-2xl p-6 hover:scale-[1.02] transition-transform"
                  data-testid={`recommendation-${index}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-4xl font-bold text-blue-400">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-4 py-1 bg-blue-500/20 text-blue-400 rounded-full font-mono font-semibold">
                            {rec.source}
                          </span>
                          <Plane className="w-5 h-5 text-slate-500" />
                          <span className="px-4 py-1 bg-purple-500/20 text-purple-400 rounded-full font-mono font-semibold">
                            {rec.dest}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400">
                          Airline: {rec.airline || 'Various'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400 mb-1">
                        Similarity
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {(rec.similarity * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && searched && recommendations.length === 0 && (
          <div
            className="glass rounded-2xl p-12 text-center fade-in"
            data-testid="no-results"
          >
            <Plane className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No routes found</h3>
            <p className="text-slate-400">
              Try different airport codes or check if they exist in our database
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
