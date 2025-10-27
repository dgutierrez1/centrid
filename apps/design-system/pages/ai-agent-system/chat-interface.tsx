import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { AiAgentSystemMock } from '../../components/AiAgentSystemMock';

export default function ChatInterfacePage() {
  return (
    <DesignSystemFrame title="AI Agent System - Chat Interface">
      <div className="h-screen">
        <AiAgentSystemMock />
      </div>
    </DesignSystemFrame>
  );
}
