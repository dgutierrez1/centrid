/**
 * Agent Request API Client
 * Frontend utilities for interacting with agent request endpoints
 * MVU F2.1: Request status checking and recovery
 */

import { api } from '@/lib/api/client'

export interface AgentRequestStatus {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: number
  triggeringMessageId: string
  responseMessageId: string | null
  results: any
  tokenCost: number | null
  canResume: boolean
  createdAt: string
  completedAt: string | null
}

export interface PendingTool {
  id: string
  toolName: string
  toolInput: any
  approvalStatus: string
  revisionCount: number
  revisionHistory?: any[]
}

/**
 * Check the status of an agent request
 * Used for recovery after page refresh or disconnect
 */
export async function checkRequestStatus(
  requestId: string
): Promise<AgentRequestStatus> {
  const response = await api.get<{ data: AgentRequestStatus }>(
    `/agent-requests/${requestId}`
  )
  return response.data
}

/**
 * Get pending tool calls for a specific request
 */
export async function getPendingToolsByRequest(
  requestId: string
): Promise<PendingTool[]> {
  const response = await api.get<{ data: PendingTool[] }>(
    `/agent-requests/${requestId}/pending-tools`
  )
  return response.data
}

/**
 * Get all pending tool calls for a thread
 */
export async function getPendingToolsByThread(
  threadId: string
): Promise<PendingTool[]> {
  const response = await api.get<{ data: PendingTool[] }>(
    `/threads/${threadId}/pending-tools`
  )
  return response.data
}
