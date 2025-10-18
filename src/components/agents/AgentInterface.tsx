// Centrid AI Filesystem - Agent Interface Component
// Version: 3.1 - Supabase Plus MVP Architecture
// Pure presentational component - no logic or integrations

import { 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  BeakerIcon,
  PencilIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const agentTypes = [
  {
    id: 'create',
    name: 'Create',
    description: 'Generate new content from scratch',
    icon: BeakerIcon,
    color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400',
  },
  {
    id: 'edit',
    name: 'Edit',
    description: 'Improve and refine existing content',
    icon: PencilIcon,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400',
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Analyze and extract insights',
    icon: MagnifyingGlassIcon,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400',
  },
];

interface AgentRequest {
  id: string;
  agent_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content: string;
  progress: number;
  created_at: string;
}

interface AgentInterfaceProps {
  agentRequests: AgentRequest[];
  onNewRequest: () => void;
  onRequestClick?: (requestId: string) => void;
}

export default function AgentInterface({
  agentRequests,
  onNewRequest,
  onRequestClick,
}: AgentInterfaceProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Agents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, edit, and research with AI assistance
          </p>
        </div>
        
        <button onClick={onNewRequest} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Request
        </button>
      </div>

      {/* Agent Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agentTypes.map((agentType) => (
          <div
            key={agentType.id}
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${agentType.color}`}>
                  <agentType.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {agentType.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {agentType.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Requests
          </h2>
        </div>
        <div className="card-body">
          {agentRequests.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No agent requests
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start a conversation with an AI agent to get help with your content.
              </p>
              <div className="mt-6">
                <button onClick={onNewRequest} className="btn-primary">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  New Request
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {agentRequests.slice(0, 10).map((request) => (
                <div
                  key={request.id}
                  onClick={() => onRequestClick?.(request.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer dark:border-gray-700 dark:hover:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="badge badge-primary">
                          {request.agent_type}
                        </span>
                        <span className={`badge ${
                          request.status === 'completed' ? 'badge-success' :
                          request.status === 'processing' ? 'badge-warning' :
                          request.status === 'failed' ? 'badge-error' :
                          'badge-gray'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-900 dark:text-white line-clamp-2">
                        {request.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {request.status === 'processing' && (
                      <div className="ml-4">
                        <div className="progress-bar w-20">
                          <div 
                            className="progress-fill"
                            style={{ width: `${(request.progress * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(request.progress * 100)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
