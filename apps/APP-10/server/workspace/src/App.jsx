import React from 'react'
import { Sparkles, Zap, Code2 } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-500/20 rounded-2xl">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          Welcome to Aether
        </h1>
        
        <p className="text-xl text-slate-400">
          Your AI-powered development environment. Start building something amazing!
        </p>
        
        <div className="flex justify-center gap-4 pt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-300">Fast</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <Code2 className="w-4 h-4 text-green-400" />
            <span className="text-slate-300">Smart</span>
          </div>
        </div>
        
        <p className="text-sm text-slate-500 pt-8">
          Ask the AI to create components, pages, or entire applications.
        </p>
      </div>
    </div>
  )
}