import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QuickReply {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
}

interface QuickRepliesProps {
  onSelectReply: (content: string) => void;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelectReply }) => {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showReplies, setShowReplies] = useState(false);

  useEffect(() => {
    fetchQuickReplies();
  }, []);

  const fetchQuickReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_messages')
        .select('*')
        .or('is_global.eq.true,user_id.eq.auth.uid()')
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setQuickReplies(data || []);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
    }
  };

  const handleSelectReply = async (reply: QuickReply) => {
    onSelectReply(reply.content);
    setShowReplies(false);

    // Increment usage count
    try {
      await supabase
        .from('quick_messages')
        .update({ usage_count: reply.usage_count + 1 })
        .eq('id', reply.id);
    } catch (error) {
      console.error('Error updating usage count:', error);
    }
  };

  if (quickReplies.length === 0) return null;

  return (
    <div className="border-t border-gray-200 bg-gray-50">
      {!showReplies ? (
        <div className="p-2">
          <button
            onClick={() => setShowReplies(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Zap size={16} />
            <span>Respostas Rápidas</span>
          </button>
        </div>
      ) : (
        <div className="p-3 max-h-32 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Respostas Rápidas
            </span>
            <button
              onClick={() => setShowReplies(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Fechar
            </button>
          </div>
          
          <div className="space-y-1">
            {quickReplies.map((reply) => (
              <button
                key={reply.id}
                onClick={() => handleSelectReply(reply)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="font-medium">{reply.title}</div>
                <div className="text-gray-500 truncate">{reply.content}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
