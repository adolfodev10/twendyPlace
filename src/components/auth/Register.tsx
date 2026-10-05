import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Check,
  X,
  Building2,
  Hash,
  Gift,
  Zap,
  Users,
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return { score: 0, label: '', color: '', checks: [] as boolean[] };

    const checks = [
      pwd.length >= 6,
      /[A-Z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ];
    const score = checks.filter(Boolean).length;

    const labels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
    const colors = [
      'from-red-500 to-red-600',
      'from-orange-500 to-red-500',
      'from-amber-400 to-orange-500',
      'from-emerald-400 to-teal-500',
      'from-emerald-500 to-green-600',
    ];

    return { score, label: labels[score], color: colors[score], checks };
  }, [formData.password]);

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!acceptTerms) {
      toast.error('Você precisa aceitar os Termos de Serviço');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
      });

      if (result.success) {
        toast.success('Conta criada com sucesso!');
        navigate('/login');
      } else {
        toast.error(result.error || 'Erro ao criar conta');
      }
    } catch (error) {
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 flex items-stretch">
      {/* ==================== LADO ESQUERDO (BRANDING) ==================== */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-indigo-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <p className="text-white font-bold text-lg tracking-tight">Twendy Create</p>
              <p className="text-blue-200/60 text-xs">Painel Profissional</p>
            </div>
          </div>

          {/* Conteúdo central */}
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
              <Gift className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-xs font-semibold text-blue-100 tracking-wide">
                COMECE GRÁTIS
              </span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
              Crie sua conta e{' '}
              <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                comece agora
              </span>
            </h1>

            <p className="mt-4 text-blue-100/70 text-sm xl:text-base leading-relaxed">
              Sem cartão de crédito. Sem compromisso. Acesso imediato a todas as
              funcionalidades da plataforma.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { icon: Zap, text: 'Configuração em menos de 2 minutos' },
                { icon: ShieldCheck, text: 'Seus dados protegidos com criptografia' },
                { icon: Users, text: 'Suporte dedicado em português' },
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

      {/* ==================== LADO DIREITO (FORMULÁRIO) ==================== */}
      <div className="flex-1 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-10">
        <div className="w-full max-w-3xl">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <p className="text-slate-900 font-bold text-base tracking-tight">Twendy Create</p>
                <p className="text-slate-500 text-[11px]">Painel Profissional</p>
              </div>
            </div>
          </div>

          {/* Card do formulário */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
              {/* Header compacto */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 mb-2">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-700 tracking-wide">
                      NOVO POR AQUI?
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Criar sua conta
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Preencha os dados abaixo — leva menos de 2 minutos.
                  </p>
                </div>
              </div>

              <form className="space-y-3.5" onSubmit={handleSubmit}>
                {/* Linha 1: Nome + Email + Telefone (3 colunas) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    id="name"
                    label="NOME COMPLETO"
                    icon={User}
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    disabled={loading}
                  />
                  <FormField
                    id="email"
                    label="EMAIL"
                    icon={Mail}
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    disabled={loading}
                  />
                  <FormField
                    id="phone"
                    label="TELEFONE"
                    icon={Phone}
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+244 9XX XXX XXX"
                    disabled={loading}
                  />
                </div>

                {/* Linha 2: Senha + Confirmar (2 colunas) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Senha */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide"
                    >
                      SENHA <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Mínimo 6 caracteres"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        disabled={loading}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Força da senha — compacta */}
                    {formData.password && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${passwordStrength.color} transition-all duration-300`}
                              style={{
                                width: `${(passwordStrength.score / 4) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 min-w-[68px] text-right">
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { ok: passwordStrength.checks[0], label: '6+' },
                            { ok: passwordStrength.checks[1], label: 'A-Z' },
                            { ok: passwordStrength.checks[2], label: '0-9' },
                            { ok: passwordStrength.checks[3], label: '!@#' },
                          ].map((c, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md transition-colors ${
                                c.ok
                                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                  : 'bg-slate-50 text-slate-400'
                              }`}
                            >
                              {c.ok ? (
                                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                              ) : (
                                <X className="w-2.5 h-2.5" strokeWidth={3} />
                              )}
                              <span>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirmar senha */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide"
                    >
                      CONFIRMAR SENHA <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white/60 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                          formData.confirmPassword.length === 0
                            ? 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                            : passwordsMatch
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        }`}
                        placeholder="Repita a senha"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        disabled={loading}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                        aria-label={
                          showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword.length > 0 && (
                      <p
                        className={`mt-1.5 text-[10px] font-semibold flex items-center gap-1 ${
                          passwordsMatch ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {passwordsMatch ? (
                          <>
                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            As senhas coincidem
                          </>
                        ) : (
                          <>
                            <X className="w-2.5 h-2.5" strokeWidth={3} />
                            As senhas não coincidem
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Linha 3: Endereço + Cidade + Código Postal (3 colunas) */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                      ENDEREÇO (OPCIONAL)
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      id="address"
                      label="ENDEREÇO"
                      icon={MapPin}
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rua, número..."
                      disabled={loading}
                    />
                    <FormField
                      id="city"
                      label="CIDADE"
                      icon={Building2}
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Sua cidade"
                      disabled={loading}
                    />
                    <FormField
                      id="postalCode"
                      label="CÓDIGO POSTAL"
                      icon={Hash}
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="1234-567"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Termos */}
                <label
                  htmlFor="terms"
                  className="flex items-start gap-2.5 cursor-pointer group pt-1"
                >
                  <div className="relative mt-0.5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      disabled={loading}
                      className="peer sr-only"
                    />
                    <div className="w-4.5 h-4.5 rounded-md border-2 border-slate-300 peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/20 transition-all flex items-center justify-center">
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
                  <span className="text-xs text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors select-none">
                    Eu aceito os{' '}
                    <a
                      href="#"
                      className="font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2"
                    >
                      Termos de Serviço
                    </a>{' '}
                    e a{' '}
                    <a
                      href="#"
                      className="font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2"
                    >
                      Política de Privacidade
                    </a>
                  </span>
                </label>

                {/* Botão */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
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
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar minha conta
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>

                {/* Login link */}
                <p className="text-center text-xs text-slate-600">
                  Já tem uma conta?{' '}
                  <Link
                    to="/login"
                    className="font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-2 transition-all"
                  >
                    Faça login
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Trust footer */}
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Seus dados estão seguros e criptografados</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================ SUBCOMPONENTE ============================ */
interface FormFieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  icon: Icon,
  type = 'text',
  required = false,
  value,
  onChange,
  placeholder,
  disabled,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-[11px] font-semibold text-slate-700 mb-1 tracking-wide"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
      </div>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white/60 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  </div>
);

export default Register;