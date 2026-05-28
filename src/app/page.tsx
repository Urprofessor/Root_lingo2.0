'use client';

import { useState } from 'react';
import { AuthGate } from '@/components/auth/AuthGate';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { InputPanel } from '@/components/input-panel/InputPanel';
import { SettingsPanel } from '@/components/settings-panel/SettingsPanel';
import { OutputPanel } from '@/components/output-panel/OutputPanel';
import { GlossaryPage } from '@/components/pages/GlossaryPage';
import { PromptTemplatePage } from '@/components/pages/PromptTemplatePage';
import { TipsLocalizationPage } from '@/components/pages/TipsLocalizationPage';
import { ExcelTranslatePage } from '@/components/pages/ExcelTranslatePage';
import { AccountPage } from '@/components/pages/AccountPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import type { ActiveView } from '@/types/view';

export default function HomePage() {
  return (
    <AuthGate>
      <AuthenticatedApp />
    </AuthGate>
  );
}

function AuthenticatedApp() {
  const [activeView, setActiveView] = useState<ActiveView>('workspace');

  return (
    <main className="min-h-screen bg-ink-100 text-ink-900">
      <div className="mx-auto flex min-h-screen max-w-[1728px] overflow-hidden">
        <Sidebar activeView={activeView} onChange={setActiveView} />

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <Header onNavigate={setActiveView} />

          <div className="flex-1 overflow-hidden">
            {activeView === 'workspace' && <Workspace />}
            {activeView === 'tips' && <TipsLocalizationPage />}
            {activeView === 'excel' && (
              <div className="h-full overflow-y-auto">
                <ExcelTranslatePage />
              </div>
            )}
            {activeView === 'glossary' && <GlossaryPage />}
            {activeView === 'templates' && <PromptTemplatePage />}
            {activeView === 'api-keys' && <AccountPage />}
            {activeView === 'settings' && <SettingsPage />}
          </div>

          <Footer />
        </section>
      </div>
    </main>
  );
}

function Workspace() {
  return (
    <div className="grid h-full grid-cols-[1.05fr_1.1fr_1.1fr] overflow-hidden">
      <InputPanel />
      <SettingsPanel />
      <OutputPanel />
    </div>
  );
}
