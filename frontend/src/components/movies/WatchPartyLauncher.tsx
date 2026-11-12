import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateWatchParty } from '@/hooks/useWatchParty';
import { ROUTES, buildRoute } from '@/lib/routes';
import { notify } from '@/components/ui/Toast';

export function WatchPartyLauncher({ movieId }: { movieId: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createParty = useCreateWatchParty();

  const handleCreate = () => {
    if (!user) {
      notify.info('Sign in to start a watch party');
      navigate(ROUTES.LOGIN);
      return;
    }
    createParty.mutate(movieId, {
      onSuccess: (party) => navigate(buildRoute.watchParty(party.code)),
      onError: () => notify.error('Could not start the watch party'),
    });
  };

  return (
    <Button size="sm" variant="secondary" icon={<Users size={14} />} onClick={handleCreate} loading={createParty.isPending}>
      Watch Party
    </Button>
  );
}
