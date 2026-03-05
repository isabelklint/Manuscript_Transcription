import React, { useState } from 'react';
import ArronaApp from './ArronaApp';
import CuadernoApp from './CuadernoApp';

type ActiveApp = 'arrona' | 'cuaderno';

const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<ActiveApp>('arrona');

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <nav className="flex items-center gap-0 bg-slate-900 border-b border-slate-800 shrink-0 px-4">
        <div className="flex items-center gap-2 mr-6 py-2">
          <i className="fa-solid fa-feather-pointed text-blue-400 text-xs"></i>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TEI Workspace</span>
        </div>
        <button
          onClick={() => setActiveApp('arrona')}
          className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${
            activeApp === 'arrona'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Arrona 1796
        </button>
        <button
          onClick={() => setActiveApp('cuaderno')}
          className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${
            activeApp === 'cuaderno'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Cuaderno 1827
        </button>
      </nav>
      <div className="flex-1 overflow-hidden">
        {activeApp === 'arrona' ? <ArronaApp /> : <CuadernoApp />}
      </div>
    </div>
  );
};

export default App;
