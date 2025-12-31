import React, { useState } from 'react';
import { usePitchEngine } from './hooks/usePitchEngine';

const VocaScanTuner: React.FC = () => {
  const {
    isRunning,
    pitch,
    note,
    confidence,
    diagnosis,
    status,
    error,
    start,
    stop
  } = usePitchEngine();

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStop = async () => {
    setIsAnalyzing(true);
    try {
      await stop();
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center font-sans text-gray-800">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">

        {/* --- Header --- */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent italic">
            VocaScan Tuner V2
          </h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">
            Professional Pitch Analyzer
          </p>
        </header>

        {/* --- リアルタイム表示 --- */}
        <div className={`relative overflow-hidden transition-all duration-500 rounded-2xl mb-8 p-10 flex flex-col items-center justify-center ${
          isRunning ? 'bg-blue-50 ring-4 ring-blue-100' : 'bg-gray-50'
        }`}>
          <div className="text-7xl font-mono font-black text-gray-800 tracking-tighter">
            {note || "--"}
          </div>
          <div className="text-lg font-medium text-blue-500 mt-2">
            {pitch ? `${pitch.toFixed(1)} Hz` : "--- Hz"}
          </div>

          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all duration-150"
              style={{ width: `${(confidence * 100).toFixed(0)}%` }}
            />
          </div>
        </div>

        {/* --- 操作ボタン --- */}
        <div className="flex flex-col items-center gap-4">
          {!isRunning ? (
            <button
              onClick={start}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="text-2xl">●</span> 診断スタート
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={isAnalyzing}
              className={`w-full py-4 text-white rounded-2xl font-bold text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
                isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 animate-pulse'
              }`}
            >
              {isAnalyzing ? "解析中..." : "停止して解析"}
            </button>
          )}
        </div>

        {/* --- 診断結果 --- */}
        <div className="mt-10 pt-8 border-t border-gray-100">

          {/* エラー */}
          {status === "error" && (
            <div className="text-center text-red-500 font-bold py-6">
              {error || "解析に失敗しました"}
            </div>
          )}

          {/* 成功 */}
          {status === "success" && diagnosis && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-800">📊 診断リポート</h3>
                <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full">DONE</span>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl text-white shadow-lg shadow-blue-200">
                  <p className="text-xs font-bold opacity-70 mb-1 uppercase tracking-widest">Total Score</p>
                  <div className="flex items-baseline">
                    <span className="text-6xl font-black">{diagnosis.score}</span>
                    <span className="text-xl font-bold ml-1 opacity-80">pts</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Pitch Avg</p>
                    <p className="text-xl font-bold text-gray-700">{diagnosis.pitch.toFixed(1)} Hz</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Stability</p>
                    <p className="text-xl font-bold text-gray-700">{(diagnosis.stability * 100).toFixed(0)}%</p>
                  </div>
                </div>

                {diagnosis.message && (
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-700 text-sm font-medium">
                    “ {diagnosis.message} ”
                  </div>
                )}
              </div>
            </div>
          )}

          {/* プレースホルダー */}
          {(status === "idle" || status === "running" || status === "loading") && !diagnosis && (
            <div className="text-center py-10 px-4 rounded-3xl border-2 border-dashed border-gray-100">
              {status === "loading" ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-blue-500 font-bold">データを解析しています...</p>
                </div>
              ) : (
                <p className="text-gray-300 text-sm font-medium leading-relaxed px-6">
                  ※停止ボタンを押すと、ここに<br />詳細な診断リポートが表示されます。
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      <footer className="mt-8 text-gray-400 text-[10px] font-bold tracking-widest uppercase">
        &copy; 2025 VOCA-NICAL AI ENGINE
      </footer>
    </div>
  );
};

export default VocaScanTuner;
