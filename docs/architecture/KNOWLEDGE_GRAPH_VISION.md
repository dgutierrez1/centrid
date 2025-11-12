# Knowledge Graph Vision

## Core Value Proposition

**"Persistent Knowledge Graph - Upload once, use everywhere, forever."**

Centrid solves the fundamental context loss problem in AI chat applications. Users shouldn't need to re-explain documents, re-upload files, or lose context when starting new conversations. Every piece of knowledge becomes part of a permanent, searchable, interconnected graph that enhances every future interaction.

## User Journey

### 1. **Upload** → User adds content to their knowledge base
- Documents (PDFs, Markdown, Text files)
- Code files from projects
- Notes and artifacts from AI conversations
- External references and bookmarks

### 2. **Store** → System processes and indexes content
- Automatic chunking for optimal retrieval
- Full-text indexing for keyword search
- Embedding generation for semantic search
- Relationship extraction for graph connections

### 3. **Search** → Intelligent retrieval when needed
- Semantic similarity matching
- Keyword and phrase matching
- Graph traversal for related content
- Temporal relevance scoring

### 4. **Context** → Smart assembly for AI agents
- Priority-based inclusion (explicit > semantic > historical)
- Token budget optimization
- Relationship-aware context (include related files)
- Thread-specific context accumulation

### 5. **Response** → AI delivers value with full context
- Answers informed by entire knowledge base
- Citations to source materials
- Suggestions for related content
- Continuous learning from interactions

## Success Metrics

### Primary KPIs
- **Context Recall Rate**: % of relevant documents included in context
- **Response Quality Score**: User satisfaction with context-aware responses
- **Knowledge Reuse Rate**: Average number of conversations per document
- **Time to Context**: Speed of retrieving relevant information

### Secondary Metrics
- **Upload to First Use**: Time from upload to first contextual use
- **Graph Connectivity**: Average connections per document
- **Search Precision**: Relevance of retrieved content
- **Token Efficiency**: Context quality per token used

## Non-Negotiable Principles

### 1. **Persistence**
- No knowledge is ever lost
- All content remains searchable forever
- Relationships strengthen over time

### 2. **Unity**
- Single source of truth for all content
- No artificial separation between document types
- Consistent retrieval regardless of source

### 3. **Intelligence**
- System learns from usage patterns
- Relevance improves with interactions
- Automatic relationship discovery

### 4. **Performance**
- Sub-second search results
- Real-time context assembly
- Streaming responses without delay

### 5. **Privacy**
- Complete user data isolation
- No cross-user information leakage
- User owns and controls their graph

## Technical Architecture Principles

### Data Model
- **Unified Storage**: All content in single `files` table
- **Shadow Domain**: Parallel semantic layer for embeddings
- **Graph Relationships**: Explicit and inferred connections

### Retrieval Strategy
- **Hybrid Search**: Combine vector + text + graph
- **Adaptive Scoring**: Learn from user feedback
- **Progressive Enhancement**: Start simple, add intelligence

### Context Assembly
- **Token Budget Management**: Maximize value within limits
- **Priority Tiers**: Explicit > Semantic > Historical > Random
- **Summarization Fallback**: Compress when exceeding budget

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Unify storage under files table
- Implement basic full-text search
- Connect to context assembly

### Phase 2: Intelligence (Week 2)
- Add embedding generation
- Implement vector search
- Create hybrid retrieval

### Phase 3: Graph (Week 3-4)
- Build relationship tracking
- Implement graph traversal
- Add learning mechanisms

## Expected Outcomes

### For Users
- Never repeat themselves
- Instant access to all knowledge
- Smarter AI responses over time
- Discoverable connections

### For the Product
- Clear differentiation from chat-only tools
- Network effects from accumulated knowledge
- Increasing value with usage
- Platform stickiness

## Definition of Success

Centrid succeeds when users can:
1. Upload a document once and reference it naturally in any future conversation
2. Ask questions that require synthesis across multiple documents
3. Discover non-obvious connections in their knowledge base
4. Trust that the AI always has full context

The ultimate test: Can a user upload their entire document library, leave for a month, return, and have the AI immediately understand references to any of that content without re-explanation?

**That is the persistent knowledge graph promise we must deliver.**