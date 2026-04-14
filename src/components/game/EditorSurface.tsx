import Editor from "@monaco-editor/react";
import { Play } from "lucide-react";

interface EditorSurfaceProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function EditorSurface({ code, onChange, language, onLanguageChange, onSubmit, isSubmitting }: EditorSurfaceProps) {
  return (
    <div className="flex-1 flex flex-col relative relative">
      <div className="flex-none h-12 bg-[#1a1f2e] border-b border-[#2d3244] flex items-center justify-between px-4">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-dark-800 text-sm font-semibold text-white px-3 py-1.5 rounded-lg border border-dark-600 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-dark-500 transition-colors"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        <button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold py-1.5 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:shadow-none"
        >
          {isSubmitting ? (
             <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
          ) : (
             <Play className="w-4 h-4 fill-current" />
          )}
          {isSubmitting ? "Running..." : "Run Code"}
        </button>
      </div>

      <div className="flex-1 border-b border-[#2d3244]">
        <Editor
          key={language}
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            padding: { top: 20 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
}
