import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Lock, Mail, User, Store, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const SignupPage = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    barbershopName: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Nome, email e senha são obrigatórios');
      return;
    }
    
    setIsLoading(true);
    setError('');
    const result = await signUp(formData);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Erro ao criar conta');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background py-12">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover brightness-[0.25] contrast-[1.1]"
      >
        <source
          src="https://videos.pexels.com/video-files/3998188/3998188-hd_1080_1920_35fps.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/30 mb-4 animate-pulse-gold"
          >
            <Scissors className="w-8 h-8 gold-text" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-display text-foreground">
            Crie sua <span className="gold-text">Barbearia</span>
          </h1>
          <p className="text-muted-foreground text-base mt-2 tracking-body">
            Entre para o nível premium de gestão
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-surface p-8"
        >
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Name */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-ultra text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Nome Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Carlos Silva"
                className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground bg-secondary/50 focus:outline-none focus:bg-secondary focus:border-primary/50 transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-ultra text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email Profissional
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="exemplo@email.com"
                className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground bg-secondary/50 focus:outline-none"
              />
            </div>

            {/* Barbershop Name */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={formData.barbershopName}
                onChange={e => setFormData({ ...formData, barbershopName: e.target.value })}
                placeholder="Ex: Barbearia do Centro"
                className="w-full h-12 px-4 rounded-xl glass-input text-base text-foreground bg-secondary/50 focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground/60 pl-1 mt-1">
                Apenas para novos donos. Se você foi convidado, pode deixar em branco.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-ultra text-muted-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-12 pl-4 pr-12 rounded-xl glass-input text-base text-foreground bg-secondary/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground p-1 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.97 }}
              className="w-full h-14 mt-4 rounded-xl gold-gradient-btn text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Começar Agora
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma barbearia?{' '}
              <Link to="/login" className="gold-text font-bold hover:underline transition-all">
                Entre aqui
              </Link>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
