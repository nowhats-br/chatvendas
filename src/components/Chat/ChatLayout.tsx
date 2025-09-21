import React, { useState, useCallback, useEffect } from 'react';
import { TicketList } from './TicketList';
import { ChatInterface } from './ChatInterface';
import { Ticket, supabase } from '../../lib/supabase';

interface ChatLayoutProps {
  onNavigate: (tab: string) => void;
  initialTicket: Ticket | null;
  setInitialTicket: (ticket: Ticket | null) => void;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ onNavigate, initialTicket, setInitialTicket }) => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedTicket(null);
  };
  
  const handleUpdateTicket = useCallback(() => {
    setSelectedTicket(null);
    setShowMobileChat(false);
  }, []);

  useEffect(() => {
    if (initialTicket) {
      handleSelectTicket(initialTicket);
      setInitialTicket(null); // Clear after use
    }
  }, [initialTicket, setInitialTicket]);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex">
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full h-full">
        <TicketList 
          onSelectTicket={handleSelectTicket}
          selectedTicket={selectedTicket}
          onNavigate={onNavigate}
        />
        <ChatInterface 
          selectedTicket={selectedTicket}
          onBackToList={handleBackToList}
          onUpdateTicket={handleUpdateTicket}
        />
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full h-full">
        {!showMobileChat ? (
          <TicketList 
            onSelectTicket={handleSelectTicket}
            selectedTicket={selectedTicket}
            onNavigate={onNavigate}
          />
        ) : (
          <ChatInterface 
            selectedTicket={selectedTicket}
            onBackToList={handleBackToList}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
      </div>
    </div>
  );
};
