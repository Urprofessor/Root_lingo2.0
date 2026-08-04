'use client';

import { useState } from 'react';
import { AuthGate } from '@/components/auth/AuthGate';
import SideRays from '@/components/effects/SideRays';
import { Sidebar } from '@/components/layout/Sidebar';
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
    <main className="app-dark relative min-h-screen text-ink-900">
      {/* 暗色底 + SideRays 背景 — 与登录页统一风格 */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 0%, #17171a 0%, #0c0c0e 62%)',
        }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <SideRays
          speed={2.5}
          rayColor1="#EAB308"
          rayColor2="#96c8ff"
          intensity={1.4}
          spread={2}
          origin="top-right"
          tilt={0}
          saturation={1.4}
          blend={0.75}
          falloff={1.7}
          opacity={0.55}
        />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1728px] overflow-hidden">
        <Sidebar activeView={activeView} onChange={setActiveView} />

        <section className="flex min-w-0 flex-1 flex-col bg-white">
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
