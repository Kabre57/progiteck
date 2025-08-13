import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
// Utilisation du chemin public pour le logo (Vite)
const logo = '/images/logo.jpeg';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@ProgiTeck.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled by the auth hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col items-center">
            {/* Nouveau design avec logo */}
            <div className="mb-8 flex flex-col items-center space-y-4">
              <img 
                src={logo} 
                alt="Logo ProgiTeck" 
                className="w-24 h-24 object-contain rounded-full border-4 border-white shadow-lg hover:scale-105 transition-transform duration-300"
              />
              <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ProgiTeck
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Solution technique innovante
                </p>
              </div>
            </div>
            
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
              Connexion à votre espace
            </h2>
            <p className="text-center text-gray-600 mb-6 text-sm">
              Entrez vos identifiants pour accéder au tableau de bord
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Adresse email
                </label>
                <div className="relative transition-all duration-300 group-hover:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-12 py-3 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                  Mot de passe
                </label>
                <div className="relative transition-all duration-300 group-hover:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-12 py-3 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Se connecter</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}