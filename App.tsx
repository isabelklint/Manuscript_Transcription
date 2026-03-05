import React, { useState } from 'react';
import ArronaApp from './ArronaApp';
import CuadernoApp from './CuadernoApp';

type ActiveTool = 'arrona' | 'cuaderno';

const App: React.FC = () => {
  const [active, setActive] = useState<ActiveTool>('arrona');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900">
      <header className="shrink-0 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-6 py-0 z-50">
        <div className="flex items-center gap-4">
          <div className="py-3">
            <h1 className="text-sm font-black tracking-tight text-white uppercase">
              TEI <span className="text-blue-400">Manuscript</span> Workspace
            </h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              Lancaster University · Isabel Klint · PGCERT Corpus Linguistics
            </p>
          </div>
          <div className="h-8 w-px bg-slate-700 mx-2"></div>
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActive('arrona')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                active === 'arrona'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${active === 'arrona' ? 'bg-blue-300' : 'bg-slate-600'}`}></div>
              Arrona 1796
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${active === 'arrona' ? 'bg-blue-500/50 text-blue-200' : 'bg-slate-700 text-slate-500'}`}>
                Vocabulario
              </span>
            </button>
            <button
              onClick={() => setActive('cuaderno')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                active === 'cuaderno'
                  ? 'bg-rose-700 text-white shadow-lg shadow-rose-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${active === 'cuaderno' ? 'bg-rose-300' : 'bg-slate-600'}`}></div>
              Cuaderno 1827
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${active === 'cuaderno' ? 'bg-rose-600/50 text-rose-200' : 'bg-slate-700 text-slate-500'}`}>
                Phrase List
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
            active === 'arrona'
              ? 'border-blue-800 bg-blue-900/30 text-blue-400'
              : 'border-rose-900 bg-rose-900/30 text-rose-400'
          }`}>
            {active === 'arrona' ? (
              <><i className="fa-solid fa-table-columns text-[8px]"></i> Double-column lexicon</>
            ) : (
              <><i className="fa-solid fa-list text-[8px]"></i> Single-column phrasebook</>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-200 ${active === 'arrona' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <ArronaApp />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${active === 'cuaderno' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'}`}>
          <CuadernoApp />
        </div>
      </div>
    </div>
  );
};

export default App;
