/**
 * Mobile Chat View Component
 * Single-panel mobile interface for AI chat
 */

import { useState } from 'react';
import {
  MobileHeader,
  MobileMenu,
  Input,
  ScrollArea,
} from '@centrid/ui/components';
import {
  FileTextIcon,
  MessageSquareIcon,
} from './icons';

export interface MobileMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
}

export interface MobileChatViewProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  logo?: string;
  appName?: string;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
  menuItems?: MobileMenuItem[];
  onNavigateToDocument?: () => void;
}

export function MobileChatView({
  messages = [],
  onSendMessage,
  logo = 'C',
  appName = 'Centrid',
  userInitials = 'DG',
  userName = 'User',
  userEmail = 'user@example.com',
  menuItems = [],
  onNavigateToDocument,
}: MobileChatViewProps) {
  const [activeView, setActiveView] = useState<'document' | 'chat'>('chat');
  const [menuOpen, setMenuOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Application Header */}
      <MobileHeader
        logo={logo}
        appName={appName}
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />

      {/* Mobile Menu */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userInitials={userInitials}
        userName={userName}
        userEmail={userEmail}
        items={menuItems}
      />

      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-gray-50 dark:bg-gray-900">
        <MessageSquareIcon className="h-5 w-5 text-primary-600 mr-2" />
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
      </div>

      {/* Chat messages */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hello! I can help you with your documents. Try asking me about your notes or request analysis.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg p-3 ${
                  message.isUser
                    ? 'bg-primary-50 dark:bg-primary-900/20 ml-8'
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <p className="text-sm text-gray-900 dark:text-white">
                  {message.content}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Input
          placeholder="Ask about your documents..."
          className="w-full h-11"
          value={inputValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
        />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex h-16">
          <button
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${
              activeView === 'document' ? 'text-primary-600' : 'text-gray-500'
            }`}
            onClick={() => {
              setActiveView('document');
              onNavigateToDocument?.();
            }}
          >
            <FileTextIcon className="h-5 w-5" />
            <span className="text-xs">Document</span>
          </button>
          <button
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${
              activeView === 'chat' ? 'text-primary-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveView('chat')}
          >
            <MessageSquareIcon className="h-5 w-5" />
            <span className="text-xs">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
