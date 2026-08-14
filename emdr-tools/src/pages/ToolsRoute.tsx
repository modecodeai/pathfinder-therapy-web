import { useSearchParams } from 'react-router-dom';
import { ToolsPage } from './ToolsPage';
import { ClientViewPage } from './ClientViewPage';

export function ToolsRoute() {
  const [params] = useSearchParams();
  if (params.get('clientView') === '1') return <ClientViewPage />;
  return <ToolsPage />;
}
