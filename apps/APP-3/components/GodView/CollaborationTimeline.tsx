/**
 * 📜 CollaborationTimeline - Timeline de eventos da colaboração
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'agent_joined' | 'message' | 'contract' | 'artifact' | 'phase_change';
  title: string;
  description: string;
  agentName?: string;
  icon: string;
}

interface CollaborationTimelineProps {
  events: TimelineEvent[];
  maxEvents?: number;
}

const eventColors = {
  agent_joined: 'border-green-500 bg-green-500/10',
  message: 'border-blue-500 bg-blue-500/10',
  contract: 'border-yellow-500 bg-yellow-500/10',
  artifact: 'border-orange-500 bg-orange-500/10',
  phase_change: 'border-purple-500 bg-purple-500/10'
};

export const CollaborationTimeline: React.FC<CollaborationTimelineProps> = ({
  events,
  maxEvents = 10
}) => {
  const displayEvents = events.slice(-maxEvents);

  return (
    <div className="h-full overflow-hidden">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span>📜</span> Timeline
      </h3>
      
      <div className="space-y-2 overflow-y-auto max-h-[calc(100%-2rem)]">
        <AnimatePresence mode="popLayout">
          {displayEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`
                border-l-2 pl-3 py-2 rounded-r
                ${eventColors[event.type]}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{event.icon}</span>
                <span className="text-xs text-gray-400">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-white font-medium">{event.title}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{event.description}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CollaborationTimeline;
