import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/session" element={<SessionCompanionPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/join/:roomId" element={<JoinPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
