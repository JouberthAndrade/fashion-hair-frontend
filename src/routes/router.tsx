import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { AppLayout } from '@/components/shared/AppLayout';
import { RouteFallback } from '@/components/shared/RouteFallback';
import { useAuthStore } from '@/stores/authStore';

// Each route is split into its own chunk so the initial bundle stays small.
// We use named exports + a small adapter so React.lazy still gets a default-ish shape.
function lazyNamed<TName extends string, T>(
  loader: () => Promise<Record<TName, ComponentType<T>>>,
  name: TName,
) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[name] };
  });
}

const LoginPage = lazyNamed(() => import('@/features/auth/LoginPage'), 'LoginPage');
const MyAgendaPage = lazyNamed(
  () => import('@/features/appointments/MyAgendaPage'),
  'MyAgendaPage',
);
const ClientsPage = lazyNamed(() => import('@/features/clients/ClientsPage'), 'ClientsPage');
const ServicesPage = lazyNamed(
  () => import('@/features/services/ServicesPage'),
  'ServicesPage',
);
const CollaboratorsPage = lazyNamed(
  () => import('@/features/collaborators/CollaboratorsPage'),
  'CollaboratorsPage',
);
const UsersPage = lazyNamed(() => import('@/features/users/UsersPage'), 'UsersPage');
const CashClosingPage = lazyNamed(
  () => import('@/features/cash-closing/CashClosingPage'),
  'CashClosingPage',
);
const SalonDisplayPage = lazyNamed(
  () => import('@/features/dashboard/SalonDisplayPage'),
  'SalonDisplayPage',
);
const MyProfilePage = lazyNamed(
  () => import('@/features/profile/MyProfilePage'),
  'MyProfilePage',
);
const TutorialPage = lazyNamed(
  () => import('@/features/tutorial/TutorialPage'),
  'TutorialPage',
);
const PublicBookingPage = lazyNamed(
  () => import('@/features/public-booking/PublicBookingPage'),
  'PublicBookingPage',
);
const PublicBookingLayout = lazyNamed(
  () => import('@/features/public-booking/PublicBookingLayout'),
  'PublicBookingLayout',
);
const PrivacyPolicyPage = lazyNamed(
  () => import('@/features/public-booking/PrivacyPolicyPage'),
  'PrivacyPolicyPage',
);

function HomeRedirect() {
  const role = useAuthStore((s) => s.user?.role);
  if (!role) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'ADMIN' ? '/painel' : '/agenda'} replace />;
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  { path: '/login', element: withSuspense(<LoginPage />) },
  {
    element: withSuspense(<PublicBookingLayout />),
    children: [
      { path: '/agendar', element: withSuspense(<PublicBookingPage />) },
      { path: '/agendar/privacidade', element: withSuspense(<PrivacyPolicyPage />) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomeRedirect /> },
          { path: '/agenda', element: withSuspense(<MyAgendaPage />) },
          { path: '/clientes', element: withSuspense(<ClientsPage />) },
          { path: '/servicos', element: withSuspense(<ServicesPage />) },
          { path: '/colaboradores', element: withSuspense(<CollaboratorsPage />) },
          { path: '/painel', element: withSuspense(<SalonDisplayPage />) },
          { path: '/perfil', element: withSuspense(<MyProfilePage />) },
          { path: '/tutorial', element: withSuspense(<TutorialPage />) },
          {
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: '/usuarios', element: withSuspense(<UsersPage />) },
              { path: '/fechamento-caixa', element: withSuspense(<CashClosingPage />) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
