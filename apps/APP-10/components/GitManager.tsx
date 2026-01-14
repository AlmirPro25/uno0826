import React, { useState, useEffect } from 'react';
import { GitBranch, GitCommit, UploadCloud, DownloadCloud, RefreshCw, Check, AlertCircle, Plus, Trash2, Settings, Github } from 'lucide-react';
import { WebContainerService } from '../services/webcontainer';
import { useStore } from '../store';

export const GitManager: React.FC = () => {
  const { isWcBooted } = useStore();
  const [isRepoInitialized, setIsRepoInitialized] = useState(false);
  const [statusFiles, setStatusFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Remote Config
  const [remoteUrl, setRemoteUrl] = useState('');
  const [token, setToken] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isWcBooted) {
      checkGitStatus();
    }
  }, [isWcBooted]);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const checkGitStatus = async () => {
    if (!isWcBooted) return;
    
    // Check if .git exists
    const { exitCode } = await WebContainerService.exec('ls', ['.git']);
    if (exitCode !== 0) {
      setIsRepoInitialized(false);
      return;
    }

    setIsRepoInitialized(true);
    setIsLoading(true);
    
    try {
      const { output } = await WebContainerService.exec('git', ['status', '--porcelain']);
      const lines = output.split('\n').filter(line => line.trim() !== '');
      
      const parsedFiles = lines.map(line => {
        const code = line.substring(0, 2);
        const path = line.substring(3);
        let status = 'unknown';
        
        if (code.includes('M')) status = 'modified';
        if (code.includes('??') || code.includes('A')) status = 'new';
        if (code.includes('D')) status = 'deleted';
        
        return { path, status, code };
      });
      
      setStatusFiles(parsedFiles);
    } catch (e) {
      console.error("Failed to check status", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInit = async () => {
    setIsLoading(true);
    clearMessages();
    try {
      await WebContainerService.exec('git', ['init']);
      await WebContainerService.exec('git', ['branch', '-m', 'main']);
      // Initial config to prevent complaints
      await WebContainerService.exec('git', ['config', 'user.name', 'Aether User']);
      await WebContainerService.exec('git', ['config', 'user.email', 'user@aether.app']);
      
      setSuccessMsg('Repository initialized.');
      await checkGitStatus();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError("Commit message required");
      return;
    }
    setIsLoading(true);
    clearMessages();
    try {
      // Stage all
      await WebContainerService.exec('git', ['add', '.']);
      // Commit
      const { exitCode, output } = await WebContainerService.exec('git', ['commit', '-m', commitMessage]);
      
      if (exitCode === 0) {
        setSuccessMsg("Changes committed.");
        setCommitMessage('');
        await checkGitStatus();
      } else {
        setError(`Commit failed: ${output}`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const configureRemote = async () => {
    if (!remoteUrl) throw new Error("Remote URL required");
    
    // If token provided, inject into URL
    let finalUrl = remoteUrl;
    if (token && remoteUrl.startsWith('https://')) {
        const domain = remoteUrl.split('https://')[1];
        finalUrl = `https://${token}@${domain}`;
    }

    // Check if remote exists
    const { exitCode } = await WebContainerService.exec('git', ['remote', 'get-url', 'origin']);
    if (exitCode === 0) {
        await WebContainerService.exec('git', ['remote', 'set-url', 'origin', finalUrl]);
    } else {
        await WebContainerService.exec('git', ['remote', 'add', 'origin', finalUrl]);
    }
  };

  const handlePush = async () => {
    if (!remoteUrl) {
        setShowSettings(true);
        setError("Please configure remote repository first.");
        return;
    }
    setIsLoading(true);
    clearMessages();
    try {
        await configureRemote();
        // Get current branch
        const { output: branch } = await WebContainerService.exec('git', ['branch', '--show-current']);
        const currentBranch = branch.trim() || 'main';
        
        const { exitCode, output } = await WebContainerService.exec('git', ['push', '-u', 'origin', currentBranch]);
        if (exitCode === 0) {
            setSuccessMsg("Successfully pushed to remote.");
        } else {
            // Sanitize output to hide token
            const sanitized = output.replace(token, '***');
            setError(`Push failed: ${sanitized}`);
        }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handlePull = async () => {
    if (!remoteUrl) {
        setShowSettings(true);
        setError("Please configure remote repository first.");
        return;
    }
    setIsLoading(true);
    clearMessages();
    try {
        await configureRemote();
        const { output: branch } = await WebContainerService.exec('git', ['branch', '--show-current']);
        const currentBranch = branch.trim() || 'main';

        const { exitCode, output } = await WebContainerService.exec('git', ['pull', 'origin', currentBranch]);
        if (exitCode === 0) {
            setSuccessMsg("Successfully pulled from remote.");
            await checkGitStatus(); // Refresh files
        } else {
             const sanitized = output.replace(token, '***');
            setError(`Pull failed: ${sanitized}`);
        }
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isWcBooted) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#18181b] flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-slate-500" />
        </div>
        <div>
            <h3 className="text-sm font-medium text-slate-200">Runtime Offline</h3>
            <p className="text-xs text-slate-500 mt-1">Boot the container to use Git.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0c0c0e] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Source Control</span>
        </div>
        <div className="flex items-center gap-1">
             <button onClick={checkGitStatus} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white" title="Refresh Status">
                 <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
             </button>
             <button onClick={() => setShowSettings(!showSettings)} className={`p-1 hover:bg-white/10 rounded transition-colors ${showSettings ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white'}`} title="Remote Settings">
                 <Settings className="w-3.5 h-3.5" />
             </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Notifications */}
        {error && (
            <div className="bg-red-500/10 border-l-2 border-red-500 p-3 m-3 rounded-r text-xs text-red-200 mb-2 break-words">
                {error}
            </div>
        )}
        {successMsg && (
            <div className="bg-green-500/10 border-l-2 border-green-500 p-3 m-3 rounded-r text-xs text-green-200 mb-2">
                {successMsg}
            </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
            <div className="bg-[#18181b] p-4 border-b border-slate-800 space-y-3 animate-in slide-in-from-top-2">
                <h3 className="text-xs font-semibold text-slate-300">Remote Repository</h3>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Repo URL (.git)</label>
                    <input 
                        type="text" 
                        value={remoteUrl}
                        onChange={(e) => setRemoteUrl(e.target.value)}
                        placeholder="https://github.com/user/repo.git"
                        className="w-full bg-[#0c0c0e] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Personal Access Token (PAT)</label>
                    <input 
                        type="password" 
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full bg-[#0c0c0e] border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-600 italic">Token is used locally to auth with remote.</p>
                </div>
            </div>
        )}

        {/* Main Logic */}
        {!isRepoInitialized ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center border border-slate-800">
                    <Github className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-200">No Repository</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Initialize a Git repository to start tracking changes.</p>
                </div>
                <button 
                    onClick={handleInit}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                >
                    Initialize Repository
                </button>
            </div>
        ) : (
            <div className="p-3 space-y-4">
                
                {/* Commit Section */}
                <div className="space-y-2">
                    <textarea 
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Message (e.g. 'Fix login bug')"
                        className="w-full h-20 bg-[#18181b] border border-slate-800 rounded-md p-2 text-xs text-white focus:border-indigo-500/50 outline-none resize-none placeholder-slate-600"
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCommit}
                            disabled={isLoading || statusFiles.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <GitCommit className="w-3.5 h-3.5" />
                            <span>Commit All</span>
                        </button>
                    </div>
                </div>

                {/* Changes List */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Changes ({statusFiles.length})</h3>
                    </div>
                    
                    {statusFiles.length === 0 ? (
                        <div className="text-xs text-slate-600 italic py-4 text-center border border-dashed border-slate-800 rounded">
                            No working tree changes.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {statusFiles.map(file => (
                                <div key={file.path} className="flex items-center gap-2 group hover:bg-[#18181b] p-1 rounded transition-colors">
                                    <span className={`
                                        text-[10px] font-mono w-4 h-4 flex items-center justify-center rounded-sm
                                        ${file.status === 'modified' ? 'text-amber-400 bg-amber-400/10' : ''}
                                        ${file.status === 'new' ? 'text-green-400 bg-green-400/10' : ''}
                                        ${file.status === 'deleted' ? 'text-red-400 bg-red-400/10' : ''}
                                    `}>
                                        {file.code.trim().substring(0, 1)}
                                    </span>
                                    <span className="text-xs text-slate-300 truncate flex-1">{file.path}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sync Actions */}
                <div className="pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Sync</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={handlePull}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#202024] text-slate-200 border border-slate-700 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50"
                        >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Pull</span>
                        </button>
                        <button 
                            onClick={handlePush}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#202024] text-slate-200 border border-slate-700 py-1.5 rounded-md text-xs transition-colors disabled:opacity-50"
                        >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Push</span>
                        </button>
                    </div>
                </div>

            </div>
        )}
      </div>
    </div>
  );
};