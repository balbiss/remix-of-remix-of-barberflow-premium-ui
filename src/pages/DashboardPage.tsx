import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSwitcher from '@/components/ProfileSwitcher';
import OwnerDashboard from '@/components/OwnerDashboard';
import BarberDashboard from '@/components/BarberDashboard';
import { LogOut } from 'lucide-react';

const DashboardPage = () => {
  const { user, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-ultra text-primary/60 font-medium">
              {user?.barbershopName}
            </p>
            <h1 className="text-2xl font-bold tracking-display text-foreground mt-0.5">
              Bem-vindo, <span className="gold-text">{user?.name.split(' ')[0]}</span>
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={logout}
            className="w-11 h-11 rounded-xl flex items-center justify-center border border-border"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </motion.button>
        </div>
        <ProfileSwitcher />
      </div>

      <motion.div
        key={role}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4"
      >
        {role === 'owner' ? <OwnerDashboard /> : <BarberDashboard />}
      </motion.div>
    </div>
  );
};

export default DashboardPage;
