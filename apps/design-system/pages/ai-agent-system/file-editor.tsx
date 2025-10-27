import React, { useState } from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { Card } from '@centrid/ui/components';

// Simplified file editor visualization (actual component would use MarkdownEditor)
function FileEditorPreview({
  showProvenance,
}: {
  showProvenance: boolean;
}) {
  return (
    <Card className="h-full overflow-hidden">
      {showProvenance && (
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                AI-Generated
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Created 2 hours ago
              </span>
            </div>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Go to source →
            </button>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Source: Authentication Discussion
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Created while exploring OAuth implementation strategies in branch "Backend Setup".
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Last edited by: Agent</span>
            <span>•</span>
            <span>in conversation "OAuth Flow Refinement"</span>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            oauth-implementation.md
          </h2>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300">
              Preview
            </button>
            <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">
              Edit
            </button>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h1>OAuth 2.0 Implementation Guide</h1>

          <h2>Overview</h2>
          <p>
            This document outlines the OAuth 2.0 authentication flow for our application using
            Supabase Auth.
          </p>

          <h2>Provider Configuration</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
            {`// supabase.ts
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Enable OAuth providers
providers: ['google', 'github']`}
          </pre>

          <h2>Authentication Flow</h2>
          <ol>
            <li>User clicks "Sign in with Google"</li>
            <li>Redirect to Google OAuth consent screen</li>
            <li>User approves permissions</li>
            <li>Redirect back to app with auth token</li>
            <li>Supabase creates/updates user record</li>
            <li>User is authenticated</li>
          </ol>

          <h2>Implementation Details</h2>
          <p>
            We'll use Supabase's built-in OAuth handlers to simplify the flow and avoid manual
            token management.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function FileEditorPage() {
  const [showProvenance, setShowProvenance] = useState(true);

  return (
    <DesignSystemFrame title="AI Agent System - File Editor">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            File Editor with Provenance
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            View/edit files with provenance header showing source conversation context.
          </p>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowProvenance(true)}
              className={`px-4 py-2 rounded-md ${
                showProvenance
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              AI-Generated File
            </button>
            <button
              onClick={() => setShowProvenance(false)}
              className={`px-4 py-2 rounded-md ${
                !showProvenance
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Manual File
            </button>
          </div>
        </div>

        <div className="h-[700px]">
          <FileEditorPreview showProvenance={showProvenance} />
        </div>

        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Provenance Header Details
          </h3>
          <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-2">
            <li>
              <strong>AI-generated files:</strong> Full provenance header with source branch,
              creation context, last edit info
            </li>
            <li>
              <strong>Manual files:</strong> No provenance header (or "Manual" badge only)
            </li>
            <li>"Go to source" button navigates to the conversation where file was created</li>
            <li>Shows last editor (agent/user) and which conversation made the edit</li>
            <li>Wraps existing MarkdownEditor component with provenance metadata on top</li>
          </ul>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
