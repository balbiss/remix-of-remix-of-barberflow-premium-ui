import { motion } from 'framer-motion';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Crown, Scissors } from 'lucide-react';

const ProfileSwitcher = () => {
  const { role, switchRole } = useAuth();

  const options: { value: UserRole; label: string; icon: React.ReactNode }[] = [
    { value: 'owner', label: 'Dono', icon: <Crown className="w-4 h-4" strokeWidth={1.5} /> },
    { value: 'barber', label: 'Barbeiro', icon: <Scissors className="w-4 h-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="flex rounded-xl border border-border bg-secondary p-1 gap-1">
      {options.map((opt) => (
        <motion.button
          key={opt.value}
          whileTap={{ scale: 0.95 }}
          onClick={() => switchRole(opt.value)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            role === opt.value
              ? 'gold-gradient-btn'
              : 'text-muted-foreground'
          }`}
        >
          {opt.icon}
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
};

export default ProfileSwitcher;
