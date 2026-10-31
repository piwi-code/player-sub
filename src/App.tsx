import { useState } from 'react';
import { RosterPage } from './components/RosterPage';
import { MatchPage } from './components/MatchPage';
import { UpdatePrompt } from './components/UpdatePrompt';

type Tab = 'match' | 'roster';

export function App() {
  const [tab, setTab] = useState<Tab>('match');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Player Sub</h1>
      </header>

      <main className="app-main">{tab === 'match' ? <MatchPage /> : <RosterPage />}</main>

      <nav className="tab-bar" aria-label="Main">
        <button className={tab === 'match' ? 'active' : ''} onClick={() => setTab('match')}>
          Match
        </button>
        <button className={tab === 'roster' ? 'active' : ''} onClick={() => setTab('roster')}>
          Players
        </button>
      </nav>

      <UpdatePrompt />
    </div>
  );
}
