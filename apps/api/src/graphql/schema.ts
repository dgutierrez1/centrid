/**
 * GraphQL Schema
 * Exports complete schema for GraphQL Yoga server
 */

import { builder } from './builder.ts';

// Import all type definitions (registers them with builder)
import './types/user.ts';
import './types/folder.ts';
import './types/file.ts';
import './types/toolCall.ts';
import './types/search.ts';
import './types/agentRequest.ts';
import './types/thread.ts';
import './types/agentExecutionEvent.ts';
import './types/usageEvent.ts';
import './types/shadowEntity.ts';
import './types/contentBlock.ts';

// Build and export schema
export const schema = builder.toSchema();
