import { Home, PlusCircle, Users, BarChart3, Users2, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();

  const navItems = [
    { icon: Home, label: 'Início', path: '/dashboard' },
    { icon: PlusCircle, label: 'Registrar', path: '/register' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    ...(role === 'owner'
      ? [
          { icon: Users2, label: 'Equipe', path: '/barbers' },
          { icon: BarChart3, label: 'Relatórios', path: '/reports' },
          { icon: Settings, label: 'Config', path: '/settings' },
        ]
      : [
          { icon: BarChart3, label: 'Relatórios', path: '/reports' },
        ]
    ),
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <motion.button
            key={item.path}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="w-6 h-6" strokeWidth={1.5} />
            <span className="text-xs">{item.label}</span>
            {isActive && (
              <motion.div
                layoutId="nav-dot"
                className="bottom-nav-dot"
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
