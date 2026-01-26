
import React, { useState, useCallback, useEffect } from 'react';
import { Search, MapPin, Download, RefreshCw, AlertCircle, ExternalLink, Star, List, BarChart3, Info } from 'lucide-react';
import { geminiService } from './services/geminiService';
import { PlaceResult, SearchState, GeolocationData } from './types';

// Components defined outside main App for performance and clean architecture
const Header: React.FC = () => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <MapPin className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">MapScraper <span className="text-blue-600">AI</span></h1>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Pricing</a>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-all">
          Get Started
        </button>
      </nav>
    </div>
  </header>
);

const SearchHero: React.FC<{
  onSearch: (q: string) => void;
  isLoading: boolean;
}> = ({ onSearch, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) onSearch(inputValue);
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-blue-50 to-transparent">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Extract Market Insights from <span className="text-blue-600">Google Maps</span>
        </h2>
        <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          The most advanced AI-powered "scraping" tool for local business research. 
          Analyze competitors, find leads, and gather intelligence instantly.
        </p>
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g., 'Best dental clinics in Downtown Seattle' or 'Coffee shops in Brooklyn'..."
              className="w-full pl-12 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-blue-100/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

const PlaceCard: React.FC<{ place: PlaceResult }> = ({ place }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all flex flex-col h-full group">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{place.title}</h3>
      <a 
        href={place.uri} 
        target="_blank" 
        rel="noopener noreferrer"
        className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
      >
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
    
    {place.reviewSnippets && place.reviewSnippets.length > 0 && (
      <div className="space-y-3 mb-4 flex-grow">
        {place.reviewSnippets.map((snippet, idx) => (
          <div key={idx} className="flex gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl italic">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
            <p>"{snippet}"</p>
          </div>
        ))}
      </div>
    )}

    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Business Info</span>
      <div className="flex gap-2">
        <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded uppercase">Active</span>
        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">Verified</span>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    analysis: '',
    isLoading: false,
    error: null,
  });

  const [location, setLocation] = useState<GeolocationData | undefined>(undefined);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation access denied or unavailable", error);
        }
      );
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, query }));
    
    try {
      const data = await geminiService.searchPlaces(query, location);
      setState(prev => ({
        ...prev,
        isLoading: false,
        results: data.places,
        analysis: data.analysis,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "An unexpected error occurred",
      }));
    }
  }, [location]);

  const downloadResults = () => {
    const dataStr = JSON.stringify(state.results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'map_data_export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-grow">
        <SearchHero onSearch={handleSearch} isLoading={state.isLoading} />

        {state.error && (
          <div className="max-w-4xl mx-auto px-4 mb-8">
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700">
              <AlertCircle className="shrink-0" />
              <p className="font-medium">{state.error}</p>
            </div>
          </div>
        )}

        {(state.results.length > 0 || state.analysis) && (
          <div className="max-w-7xl mx-auto px-4 pb-20">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Analysis Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-fit">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">AI Market Analysis</h3>
                  </div>
                  <div className="prose prose-slate prose-sm leading-relaxed text-slate-600 space-y-4">
                    {state.analysis.split('\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                  <button 
                    onClick={downloadResults}
                    className="w-full mt-8 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold py-3 px-4 rounded-2xl transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export Data (JSON)
                  </button>
                </div>

                <div className="bg-blue-600 rounded-3xl p-8 text-white">
                  <h4 className="font-bold text-lg mb-2">Need live monitoring?</h4>
                  <p className="text-blue-100 text-sm mb-6">Upgrade to Pro to track business changes on Google Maps automatically.</p>
                  <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-2xl hover:bg-blue-50 transition-all">
                    Upgrade Now
                  </button>
                </div>
              </div>

              {/* Results Grid */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <List className="text-slate-400 w-5 h-5" />
                    <h3 className="text-xl font-bold text-slate-900">Found {state.results.length} Entities</h3>
                  </div>
                  <div className="text-sm text-slate-500 font-medium bg-white px-3 py-1 border border-slate-200 rounded-lg">
                    Sorted by Relevance
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {state.results.map((place, index) => (
                    <PlaceCard key={index} place={place} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!state.isLoading && state.results.length === 0 && !state.error && !state.query && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Search, title: "Intelligent Search", desc: "Our AI understands complex requests, from 'dental clinics with best implants' to 'quiet study cafes'." },
                { icon: BarChart3, title: "Market Analysis", desc: "Automatically summarize competition, pricing structures, and customer sentiment across regions." },
                { icon: Info, title: "Rich Metadata", desc: "Extract direct links, review highlights, and verified status for every lead discovered." }
              ].map((feature, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="text-slate-900 w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-3">{feature.title}</h4>
                  <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="text-blue-600 w-6 h-6 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">Scanning Google Maps...</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Extracting live data and performing competitive analysis using Gemini AI.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <MapPin className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-slate-900">MapScraper <span className="text-blue-600">AI</span></span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">API Status</a>
          </div>
          <p className="text-sm text-slate-400">© 2024 MapScraper AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
