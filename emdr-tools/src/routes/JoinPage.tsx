import { useParams, useSearchParams } from 'react-router-dom';
import { ClientDisplayView } from '../emdr/components/ClientDisplayView';

export function JoinPage() {
  const { roomId = '' } = useParams();
  const [params] = useSearchParams();
  const displayMode = params.get('display') === '1';

  return <ClientDisplayView roomId={roomId} displayMode={displayMode} />;
}
