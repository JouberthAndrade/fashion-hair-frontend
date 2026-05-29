import { Navigate } from 'react-router-dom';
import { LogOut, UserRound } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { ChangePasswordCard } from './ChangePasswordCard';

export function MyProfilePage() {
  const { user, isLoggingOut, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <PageHeader title="Meu perfil" description="Suas informações de acesso." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" /> Conta
            </CardTitle>
            <CardDescription>Informações básicas da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Função</p>
              <p className="font-medium">{user.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={() => logout()}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordCard userId={user.id} />
      </div>
    </>
  );
}
