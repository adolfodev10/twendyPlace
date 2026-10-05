import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Fingerprint,
  Clock,
  LockIcon,
} from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  /* ------------------------------------------------------------
   *  Rota original (vinda do ProtectedRoute)
   * ---------------------------------------------------------- */
  const from = (location.state as { from?: { pathname: string } } | null)?.from
    ?.pathname;

  /* ------------------------------------------------------------
   *  Cleanup
   * ---------------------------------------------------------- */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  /* ------------------------------------------------------------
   *  Redirecionamento pós-login
   * ---------------------------------------------------------- */
  useEffect(() => {
    if (!authLoading && user) {
      const destination = from || (user.role === 'admin' ? '/admin' : '/');
      navigate(destination, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  /* ------------------------------------------------------------
   *  Countdown do bloqueio
   * ---------------------------------------------------------- */
  const startCountdown = (minutes: number) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    let remainingSeconds = minutes * 60;

    countdownIntervalRef.current = setInterval(() => {
      remainingSeconds--;

      if (remainingSeconds <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        if (isMountedRef.current) {
          setIsLocked(false);
          setRemainingTime(0);
        }
      } else {
        if (isMountedRef.current) {
          setRemainingTime(Math.ceil(remainingSeconds / 60));
        }
      }
    }, 1000);
  };

  /* ------------------------------------------------------------
   *  Check lock status (com debounce)
   * ---------------------------------------------------------- */
  useEffect(() => {
    const checkLockStatus = async () => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

      try {
        const status = await authService.checkLockStatus(email);
        if (!isMountedRef.current) return;

        if (status.isLocked) {
          setIsLocked(true);
          setRemainingTime(status.remainingMinutes || 0);
          startCountdown(status.remainingMinutes || 0);
        } else {
          setIsLocked(false);
          setRemainingTime(0);
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status de bloqueio:', error);
      }
    };

    const debounceTimer = setTimeout(checkLockStatus, 500);
    return () => clearTimeout(debounceTimer);
  }, [email]);

  /* ------------------------------------------------------------
   *  Submit
   * ---------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast.error(
        `Conta bloqueada. Aguarde ${remainingTime} minuto${remainingTime !== 1 ? 's' : ''}.`
      );
      return;
    }

    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setIsLocked(false);
        setRemainingTime(0);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        toast.success('Login realizado com sucesso!');
      } else {
        if (result.isLocked) {
          setIsLocked(true);
          const lockMinutes = result.remainingMinutes || 15;
          setRemainingTime(lockMinutes);
          startCountdown(lockMinutes);
          toast.error(`Conta bloqueada. Aguarde ${lockMinutes} minutos.`);
        } else if (
          result.remainingAttempts !== undefined &&
          result.remainingAttempts > 0
        ) {
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
      if (isMountedRef.current) setLoading(false);
    }
  };

  /* ------------------------------------------------------------
   *  Loading screen
   * ---------------------------------------------------------- */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
            <div className="relative w-14 h-14 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Verificando sessão...
          </p>
        </div>
      </div>
    );
  }

  if (user) return null;

  /* ------------------------------------------------------------
   *  Render
   * ---------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-stretch">
      {/* ==================== LADO ESQUERDO — BRANDING ==================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        {/* Blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-tight">
                Twendy Create
              </p>
              <p className="text-blue-200/60 text-xs">Painel Profissional</p>
            </div>
          </Link>

          {/* Conteúdo central */}
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-xs font-semibold text-blue-100 tracking-wide">
                PLATAFORMA TWENDY CREATE
              </span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Gerencie tudo em{' '}
              <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                um só lugar
              </span>
            </h1>

            <p className="mt-4 text-blue-100/70 text-sm xl:text-base leading-relaxed">
              Acesso seguro, controle total do catálogo, pedidos e clientes.
              Feito para escalar seu negócio.
            </p>

            {/* Features */}
            <div className="mt-10 space-y-3">
              {[
                {
                  icon: ShieldCheck,
                  text: 'Autenticação protegida com bloqueio inteligente',
                },
                {
                  icon: Fingerprint,
                  text: 'Controle de sessão e tentativas em tempo real',
                },
                {
                  icon: LockIcon,
                  text: 'Criptografia de ponta a ponta',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-blue-200" />
                  </div>
                  <p className="text-sm text-blue-100/80">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-blue-200/50">
            <p>© {new Date().getFullYear()} Twendy Create.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistema online</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== LADO DIREITO — FORMULÁRIO ==================== */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div>
                <p className="text-slate-900 font-bold text-lg tracking-tight">
                  Twendy Create
                </p>
                <p className="text-slate-500 text-xs">Painel Profissional</p>
              </div>
            </Link>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-200/50 p-7 sm:p-9">
              {/* Botão voltar */}
              <Link
                to="/"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-5"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Voltar para a loja
              </Link>

              {/* Header */}
              <div className="mb-7">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Bem-vindo de volta
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Entre com suas credenciais para continuar
                </p>
              </div>

              {/* Alerta de bloqueio */}
              {isLocked && (
                <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/70 flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm shadow-red-200">
                    <AlertCircle className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-800">
                      Conta temporariamente bloqueada
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      Aguarde{' '}
                      <span className="font-bold">
                        {remainingTime} minuto{remainingTime !== 1 ? 's' : ''}
                      </span>{' '}
                      antes de tentar novamente.
                    </p>
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-bold text-slate-700 mb-1.5 tracking-wider uppercase"
                  >
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white/60 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="seu@email.com"
                      disabled={loading || isLocked}
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-bold text-slate-700 mb-1.5 tracking-wider uppercase"
                  >
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white/60 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                      disabled={loading || isLocked}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={loading || isLocked}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label
                    htmlFor="remember-me"
                    className="flex items-center gap-2 cursor-pointer group select-none"
                  >
                    <div className="relative">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading || isLocked}
                        className="peer sr-only"
                      />
                      <div className="w-4 h-4 rounded-md border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/20 transition-all flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
                      Lembrar-me
                    </span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-all"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                {/* Botão */}
                <button
                  type="submit"
                  disabled={loading || isLocked}
                  className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Entrando...
                    </>
                  ) : isLocked ? (
                    <>
                      <Clock className="w-4 h-4" />
                      Bloqueado ({remainingTime}min)
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative pt-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400 font-medium">
                      ou
                    </span>
                  </div>
                </div>

                {/* Register link */}
                <p className="text-center text-sm text-slate-600">
                  Não tem uma conta?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-all"
                  >
                    Criar conta gratuita
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Trust footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conexão segura e criptografada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;