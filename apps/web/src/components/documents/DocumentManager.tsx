// Centrid AI Filesystem - Document Manager Component
// Version: 3.1 - Supabase Plus MVP Architecture
// Pure presentational component - no logic or integrations

import { 
  DocumentPlusIcon,
  FolderIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

interface DocumentManagerProps {
  documents: Document[];
  onUploadDocument: () => void;
  onDocumentClick?: (documentId: string) => void;
}

export default function DocumentManager({
  documents,
  onUploadDocument,
  onDocumentClick,
}: DocumentManagerProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your files and documents
          </p>
        </div>
        
        <button onClick={onUploadDocument} className="btn-primary">
          <DocumentPlusIcon className="w-5 h-5 mr-2" />
          Upload Document
        </button>
      </div>

      {/* Documents Grid/List */}
      <div className="card">
        <div className="card-body">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No documents
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by uploading your first document.
              </p>
              <div className="mt-6">
                <button onClick={onUploadDocument} className="btn-primary">
                  <DocumentPlusIcon className="w-5 h-5 mr-2" />
                  Upload Document
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer dark:border-gray-700 dark:hover:border-gray-600"
                  onClick={() => onDocumentClick?.(document.id)}
                >
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {document.filename}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {document.file_type} • {Math.round(document.file_size / 1024)} KB
                      </p>
                      <div className="mt-2">
                        <span className={`badge ${
                          document.processing_status === 'completed' ? 'badge-success' :
                          document.processing_status === 'processing' ? 'badge-warning' :
                          document.processing_status === 'failed' ? 'badge-error' :
                          'badge-gray'
                        }`}>
                          {document.processing_status}
                        </span>
                      </div>
                    </div>
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
