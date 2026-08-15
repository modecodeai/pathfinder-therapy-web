import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PainProtocolPage } from '../emdr/components/emdr-pain/PainProtocolPage';
import { ClinicalLibraryPage } from '../emdr/components/practice/ClinicalLibraryPage';
import { EmdPage } from '../emdr/components/practice/EmdPage';
import { FloatbackPage } from '../emdr/components/practice/FloatbackPage';
import { FutureTemplatePage } from '../emdr/components/practice/FutureTemplatePage';
import { PracticeHomePage } from '../emdr/components/practice/PracticeHomePage';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/practice" element={<PracticeHomePage />} />
        <Route path="/practice/standard" element={<StandardEmdrConsolePage />} />
        <Route path="/practice/safe-calm" element={<SafeCalmPage />} />
        <Route path="/practice/rdi" element={<RdiPage />} />
        <Route path="/practice/emd" element={<EmdPage />} />
        <Route path="/practice/floatback" element={<FloatbackPage />} />
        <Route path="/practice/future-template" element={<FutureTemplatePage />} />
        <Route path="/practice/recent-events" element={<RecentEventsPage />} />
        <Route path="/practice/library" element={<ClinicalLibraryPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/session" element={<SessionCompanionPage />} />
        <Route path="/pain" element={<PainProtocolPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/join/:roomId" element={<JoinPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
