import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [countdownInterval, setCountdownInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  useEffect(() => {
    if (!authLoading && user) {
      const destination = user.role === 'admin' ? '/admin' : '/';
      navigate(destination, { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  useEffect(() => {
    const checkLockStatus = async () => {
      if (email && validateEmail(email)) {
        try {
          const status = await authService.checkLockStatus(email);
          if (status.isLocked) {
            setIsLocked(true);
            setRemainingTime(status.remainingMinutes || 0);
            startCountdown(status.remainingMinutes || 0);
          } else {
            setIsLocked(false);
            setRemainingTime(0);
            if (countdownInterval) {
              clearInterval(countdownInterval);
              setCountdownInterval(null);
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status de bloqueio:', error);
        }
      }
    };

    const debounceTimer = setTimeout(() => {
      checkLockStatus();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [email]);

  const startCountdown = (minutes: number) => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }

    let remainingSeconds = minutes * 60;

    const interval = setInterval(() => {
      remainingSeconds--;

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setIsLocked(false);
        setRemainingTime(0);
        setCountdownInterval(null);
      } else {
        setRemainingTime(Math.ceil(remainingSeconds / 60));
      }
    }, 1000);

    setCountdownInterval(interval);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast.error(`Conta bloqueada. Aguarde ${remainingTime} minuto${remainingTime !== 1 ? 's' : ''}.`);
      return;
    }

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setIsLocked(false);
        setRemainingTime(0);
        if (countdownInterval) {
          clearInterval(countdownInterval);
          setCountdownInterval(null);
        }

        toast.success('Login realizado com sucesso!');
        
      } else {
        if (result.isLocked) {
          setIsLocked(true);
          const lockMinutes = result.remainingMinutes || 15;
          setRemainingTime(lockMinutes);
          startCountdown(lockMinutes);
          toast.error(`Conta bloqueada. Aguarde ${lockMinutes} minutos.`);
        } else if (result.remainingAttempts !== undefined && result.remainingAttempts > 0) {
          toast.error(
            `${result.error || 'Credenciais inválidas'} (${result.remainingAttempts} tentativa${result.remainingAttempts !== 1 ? 's' : ''} restante${result.remainingAttempts !== 1 ? 's' : ''})`
          );
        } else {
          toast.error(result.error || 'Erro ao fazer login. Tente novamente.');
        }
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Bem-vindo de volta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entre na sua conta para continuar
          </p>

          {isLocked && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 font-medium">
                Conta temporariamente bloqueada. Aguarde {remainingTime} minuto{remainingTime !== 1 ? 's' : ''}.
              </p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="seu@email.com"
                  disabled={loading || isLocked}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="••••••••"
                  disabled={loading || isLocked}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={loading || isLocked}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Lembrar-me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Esqueceu a senha?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || isLocked}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </span>
              ) : isLocked ? (
                <span className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Bloqueado ({remainingTime}min)
                </span>
              ) : (
                <span className="flex items-center">
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Criar conta gratuita
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;