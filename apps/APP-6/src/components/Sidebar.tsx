import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Chat, ProjectFile } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  chatHistory: Chat[];
  currentChatId: string;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onUpdateChatTitle: (chatId: string, newTitle: string) => void;
  onSelectLibrary: () => void;
  onSelectProjects: () => void;
  onSelectGallery: () => void;
  onSelectDocuments: () => void;
  onSelectWhatsApp: () => void;
  onSelectAdmin: () => void;
  onSelectSecurity?: () => void;
  onSelectDesktop?: () => void;
  // New props for project context
  activeProjectId: string | null;
  onExitProject: () => void;
  projectFiles: ProjectFile[];
}

// SVG Icons Components - Compact Version
const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GalleryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LibraryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ProjectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SecurityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AgentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 4.22L5.64 5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M1 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 12H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M4.22 19.78L5.64 18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const AutomationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DesktopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const SidebarLink: React.FC<{ 
  icon: string; 
  text: string; 
  onClick?: () => void; 
  isActive?: boolean;
  gradient?: string;
  IconComponent?: React.FC;
}> = ({ icon, text, onClick, isActive, gradient, IconComponent }) => (
  <button 
    onClick={onClick} 
    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[color:var(--bg-tertiary)] transition-all duration-200 w-full text-left ${isActive ? 'bg-[color:var(--bg-tertiary)]' : ''}`}
  >
    <div className={`w-7 h-7 rounded-lg ${gradient || 'bg-gradient-to-br from-gray-500 to-gray-600'} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}>
      {IconComponent ? <IconComponent /> : <i className={`fa-solid ${icon} text-white text-xs`}></i>}
    </div>
    <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors truncate">{text}</span>
  </button>
);

const ChatHistoryItem: React.FC<{
  chat: Chat;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
}> = ({ chat, isActive, onSelect, onDelete, onUpdateTitle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (title.trim()) {
      onUpdateTitle(title.trim());
    } else {
      setTitle(chat.title); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(chat.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      onClick={() => !isEditing && onSelect()}
      className={`group relative px-2.5 py-1.5 rounded-md truncate text-xs text-left transition-colors duration-200 w-full cursor-pointer ${
        isActive ? 'bg-[color:var(--bg-tertiary)] text-text-primary' : 'hover:bg-[color:var(--bg-tertiary)] text-text-secondary hover:text-text-primary'
      }`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-0 focus:outline-none w-full text-text-primary text-xs"
        />
      ) : (
        <span className="block truncate pr-12">{chat.title}</span>
      )}
      {!isEditing && (
        <div className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'bg-[color:var(--bg-tertiary)]' : 'bg-[color:var(--bg-secondary)]'} rounded px-1`}>
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 hover:text-white text-gray-400"><i className="fa-solid fa-pencil text-[10px]"></i></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:text-red-400 text-gray-400"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
        </div>
      )}
    </div>
  );
};

const ProjectFileItem: React.FC<{ file: ProjectFile }> = ({ file }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary cursor-pointer hover:bg-[color:var(--bg-tertiary)] rounded-md">
        <i className="fa-solid fa-file-code w-4 text-center"></i>
        <span>{file.path}</span>
    </div>
);


const GlobalView: React.FC<Omit<SidebarProps, 'activeProjectId' | 'onExitProject' | 'projectFiles'>> = (props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isChatsExpanded, setIsChatsExpanded] = useState(true);
    
    const filteredChatHistory = props.chatHistory.filter(chat =>
        chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Search Bar - Compact */}
            <div className="relative mb-2 flex-shrink-0">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none text-xs"></i>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[color:var(--bg-tertiary)] border border-transparent focus:border-indigo-500 rounded-lg pl-8 pr-3 py-2 text-xs placeholder-text-tertiary focus:outline-none transition-all duration-200"
                />
            </div>

            {/* Main Navigation Links - Compact */}
            <div className="flex flex-col gap-1 mb-2 flex-shrink-0">
                <SidebarLink 
                  icon="fa-file-lines" 
                  text="Documents" 
                  onClick={props.onSelectDocuments}
                  gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                  IconComponent={DocumentIcon}
                />
                <SidebarLink 
                  icon="fa-images" 
                  text="Gallery" 
                  onClick={props.onSelectGallery}
                  gradient="bg-gradient-to-br from-purple-500 to-pink-500"
                  IconComponent={GalleryIcon}
                />
                <SidebarLink 
                  icon="fa-book-bookmark" 
                  text="Library" 
                  onClick={props.onSelectLibrary}
                  gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                  IconComponent={LibraryIcon}
                />
                <SidebarLink 
                  icon="fa-folder" 
                  text="Projects" 
                  onClick={props.onSelectProjects}
                  gradient="bg-gradient-to-br from-cyan-500 to-teal-500"
                  IconComponent={ProjectIcon}
                />
                <SidebarLink 
                  icon="fa-brands fa-whatsapp" 
                  text="WhatsApp" 
                  onClick={props.onSelectWhatsApp}
                  gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                  IconComponent={WhatsAppIcon}
                />
                <SidebarLink 
                  icon="fa-user-shield" 
                  text="Admin" 
                  onClick={props.onSelectAdmin}
                  gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                  IconComponent={AdminIcon}
                />
                {props.onSelectSecurity && (
                  <SidebarLink 
                    icon="fa-video" 
                    text="Security AI" 
                    onClick={props.onSelectSecurity}
                    gradient="bg-gradient-to-br from-red-500 to-rose-600"
                    IconComponent={SecurityIcon}
                  />
                )}
            </div>

            {/* Collapsible Chats Section - ChatGPT Style */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <button
                    onClick={() => setIsChatsExpanded(!isChatsExpanded)}
                    className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 hover:bg-[color:var(--bg-tertiary)] rounded-lg transition-all duration-200 flex-shrink-0"
                >
                    <div className="flex items-center gap-2">
                        <i className={`fa-solid fa-chevron-${isChatsExpanded ? 'down' : 'right'} text-xs text-text-tertiary transition-transform duration-200`}></i>
                        <p className="text-xs text-text-tertiary font-semibold">Recent Chats</p>
                    </div>
                    <span className="text-xs text-text-tertiary">{filteredChatHistory.length}</span>
                </button>

                {/* Scrollable Chat List */}
                {isChatsExpanded && (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll pr-1 min-h-0">
                        <div className="flex flex-col gap-0.5">
                            {filteredChatHistory.map((chat) => (
                                <ChatHistoryItem
                                    key={chat.id}
                                    chat={chat}
                                    isActive={chat.id === props.currentChatId}
                                    onSelect={() => props.onSelectChat(chat.id)}
                                    onDelete={() => props.onDeleteChat(chat.id)}
                                    onUpdateTitle={(newTitle) => props.onUpdateChatTitle(chat.id, newTitle)}
                                />
                            ))}
                            {filteredChatHistory.length === 0 && (
                                <p className="px-2.5 py-2 text-xs text-text-tertiary italic text-center">
                                    {searchTerm ? 'No chats found' : 'No chats yet'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const UserMenu: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { icon: 'fa-gear', text: 'Settings', action: () => alert('Settings - Em desenvolvimento') },
        { icon: 'fa-palette', text: 'Personalization', action: () => alert('Personalization - Em desenvolvimento') },
        { icon: 'fa-crown', text: 'Upgrade Plan', action: () => alert('Upgrade Plan - Em desenvolvimento'), gradient: true },
        { icon: 'fa-circle-question', text: 'Help & Support', action: () => alert('Help - Em desenvolvimento') },
        { icon: 'fa-right-from-bracket', text: 'Logout', action: () => alert('Logout - Em desenvolvimento'), danger: true },
    ];

    return (
        <div className="border-t border-[color:var(--border-color)] pt-3 flex-shrink-0 relative">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[color:var(--bg-tertiary)] cursor-pointer transition-all duration-200 group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
                        A
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-text-primary">Almir Junior</span>
                        <span className="text-xs text-text-tertiary">Premium User</span>
                    </div>
                </div>
                <i className={`fa-solid fa-ellipsis text-text-tertiary group-hover:text-text-primary transition-colors duration-200`}></i>
            </button>

            {/* Dropdown Menu - ChatGPT Style */}
            {isMenuOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsMenuOpen(false)}
                    ></div>
                    <div className="absolute bottom-full left-3 right-3 mb-2 bg-[color:var(--bg-tertiary)] rounded-xl shadow-2xl border border-[color:var(--border-color)] overflow-hidden z-50 animate-slideUp">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    item.action();
                                    setIsMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[color:var(--bg-secondary)] transition-colors duration-200 text-left ${
                                    item.danger ? 'text-red-400 hover:text-red-300' : 'text-text-primary'
                                } ${index !== 0 ? 'border-t border-[color:var(--border-color)]' : ''}`}
                            >
                                <i className={`fa-solid ${item.icon} w-4 text-center ${item.gradient ? 'text-yellow-400' : ''}`}></i>
                                <span className="text-sm font-medium">{item.text}</span>
                                {item.gradient && (
                                    <span className="ml-auto text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-0.5 rounded-full font-bold">
                                        PRO
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ProjectView: React.FC<Omit<SidebarProps, 'onSelectLibrary' | 'onSelectProjects'>> = (props) => {
    return <>
        <button onClick={props.onExitProject} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4">
            <i className="fa-solid fa-arrow-left"></i>
            <span>Todos os Projetos</span>
        </button>
        <div className="flex-1 overflow-y-auto sidebar-scroll pr-1">
             <div>
                <p className="text-xs text-text-tertiary font-semibold px-3 py-2">Arquivos</p>
                <div className="flex flex-col gap-1">
                    {props.projectFiles.map(file => <ProjectFileItem key={file.path} file={file} />)}
                    {props.projectFiles.length === 0 && <p className="px-3 text-xs text-text-tertiary italic">Nenhum arquivo ainda.</p>}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-xs text-text-tertiary font-semibold px-3 py-2">Chats do Projeto</p>
                 <div className="flex flex-col gap-1">
                    {props.chatHistory.map((chat) => (
                        <ChatHistoryItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === props.currentChatId}
                        onSelect={() => props.onSelectChat(chat.id)}
                        onDelete={() => props.onDeleteChat(chat.id)}
                        onUpdateTitle={(newTitle) => props.onUpdateChatTitle(chat.id, newTitle)}
                        />
                    ))}
                </div>
            </div>
        </div>
    </>;
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <div className={`flex flex-col bg-[color:var(--bg-secondary)] text-text-primary transition-all duration-300 flex-shrink-0 ${props.isOpen ? 'w-64 p-3' : 'w-0'} h-full relative`}>
      <div className={`overflow-hidden transition-opacity duration-200 ${props.isOpen ? 'opacity-100' : 'opacity-0'} flex flex-col h-full`}>
        <div className="flex items-center gap-2 mb-4">
          <button 
            onClick={props.onNewChat}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <i className="fa-solid fa-plus"></i>
            <span>New Chat</span>
          </button>
          <button 
            onClick={props.onToggle}
            className="p-3 rounded-xl hover:bg-[color:var(--bg-tertiary)] transition-all duration-200 hover:scale-110 flex-shrink-0"
            title="Fechar sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-text-secondary">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {props.activeProjectId ? <ProjectView {...props} /> : <GlobalView {...props} />}
        
        <UserMenu />
      </div>
    </div>
  );
};
