import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AnalyseTranscriptPage } from '../clinical-intelligence/AnalyseTranscriptPage';
import { AipFormulationPage } from '../clinical-intelligence/AipFormulationPage';
import {
  AppearanceSettingsPage,
  ClinicalIntelligenceSettingsPage,
  DataRetentionSettingsPage,
  RemoteSessionsSettingsPage,
  SecurityPrivacySettingsPage,
  SettingsHomePage,
} from '../clinical-intelligence/ClinicalIntelligenceSettingsPage';
import { ClientDetailPage, ClientsListPage } from '../clinical-intelligence/ClientsPage';
import { PainProtocolPage } from '../emdr/components/emdr-pain/PainProtocolPage';
import {
  ClinicalLibraryDetailPage,
  ClinicalLibraryPage,
} from '../emdr/components/practice/ClinicalLibraryPage';
import { EmdPage } from '../emdr/components/practice/EmdPage';
import { FloatbackPage } from '../emdr/components/practice/FloatbackPage';
import { FutureTemplatePage } from '../emdr/components/practice/FutureTemplatePage';
import { PracticeHomePage } from '../emdr/components/practice/PracticeHomePage';
import { ProtocolsPage } from '../emdr/components/practice/ProtocolsPage';
import { RecentEventsPage } from '../emdr/components/practice/RecentEventsPage';
import { RdiPage } from '../emdr/components/practice/RdiPage';
import { SafeCalmPage } from '../emdr/components/practice/SafeCalmPage';
import { StandardEmdrConsolePage } from '../emdr/components/practice/StandardEmdrConsolePage';
import { SessionCompanionPage } from '../emdr/components/SessionCompanion';
import { ResourcesPage } from '../emdr/help/ResourcesPage';
import { AboutPage } from '../routes/AboutPage';
import { AccountPage } from '../routes/AccountPage';
import { JoinPage } from '../routes/JoinPage';
import { LandingPage } from '../routes/LandingPage';
import { ToolsPage } from '../routes/ToolsPage';

function ClientDetailRoute() {
  const { clientId } = useParams<{ clientId: string }>();
  if (!clientId) return <Navigate to="/clients" replace />;
  return <ClientDetailPage clientId={clientId} />;
}

function AnalyseRoute() {
  const { clientId } = useParams<{ clientId: string }>();
  if (!clientId) return <Navigate to="/clients" replace />;
  return <AnalyseTranscriptPage clientId={clientId} />;
}

function AipFormulationRoute() {
  const { clientId } = useParams<{ clientId: string }>();
  if (!clientId) return <Navigate to="/clients" replace />;
  return <AipFormulationPage clientId={clientId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/practice" element={<PracticeHomePage />} />
        <Route path="/protocols" element={<ProtocolsPage />} />
        <Route path="/practice/standard" element={<StandardEmdrConsolePage />} />
        <Route path="/practice/safe-calm" element={<SafeCalmPage />} />
        <Route path="/practice/rdi" element={<RdiPage />} />
        <Route path="/practice/emd" element={<EmdPage />} />
        <Route path="/practice/floatback" element={<FloatbackPage />} />
        <Route path="/practice/future-template" element={<FutureTemplatePage />} />
        <Route path="/practice/recent-events" element={<RecentEventsPage />} />
        <Route path="/practice/library" element={<ClinicalLibraryPage />} />
        <Route path="/practice/library/:resourceId" element={<ClinicalLibraryDetailPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/session" element={<SessionCompanionPage />} />
        <Route path="/pain" element={<PainProtocolPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/settings" element={<SettingsHomePage />} />
        <Route path="/settings/clinical-intelligence" element={<ClinicalIntelligenceSettingsPage />} />
        <Route path="/settings/security" element={<SecurityPrivacySettingsPage />} />
        <Route path="/settings/data-retention" element={<DataRetentionSettingsPage />} />
        <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
        <Route path="/settings/remote-sessions" element={<RemoteSessionsSettingsPage />} />
        <Route path="/clients" element={<ClientsListPage />} />
        <Route path="/clients/:clientId" element={<ClientDetailRoute />} />
        <Route path="/clients/:clientId/clinical-intelligence" element={<AnalyseRoute />} />
        <Route path="/clients/:clientId/aip-formulation" element={<AipFormulationRoute />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/join/:roomId" element={<JoinPage />} />
        <Route path="/client/session/:roomId" element={<JoinPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
