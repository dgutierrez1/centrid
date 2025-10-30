---
description: Validate development-phase data flows and critical system components
---

## User Input

```text
$ARGUMENTS
```

Validate specific data flows during development:

- **embedding-flow**: Validate text extraction → embedding generation → vector storage → semantic search
- **context-assembly**: Validate multi-domain context gathering with performance targets
- **agent-execution**: Validate streaming responses, tool approval workflow, error recovery
- **shadow-domain**: Validate background sync, change detection, provenance tracking
- **branch-management**: Validate tree structure, context inheritance, memory compression
- **consolidation**: Validate multi-branch synthesis, provenance preservation

---

## Workflow

### Step 1: Prerequisites & Flow Selection

**Check development environment**:

```bash
# Check if apps are running for flow validation
curl -f http://localhost:3000/api/health || echo "Frontend not running"
curl -f http://localhost:3000/api/threads || echo "Backend not responding"
```

**Parse flow selection**:

```bash
FLOW="$ARGUMENTS"  # embedding-flow, context-assembly, etc.

if [ -z "$FLOW" ]; then
  echo "Available flows:"
  echo "  embedding-flow    - Text → embeddings → vector search"
  echo "  context-assembly  - Multi-domain context gathering"
  echo "  agent-execution   - Streaming + tool approval"
  echo "  shadow-domain     - Background sync + provenance"
  echo "  branch-management - Tree structure + inheritance"
  echo "  consolidation     - Multi-branch synthesis"
  echo ""
  echo "Usage: /speckit.validate-flows [flow-name]"
  exit 1
fi

echo "Validating flow: $FLOW"
```

**Load feature context**:

Run `.specify/scripts/bash/check-prerequisites.sh --json` with description "Get feature directory and validation context"

Parse JSON to extract:
- FEATURE_DIR
- FEATURE_NAME
- AVAILABLE_DOCS

**Load flow specifications**:
- Read `$FEATURE_DIR/spec.md` (for flow requirements)
- Read `$FEATURE_DIR/plan.md` (for API contracts)
- Read `$FEATURE_DIR/arch.md` (for service boundaries)
- Read flow-specific validation schema from `packages/shared/src/schemas/flows/`

---

### Step 2: Flow-Specific Validation Setup

**Based on selected flow, configure validation**:

#### 2.1 Embedding Flow Validation

**Target**: Document upload → Text extraction → Embedding generation → Vector storage → Semantic search

**Validation checkpoints**:
```typescript
interface EmbeddingFlowValidation {
  documentUpload: {
    fileSize: number,
    mimeType: string,
    storagePath: string,
    metadata: DocumentMetadata
  },
  textExtraction: {
    originalLength: number,
    extractedLength: number,
    extractionMethod: 'pdf' | 'markdown' | 'text',
    chunkCount: number,
    avgChunkSize: number
  },
  embeddingGeneration: {
    chunksProcessed: number,
    embeddingDimension: number,
    generationTime: number,
    apiCost: number,
    errors: string[]
  },
  vectorStorage: {
    vectorsStored: number,
    indexUpdated: boolean,
    storageTime: number,
    similarityFunction: 'cosine'
  },
  semanticSearch: {
    queryVector: number[],
    resultCount: number,
    avgSimilarity: number,
    searchTime: number,
    relevanceScore: number
  }
}
```

#### 2.2 Context Assembly Validation

**Target**: Multi-domain context gathering under 1s performance target

**Validation checkpoints**:
```typescript
interface ContextAssemblyValidation {
  explicitContext: {
    filesAdded: number,
    totalSize: number,
    loadTime: number
  },
  semanticContext: {
    queryEmbedding: number[],
    similarEntities: number,
    retrievalTime: number,
    avgSimilarity: number
  },
  threadTreeContext: {
    branchesTraversed: number,
    messagesLoaded: number,
    treeTraversalTime: number
  },
  memoryChunks: {
    chunksRelevant: number,
    compressionLevel: number,
    loadTime: number
  },
  userPreferences: {
    preferencesApplied: string[],
    learningWeight: number,
    loadTime: number
  },
  knowledgeGraph: {
    entitiesLinked: number,
    relationshipsTraversed: number,
    traversalTime: number
  },
  totalAssembly: {
    totalTime: number,
    contextSize: number,
    qualityScore: number
  }
}
```

#### 2.3 Agent Execution Validation

**Target**: Streaming responses with tool approval workflow

**Validation checkpoints**:
```typescript
interface AgentExecutionValidation {
  requestProcessing: {
    contextReceived: boolean,
    contextSize: number,
    processingTime: number
  },
  streamingSetup: {
    sseConnection: boolean,
    clientId: string,
    setupTime: number
  },
  agentReasoning: {
    modelUsed: string,
    inputTokens: number,
    reasoningTime: number,
    toolCallsGenerated: number
  },
  toolApproval: {
    toolsPending: number,
    approvalTimeout: number,
    userResponseTime: number,
    approvalRate: number
  },
  streamingResponse: {
    chunksReceived: number,
    totalTokens: number,
    streamingTime: number,
    interruptions: number
  },
  resultStorage: {
    threadUpdated: boolean,
    messageStored: boolean,
    provenanceTracked: boolean,
    storageTime: number
  }
}
```

**Load validation schema** based on selected flow:
```typescript
const validationSchema = await import(`@centrid/shared/schemas/flows/${FLOW}.ts`)
```

---

### Step 3: Create Test Data & Environment

**Generate flow-specific test data**:

#### For Embedding Flow:
```bash
# Create test document
echo "# Test Document

This is a test document for embedding validation. It contains multiple paragraphs and various technical concepts like machine learning, vector databases, and semantic search.

## Machine Learning Concepts

Embeddings are numerical representations of text that capture semantic meaning. Vector databases like pgvector allow efficient similarity search.

## Semantic Search

Semantic search finds documents based on meaning rather than exact keywords. This enables more intelligent information retrieval." > /tmp/test-doc.md

# Upload via API
curl -X POST http://localhost:3000/api/documents \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@/tmp/test-doc.md" \
  -F "title=Embedding Validation Test" \
  -j | jq '.id' > /tmp/doc-id.txt
```

#### For Context Assembly:
```bash
# Create test thread with context
THREAD_ID=$(curl -X POST http://localhost:3000/api/threads \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Context Assembly Test", "initialContext": {"fileIds": [], "explicitQuery": "machine learning embeddings"}}' \
  -j | jq -r '.id')

echo $THREAD_ID > /tmp/thread-id.txt
```

#### For Agent Execution:
```bash
# Send test message to trigger agent
curl -X POST http://localhost:3000/api/threads/$THREAD_ID/messages \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Explain how vector embeddings work for semantic search", "stream": true}' \
  -j | tee /tmp/agent-response.json
```

**Create validation monitoring setup**:
```bash
# Start monitoring in background
node scripts/monitor-flow.js $FLOW > /tmp/flow-metrics.json &
MONITOR_PID=$!

# Ensure cleanup
trap "kill $MONITOR_PID 2>/dev/null || true" EXIT
```

---

### Step 4: Execute Flow Validation

**Run flow-specific validation using parallel agents**:

#### 4.1 Embedding Flow Validation

**Agent 1: Document Upload & Text Extraction**
```javascript
// Validate document upload
const uploadResult = await fetch('http://localhost:3000/api/documents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Embedding Flow Validation Test",
    content: testDocumentContent,
    type: "markdown"
  })
});

const document = await uploadResult.json();
return {
  uploadSuccess: uploadResult.ok,
  documentId: document.id,
  fileSize: document.content_length,
  extractionTime: document.processing_time
};
```

**Agent 2: Embedding Generation**
```javascript
// Monitor embedding generation
const embeddings = await monitorEmbeddingGeneration(document.id);
return {
  chunksProcessed: embeddings.length,
  embeddingDimension: embeddings[0].dimension,
  generationTime: embeddings.total_time,
  apiCost: embeddings.cost_estimate,
  errors: embeddings.errors || []
};
```

**Agent 3: Vector Storage & Search**
```javascript
// Test vector storage and semantic search
const searchResult = await fetch('http://localhost:3000/api/semantic-search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.TEST_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: "machine learning vector embeddings",
    limit: 5
  })
});

const results = await searchResult.json();
return {
  resultCount: results.length,
  avgSimilarity: results.reduce((sum, r) => sum + r.similarity, 0) / results.length,
  searchTime: results.search_time,
  topResult: results[0]
};
```

#### 4.2 Context Assembly Validation

**Agent 1: Explicit Context Loading**
```javascript
const contextStart = performance.now();
const explicitContext = await loadExplicitContext(threadId, {fileIds: testFileIds});
const contextTime = performance.now() - contextStart;

return {
  filesLoaded: explicitContext.files.length,
  totalSize: explicitContext.files.reduce((sum, f) => sum + f.size, 0),
  loadTime: contextTime,
  contextQuality: explicitContext.relevance_score
};
```

**Agent 2: Semantic Context Retrieval**
```javascript
const semanticStart = performance.now();
const semanticContext = await retrieveSimilarEntities(query, embedding, {limit: 10});
const semanticTime = performance.now() - semanticStart;

return {
  entitiesFound: semanticContext.length,
  avgSimilarity: semanticContext.reduce((sum, e) => sum + e.similarity, 0) / semanticContext.length,
  retrievalTime: semanticTime,
  diversity: calculateSemanticDiversity(semanticContext)
};
```

**Agent 3: Thread Tree Traversal**
```javascript
const treeStart = performance.now();
const threadContext = await traverseThreadTree(threadId, {maxDepth: 3, maxMessages: 20});
const treeTime = performance.now() - treeStart;

return {
  branchesTraversed: threadContext.branches.length,
  messagesLoaded: threadContext.messages.length,
  traversalTime: treeTime,
  contextRelevance: threadContext.relevance_score
};
```

**Agent 4: Total Assembly Performance**
```javascript
const assemblyStart = performance.now();
const fullContext = await assembleCompleteContext(threadId, query, options);
const assemblyTime = performance.now() - assemblyStart;

return {
  totalTime: assemblyTime,
  contextSize: JSON.stringify(fullContext).length,
  domainCoverage: {
    explicit: fullContext.explicit.length > 0,
    semantic: fullContext.semantic.length > 0,
    thread: fullContext.thread.length > 0,
    memory: fullContext.memory.length > 0,
    preferences: Object.keys(fullContext.preferences).length > 0
  },
  meetsTarget: assemblyTime < 1000 // 1s target
};
```

#### 4.3 Agent Execution Validation

**Agent 1: Streaming Setup**
```javascript
const eventSource = new EventSource(`http://localhost:3000/api/threads/${threadId}/stream`);
const setupStart = performance.now();

return new Promise((resolve) => {
  let chunksReceived = 0;
  let totalTime = 0;

  eventSource.onopen = () => {
    const setupTime = performance.now() - setupStart;
    resolve({
      streamingConnected: true,
      setupTime,
      clientId: eventSource.clientId
    });
  };

  eventSource.onmessage = (event) => {
    chunksReceived++;
    const data = JSON.parse(event.data);

    if (data.type === 'complete') {
      totalTime = performance.now() - setupStart;
      eventSource.close();
    }
  };
});
```

**Agent 2: Tool Approval Workflow**
```javascript
// Monitor tool call approval process
const approvalMonitor = await monitorToolApprovals(threadId);
return {
  toolsGenerated: approvalMonitor.toolCalls.length,
  toolsApproved: approvalMonitor.approvedCalls.length,
  toolsRejected: approvalMonitor.rejectedCalls.length,
  avgApprovalTime: approvalMonitor.avgResponseTime,
  timeoutOccurrences: approvalMonitor.timeouts,
  approvalRate: approvalMonitor.approvedCalls.length / approvalMonitor.toolCalls.length
};
```

**Agent 3: Error Recovery**
```javascript
// Test error scenarios
const errorScenarios = [
  {type: 'network_interruption', during: 'streaming'},
  {type: 'api_timeout', during: 'embedding_generation'},
  {type: 'tool_failure', during: 'execution'}
];

const results = [];
for (const scenario of errorScenarios) {
  const result = await simulateErrorScenario(threadId, scenario);
  results.push({
    scenario: scenario.type,
    recovered: result.recovered,
    recoveryTime: result.recovery_time,
    dataLoss: result.data_loss,
    userNotified: result.user_notified
  });
}

return {errorScenarios: results};
```

---

### Step 5: Aggregate Validation Results

**Collect all agent results**:

```javascript
const validationResults = {
  flow: FLOW,
  timestamp: new Date().toISOString(),
  environment: {
    frontend: 'http://localhost:3000',
    backend: 'http://localhost:3000/api',
    database: process.env.DATABASE_URL ? 'connected' : 'disconnected'
  },
  checkpoints: {
    // Embedding flow
    documentUpload: uploadResults,
    textExtraction: extractionResults,
    embeddingGeneration: embeddingResults,
    vectorStorage: storageResults,
    semanticSearch: searchResults,

    // Context assembly
    explicitContext: explicitResults,
    semanticContext: semanticResults,
    threadTree: treeResults,
    memoryChunks: memoryResults,
    userPreferences: preferenceResults,
    totalAssembly: assemblyResults,

    // Agent execution
    streamingSetup: streamingResults,
    toolApproval: approvalResults,
    errorRecovery: errorResults
  },
  performance: {
    totalDuration: 0,
    bottlenecks: [],
    targetsMet: [],
    targetsMissed: []
  },
  issues: [],
  recommendations: []
};
```

**Calculate performance metrics**:

```javascript
// Performance analysis
const performanceMetrics = {
  embeddingFlow: {
    totalProcessTime: embeddingResults.generationTime + storageResults.storageTime,
    throughputCost: embeddingResults.apiCost / embeddingResults.chunksProcessed,
    searchLatency: searchResults.searchTime,
    targets: {
      processTime: {target: 5000, actual: embeddingResults.generationTime, met: embeddingResults.generationTime < 5000},
      searchLatency: {target: 1000, actual: searchResults.searchTime, met: searchResults.searchTime < 1000}
    }
  },
  contextAssembly: {
    totalTime: assemblyResults.totalTime,
    domainBreakdown: {
      explicit: explicitResults.loadTime,
      semantic: semanticResults.retrievalTime,
      thread: treeResults.traversalTime,
      memory: memoryResults.loadTime
    },
    target: {target: 1000, actual: assemblyResults.totalTime, met: assemblyResults.totalTime < 1000}
  },
  agentExecution: {
    firstTokenTime: streamingResults.setupTime,
    totalTokens: streamingResults.totalTokens,
    approvalRate: approvalResults.approvalRate,
    errorRecovery: errorResults.averageRecoveryTime
  }
};
```

**Identify issues and recommendations**:

```javascript
const issues = [];
const recommendations = [];

if (performanceMetrics.embeddingFlow.totalProcessTime > 5000) {
  issues.push({
    severity: 'warning',
    category: 'performance',
    message: `Embedding processing exceeds 5s target (${performanceMetrics.embeddingFlow.totalProcessTime}ms)`,
    checkpoint: 'embeddingGeneration'
  });
  recommendations.push({
    priority: 'medium',
    action: 'Consider implementing embedding batching or async processing',
    impact: 'Improves upload-to-search latency'
  });
}

if (performanceMetrics.contextAssembly.totalTime > 1000) {
  issues.push({
    severity: 'error',
    category: 'performance',
    message: `Context assembly exceeds 1s target (${performanceMetrics.contextAssembly.totalTime}ms)`,
    checkpoint: 'totalAssembly'
  });
  recommendations.push({
    priority: 'high',
    action: 'Optimize parallel queries or implement context caching',
    impact: 'Critical for user experience'
  });
}

if (approvalResults.approvalRate < 0.7) {
  issues.push({
    severity: 'warning',
    category: 'ux',
    message: `Low tool approval rate (${approvalResults.approvalRate * 100}%)`,
    checkpoint: 'toolApproval'
  });
  recommendations.push({
    priority: 'medium',
    action: 'Improve tool call explanations and user context',
    impact: 'Increases user trust and efficiency'
  });
}
```

---

### Step 6: Generate Flow Validation Report

**Create comprehensive validation report**:

```markdown
# Flow Validation Report: ${FLOW}

**Date**: ${new Date().toISOString()}
**Feature**: ${FEATURE_NAME}
**Environment**: Development (localhost:3000)

---

## Executive Summary

**Status**: ${status} // PASS | FAIL | PARTIAL

**Performance Summary**:
- **Total Validation Time**: ${totalDuration}ms
- **Critical Issues**: ${criticalIssues.length}
- **Warnings**: ${warnings.length}
- **Targets Met**: ${targetsMet}/${totalTargets}

---

## Flow Checkpoint Results

### ${getCheckpointTitle('documentUpload')}
**Status**: ${checkpointStatus}
**Duration**: ${duration}ms
**Details**:
- File size: ${fileSize} bytes
- Processing time: ${processingTime}ms
- Extraction method: ${extractionMethod}

${if (issues): `
**Issues**:
${issues.map(issue => `- ${issue.severity.toUpperCase()}: ${issue.message}`).join('\n')}
`}

### ${getCheckpointTitle('embeddingGeneration')}
**Status**: ${checkpointStatus}
**Duration**: ${duration}ms
**Cost**: $${cost}
**Details**:
- Chunks processed: ${chunksProcessed}
- Embedding dimension: ${dimension}
- API calls: ${apiCalls}

${if (recommendations): `
**Recommendations**:
${recommendations.map(rec => `- ${rec.action} (${rec.impact})`).join('\n')}
`}

---

## Performance Analysis

### Embedding Flow Performance
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Processing Time | <5000ms | ${actualProcessingTime}ms | ${status} |
| Search Latency | <1000ms | ${actualSearchLatency}ms | ${status} |
| Cost per 1K chunks | <$0.10 | $${actualCost} | ${status} |

### Context Assembly Performance
| Domain | Load Time | % of Total | Status |
|--------|-----------|-------------|--------|
| Explicit Context | ${explicitTime}ms | ${explicitPercentage}% | ${status} |
| Semantic Context | ${semanticTime}ms | ${semanticPercentage}% | ${status} |
| Thread Tree | ${treeTime}ms | ${treePercentage}% | ${status} |
| Memory Chunks | ${memoryTime}ms | ${memoryPercentage}% | ${status} |
| **TOTAL** | **${totalTime}ms** | **100%** | ${overallStatus} |

---

## Issues & Recommendations

### Critical Issues (Fix Required)
${criticalIssues.map(issue => `
**${issue.category}**: ${issue.message}
- **Checkpoint**: ${issue.checkpoint}
- **Impact**: ${issue.impact}
- **Fix**: ${issue.suggestedFix}
`).join('\n')}

### Warnings (Review Recommended)
${warnings.map(warning => `
**${warning.category}**: ${warning.message}
- **Checkpoint**: ${warning.checkpoint}
- **Recommendation**: ${warning.recommendation}
`).join('\n')}

---

## Next Steps

**If PASS**:
✅ Flow validation passed. Implementation meets requirements.
- Monitor performance in production
- Consider optimizations from recommendations

**If FAIL**:
🔴 Critical issues found. Fix required before proceeding:
1. Address critical issues in order of severity
2. Re-run flow validation after fixes
3. Ensure all performance targets are met

**If PARTIAL**:
⚠️ Flow functional with performance concerns:
1. Review warnings and implement recommendations
2. Consider impact on user experience
3. Schedule optimization work

**Validation Command**: \`/speckit.validate-flows ${FLOW}\`
**Report Location**: \`${FEATURE_DIR}/flow-validation-${FLOW}.md\`
```

**Save report**: `$FEATURE_DIR/flow-validation-${FLOW}.md`

---

### Step 7: Interactive Validation Summary

**Display concise results to user**:

```
${getStatusEmoji()} Flow Validation: ${FLOW.toUpperCase()} - ${STATUS}

**Performance**:
- Total time: ${totalDuration}ms
- Targets met: ${targetsMet}/${totalTargets}
- Issues: ${criticalIssues.length} critical, ${warnings.length} warnings

**Key Findings**:
${keyFindings.map(finding => `- ${finding}`).join('\n')}

${if (criticalIssues.length > 0): `
**Critical Issues**:
${criticalIssues.slice(0, 3).map(issue => `- ${issue.message}`).join('\n')}
`}

${if (recommendations.length > 0): `
**Top Recommendations**:
${recommendations.slice(0, 3).map(rec => `- ${rec.action}`).join('\n')}
`}

Report: ${FEATURE_DIR}/flow-validation-${FLOW}.md
${if (status !== 'PASS'): `Re-run: /speckit.validate-flows ${FLOW}`}
```

**If user provided specific flow**: Show detailed results for that flow
**If user asked for help**: Show available flows and usage examples
**If validation failed**: Offer to run diagnostic mode for deeper analysis

---

## Key Rules

**Flow Selection**:
- One flow at a time for focused validation
- Each flow has specific validation checkpoints
- Performance targets from spec.md are enforced

**Environment Requirements**:
- Development environment running (localhost:3000)
- Database accessible for data validation
- Test data generation for reproducible results

**Validation Depth**:
- Component-level: Individual service validation
- Flow-level: End-to-end data flow validation
- Performance-level: Latency, throughput, cost analysis
- Error-handling: Failure scenarios and recovery

**Status Determination**:
- **PASS**: All checkpoints pass, performance targets met, no critical issues
- **PARTIAL**: Functional with performance warnings or non-critical issues
- **FAIL**: Critical failures, performance targets missed, data corruption

**Report Generation**:
- Detailed technical report for developers
- Executive summary for project stakeholders
- Actionable recommendations with priority levels
- Performance benchmarks and trend analysis

---

## Integration Points

**Input Dependencies**:
- `spec.md` - Performance targets and flow requirements
- `plan.md` - API contracts and service boundaries
- `arch.md` - System architecture and data flows
- `packages/shared/src/schemas/flows/` - Validation schemas

**Output Used By**:
- Development team - Issue identification and fixing
- Performance monitoring - Benchmark establishment
- QA team - Test case enhancement
- Product team - Feature readiness assessment

**Related Commands**:
- `/speckit.test` - Integration testing (after flow validation)
- `/speckit.verify-tasks` - Task validation (before implementation)
- `/speckit.analyze` - Cross-artifact consistency analysis

**Files Created**:
- `$FEATURE_DIR/flow-validation-${FLOW}.md` - Detailed validation report
- `/tmp/flow-metrics.json` - Raw performance metrics
- Test data files for reproducible validation