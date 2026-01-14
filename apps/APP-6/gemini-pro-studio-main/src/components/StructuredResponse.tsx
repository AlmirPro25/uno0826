/**
 * 📰 STRUCTURED RESPONSE COMPONENT
 * Exibe respostas estruturadas com seções, timeline e fontes organizadas
 */

import React, { useState } from 'react';
import { StructuredResponse as StructuredResponseType, StructuredSource, TimelineEvent } from '../services/responseStructurer';

interface StructuredResponseProps {
  data: StructuredResponseType;
  theme: 'light' | 'dark';
}

export const StructuredResponse: React.FC<StructuredResponseProps> = ({ data, theme }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'timeline' | 'sources'>('content');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const getTypeColor = () => {
    switch (data.responseType) {
      case 'news': return 'from-red-500 to-orange-500';
      case 'products': return 'from-green-500 to-emerald-500';
      case 'educational': return 'from-blue-500 to-cyan-500';
      default: return 'from-purple-500 to-blue-500';
    }
  };

  const getTypeIcon = () => {
    switch (data.responseType) {
      case 'news': return 'fa-newspaper';
      case 'products': return 'fa-shopping-cart';
      case 'educational': return 'fa-graduation-cap';
      default: return 'fa-search';
    }
  };

  return (
    <div className="structured-response my-6">
      {/* Header com Título Resumo */}
      <div className={`structured-header bg-gradient-to-r ${getTypeColor()} p-4 rounded-t-xl`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <i className={`fa-solid ${getTypeIcon()} text-white text-lg`}></i>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">{data.summary}</h3>
            <p className="text-white/80 text-xs mt-1">
              {data.sections.length} seções • {Object.values(data.sources).flat().length} fontes
              {data.timeline && ` • ${data.timeline.length} eventos`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="structured-tabs flex border-b border-border-color bg-bg-tertiary">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'content'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <i className="fa-solid fa-file-lines mr-2"></i>
          Conteúdo
        </button>
        
        {data.timeline && data.timeline.length > 0 && (
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'timeline'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <i className="fa-solid fa-clock mr-2"></i>
            Timeline
          </button>
        )}
        
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'sources'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <i className="fa-solid fa-link mr-2"></i>
          Fontes ({Object.values(data.sources).flat().length})
        </button>
      </div>

      {/* Content Area */}
      <div className="structured-content bg-bg-secondary rounded-b-xl p-6">
        {/* Tab: Conteúdo */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {data.sections.map((section, index) => (
              <SectionCard
                key={index}
                section={section}
                index={index}
                isExpanded={expandedSections.has(index)}
                onToggle={() => toggleSection(index)}
                theme={theme}
              />
            ))}
          </div>
        )}

        {/* Tab: Timeline */}
        {activeTab === 'timeline' && data.timeline && (
          <TimelineView events={data.timeline} sources={Object.values(data.sources).flat()} theme={theme} />
        )}

        {/* Tab: Fontes */}
        {activeTab === 'sources' && (
          <SourcesView sources={data.sources} theme={theme} />
        )}
      </div>

      {/* Follow-up Questions */}
      {data.followUpQuestions && data.followUpQuestions.length > 0 && (
        <div className="mt-4 p-4 bg-bg-tertiary rounded-lg border border-border-color">
          <h4 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <i className="fa-solid fa-lightbulb text-yellow-400"></i>
            Perguntas Relacionadas
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.followUpQuestions.map((question, index) => (
              <button
                key={index}
                className="text-xs px-3 py-2 bg-bg-secondary hover:bg-bg-primary rounded-full text-text-secondary hover:text-purple-400 transition-colors border border-border-color"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Section Card Component
const SectionCard: React.FC<{
  section: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  theme: string;
}> = ({ section, index, isExpanded, onToggle, theme }) => {
  return (
    <div className="section-card bg-bg-tertiary rounded-lg border border-border-color overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-secondary transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.emoji}</span>
          <div className="text-left">
            <h4 className="font-semibold text-text-primary">{section.title}</h4>
            {section.sources.length > 0 && (
              <p className="text-xs text-text-tertiary mt-1">
                {section.sources.length} {section.sources.length === 1 ? 'fonte' : 'fontes'}
              </p>
            )}
          </div>
        </div>
        <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-text-tertiary`}></i>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br/>') }} />
        </div>
      )}
    </div>
  );
};

// Timeline View Component
const TimelineView: React.FC<{
  events: TimelineEvent[];
  sources: StructuredSource[];
  theme: string;
}> = ({ events, sources, theme }) => {
  return (
    <div className="timeline-view relative pl-8">
      {/* Linha vertical */}
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500"></div>
      
      {events.map((event, index) => (
        <div key={index} className="timeline-event mb-6 relative">
          {/* Ponto na linha */}
          <div className="absolute -left-6 top-2 w-4 h-4 rounded-full bg-purple-500 border-2 border-bg-secondary"></div>
          
          <div className="bg-bg-tertiary rounded-lg p-4 border border-border-color">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-xs font-semibold text-purple-400">{event.date}</span>
                {event.time && <span className="text-xs text-text-tertiary ml-2">{event.time}</span>}
                {event.location && (
                  <span className="text-xs text-text-tertiary ml-2">
                    <i className="fa-solid fa-location-dot mr-1"></i>
                    {event.location}
                  </span>
                )}
              </div>
            </div>
            <h5 className="font-semibold text-text-primary mb-2">{event.title}</h5>
            <p className="text-sm text-text-secondary">{event.description}</p>
            
            {event.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {event.sources.map(sourceId => {
                  const source = sources.find(s => s.id === sourceId);
                  return source ? (
                    <a
                      key={sourceId}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-bg-secondary rounded text-blue-400 hover:text-blue-300"
                    >
                      [{sourceId}] {source.publisher}
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Sources View Component
const SourcesView: React.FC<{
  sources: StructuredResponseType['sources'];
  theme: string;
}> = ({ sources, theme }) => {
  const renderSourceGroup = (title: string, icon: string, sourceList: StructuredSource[], color: string) => {
    if (sourceList.length === 0) return null;
    
    return (
      <div className="source-group mb-6">
        <h4 className={`text-sm font-semibold ${color} mb-3 flex items-center gap-2`}>
          <i className={`fa-solid ${icon}`}></i>
          {title} ({sourceList.length})
        </h4>
        <div className="space-y-2">
          {sourceList.map(source => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-bg-tertiary hover:bg-bg-primary rounded-lg border border-border-color transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-purple-400 mt-1">[{source.id}]</span>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-text-primary group-hover:text-purple-400 transition-colors">
                    {source.title}
                  </h5>
                  <p className="text-xs text-text-tertiary mt-1">
                    {source.publisher}
                    {source.date && ` • ${source.date}`}
                  </p>
                </div>
                <i className="fa-solid fa-external-link text-text-tertiary group-hover:text-purple-400 transition-colors"></i>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="sources-view">
      {renderSourceGroup('Artigos', 'fa-newspaper', sources.articles, 'text-blue-400')}
      {renderSourceGroup('Vídeos', 'fa-video', sources.videos, 'text-red-400')}
      {renderSourceGroup('Governo', 'fa-landmark', sources.government, 'text-green-400')}
      {renderSourceGroup('Outras Fontes', 'fa-link', sources.other, 'text-gray-400')}
    </div>
  );
};

export default StructuredResponse;
