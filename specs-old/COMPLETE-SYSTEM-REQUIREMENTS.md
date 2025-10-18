# Centrid - MVP System Requirements

**Version**: 3.0 (Context-First MVP)  
**Date**: 2025-01-15  
**Status**: Implementation Ready

> **Note**: This document reflects the **context-first MVP** focused on persistent document context across multiple independent chats. Features that have been deferred to post-MVP are documented in [POST-MVP-FEATURES.md](./POST-MVP-FEATURES.md).
>
> **Core Value Proposition**: AI for knowledge work with persistent context - upload documents once, access across unlimited chats, eliminate context re-explanation.

---

## 📋 **Complete System Requirements**

### **🏗️ Core System Architecture Requirements**

#### **Multi-Chat System Requirements (MVP - Core)**

- **Independent Chats**: Users can create unlimited independent conversation threads
- **Shared Document Context**: All chats have access to user's full document library automatically
- **Chat Management**: Create, rename, delete, search chats
- **Chat Persistence**: Full conversation history stored per chat
- **Chat Switching**: Seamless switching between chats without losing context

#### **Persistent Document Context Requirements (MVP - Core)**

- **Upload Once**: Documents uploaded to user's library, accessible across all chats
- **Vector Embeddings**: Document chunks converted to embeddings for semantic retrieval
- **RAG (Retrieval Augmented Generation)**: Relevant document context automatically retrieved per message
- **Context Citations**: Show which documents informed each AI response
- **Document Library**: Centralized document management accessible from any chat

#### **AI Integration Requirements (MVP - Simplified)**

- **Claude API**: Single AI model (Claude) for all chat completions
- **Context Retrieval**: Automatic semantic search across documents for relevant context
- **Response Generation**: Claude generates responses using retrieved document context
- **Usage Tracking**: Simple message counter per user for billing
- **Retry Logic**: Basic retry mechanism for AI API failures

#### **Document Manager Requirements (MVP - Simplified)**

- **Atomic Updates**: Transaction-based document modification system
- **Auto-Sync**: Automatic synchronization between devices (last-write-wins)
- **Format Preservation**: Document structure and formatting maintenance
- **Basic Backup**: Automated daily backups only

#### **Web Application UI Requirements (MVP - Simplified)**

- **Desktop-Optimized Web App**: Primary focus on desktop/laptop experience
- **Responsive Design**: Works on tablets and mobile browsers (secondary priority)
- **Three-Panel Layout**: Documents (left) + Chat (middle) + Chat List/Context (right)
- **Performance**: Sub-2-second page loads, instant chat switching
- **Accessibility**: WCAG 2.1 AA compliance for accessibility

---

### **📄 Multi-Format File Processing Requirements**

#### **File Upload Requirements (MVP - Simplified)**

- **Supported Formats**: Markdown (.md), Plain Text (.txt), PDF (.pdf)
- **File Size Limits**: Individual files up to 10MB, unlimited total storage (for $25/month plan)
- **Validation**: Client-side and server-side file type and content validation
- **Simple Upload**: Drag-and-drop or file picker with progress indicators
- **Folder Organization**: Basic folder structure for document organization
- **Local Upload Only**: Direct file upload from device (no external cloud connections for MVP)

#### **Document Processing Requirements (MVP - Simplified)**

- **Text Extraction**: Content extraction from Markdown, plain text, and PDF files
- **PDF Processing**: Text extraction from PDFs using standard libraries
- **Structure Analysis**: Basic document metadata extraction (title, word count, upload date)
- **Format Parsers**: Simple Markdown parser for structure detection
- **Vector Embedding Generation**: Automatic chunk embedding creation for semantic search
- **Background Processing**: Asynchronous processing queue with basic status tracking

#### **Search Index Requirements (MVP - Core)**

- **Vector Search**: PostgreSQL with pgvector extension for semantic similarity search
- **Embedding Storage**: 1536-dimensional vectors stored per document chunk
- **Semantic Retrieval**: Cosine similarity search for relevant context retrieval
- **Full-Text Search**: PostgreSQL full-text search as fallback/supplement
- **File Name Indexing**: Fast searching across document titles and file names
- **Search Performance**: Sub-500ms semantic search response times
- **Search Filters**: Filter by file type, date range, and basic metadata

---

### **💬 AI Chat System Requirements**

#### **Chat Interface Requirements (MVP - Core)**

- **Conversational UI**: Natural chat interface for all AI interactions
- **Message History**: Full conversation history preserved per chat
- **Streaming Responses**: Real-time response streaming for better UX
- **Context-Aware**: AI automatically retrieves relevant document context per message
- **Source Citations**: Display which documents informed each AI response
- **Message Actions**: Copy, edit, regenerate, delete messages

#### **Context Retrieval (RAG) Requirements (MVP - Core)**

- **Automatic Retrieval**: System automatically finds relevant documents per user message
- **Semantic Search**: Vector similarity search across user's document library
- **Context Assembly**: Retrieved chunks assembled into coherent context for Claude
- **Relevance Ranking**: Most relevant documents prioritized in context
- **Context Window Management**: Manage token limits (e.g., 10k-20k tokens context)
- **Source Tracking**: Track which documents contributed to each response

#### **AI Response Generation Requirements (MVP - Simplified)**

- **Claude Integration**: Single AI model (Claude) for all responses
- **Context-Augmented**: Responses generated using retrieved document context
- **Response Quality**: High-quality, contextually-relevant responses
- **Error Handling**: Graceful handling of API failures with retry logic
- **Cost Tracking**: Monitor API costs per user for billing
- **Response Formatting**: Markdown-formatted responses with code highlighting

---

### **🔄 User Experience Requirements**

#### **Status Updates (CRITICAL - MVP Simplified)**

- **Document Processing Status**: Real-time progress indicators during file upload and embedding generation
- **Chat Response Status**: Live status updates during AI response generation (thinking, retrieving context, generating)
- **Connection Management**: WebSocket/Server-Sent Events for real-time chat communication
- **Typing Indicators**: Show when AI is "thinking" or generating response
- **Progress Indicators**: Visual feedback for all long-running operations

#### **Document Organization & Navigation (CRITICAL - MVP Simplified)**

- **Document List View**: Grid/list view of user's documents with sorting and filtering
- **Document Search**: Basic search within user's document collection by name and content
- **Document Metadata Display**: Show file size, upload date, processing status, word count
- **Empty State**: Welcoming first-time user experience with sample content or guided setup
- **Document Actions**: Rename, delete, duplicate documents with confirmation dialogs

#### **Chat Management Interface Requirements (CRITICAL - MVP Core)**

- **Chat List**: Sidebar showing all user chats with titles and previews
- **Chat Creation**: One-click chat creation from any screen
- **Chat Switching**: Instant switching between chats without page reload
- **Chat Renaming**: Easy renaming of chats for organization
- **Chat Search**: Search across chat titles and message history
- **Chat Deletion**: Delete chats with confirmation dialog

#### **Document-Chat Integration Requirements (MVP - Core)**

- **Document Viewer**: View and edit documents within the app
- **Document References**: Click cited documents to view full content
- **Context Preview**: See which document sections are being used per message
- **Document Actions**: Quick actions from chat (view, edit, delete documents)
- **Document Upload from Chat**: Upload new documents directly from chat interface

#### **Error Handling & User Communication (CRITICAL)**

- **User-Friendly Errors**: Convert technical errors into understandable messages
- **AI API Failures**: Graceful handling of Claude API failures with retry options and fallback messaging
- **Network Issues**: Clear communication when offline or experiencing connectivity problems
- **Upload Failures**: Failed upload recovery with resume capability
- **Validation Errors**: Inline validation with specific error guidance
- **System Maintenance**: Maintenance mode communication and graceful degradation
- **Context Retrieval Errors**: Handle cases where relevant context cannot be found

#### **Content Safety & Quality Control (MVP - Basic Only)**

- **AI Output Validation**: Basic validation of AI-generated content for safety
- **Content Filtering**: Basic prompt filtering to prevent harmful requests
- **Response Logging**: Simple logging of AI responses for debugging

---

## 📋 **Step-by-Step User Journeys**

### **🚨 Critical User Journeys (MVP Blockers)**

#### **Journey 1: New User Onboarding & First Context-Aware Chat**

**User Goal**: New user discovers the platform, signs up, uploads documents, and successfully experiences persistent context across chats.

**Step 1 - Discovery & Landing**

1. User visits `centrid.ai` from search/referral
2. User sees hero message: "AI For Knowledge Work With Persistent Context"
3. User watches 30-second demo video showing multi-chat with persistent document context
4. User clicks "Start Working Smarter" button (7-day free trial, no credit card)

**Step 2 - Account Creation**

1. User lands on signup form with fields: Email, Password, Confirm Password
2. User fills out form and clicks "Create Account"
3. User sees message: "Check your email to verify your account"
4. User opens email and clicks verification link
5. User redirected to welcome screen: "Welcome to Centrid! Start your first context-aware chat."

**Step 3 - Context Introduction**

1. User sees interactive tutorial explaining persistent context:
   - "Upload your documents once"
   - "Create unlimited chats"
   - "Every chat accesses your full document context"
   - "Never re-explain context to AI"
2. User clicks "Next" to continue
3. User sees choice: "Try with sample documents" or "Upload your own documents"

**Step 4 - Guided First Chat (Sample Path)**

1. User clicks "Try with sample documents"
2. System loads 3 sample documents: "API Guide", "User Manual", "FAQ" into document library
3. System automatically creates first chat: "Getting Started"
4. User sees guided prompt: "Try asking: 'What are the main features in our API?'"
5. User types or clicks the suggested question
6. User clicks "Send" or presses Enter

**Step 5 - First Context-Aware Response**

1. User sees AI "thinking" indicator with context retrieval status
2. User sees which documents are being referenced in real-time
3. AI response streams in with relevant information from documents
4. User sees source citations: "Based on API Guide (sections 2.1, 3.4) and User Manual (section 1.2)"
5. User can click citations to view full document sections

**Step 6 - Multi-Chat Experience & Success**

1. User sees prompt: "Try creating another chat for a different topic"
2. User clicks "+ New Chat" button
3. New chat created, user asks different question
4. User sees AI has access to same documents automatically (persistent context)
5. User sees success celebration: "🎉 You've experienced persistent context!"
6. User sees next step: "Upload your own documents to unlock full power"

**Alternative Path - Upload Own Documents**

1. User clicks "Upload your own documents" in Step 3
2. Proceeds directly to Journey 2 (Document Upload)
3. After upload completion, returns to guided first request with their content

---

#### **Journey 2: Document Upload & Processing**

**User Goal**: User uploads their personal documents to enhance AI agent context and capabilities.

**Step 1 - Upload Initiation**

1. User clicks "Upload Documents" button from main dashboard
2. User sees upload interface with drag-and-drop zone and "Browse Files" button
3. User sees supported formats: "Supported: .md, .txt, .pdf (up to 10MB each)"
4. User sees current storage usage: "2.3GB used of 50GB available"

**Step 2 - File Selection & Validation**

1. User drags 5 files into upload zone or clicks "Browse Files"
2. System validates files:
   - ✅ project-notes.md (2.1MB)
   - ✅ meeting-minutes.txt (0.8MB)
   - ❌ video-file.mp4 (45MB) - "Unsupported format"
   - ✅ user-research.pdf (8.2MB)
   - ❌ large-document.pdf (12MB) - "File too large (max 10MB)"
3. User sees validation results with option to proceed with valid files or fix errors

**Step 3 - Upload Progress**

1. User clicks "Upload 3 Valid Files" button
2. User sees per-file progress bars:
   - project-notes.md: [████████████████████] 100% ✅ Uploaded
   - meeting-minutes.txt: [██████████████████▒▒] 90% ⏳ Uploading...
   - user-research.pdf: [██████▒▒▒▒▒▒▒▒▒▒▒▒▒▒] 30% ⏳ Uploading...
3. User can continue using app during upload (non-blocking)

**Step 4 - Processing Status**

1. Files transition to processing after upload:
   - project-notes.md: ⚙️ Processing... (extracting content)
   - meeting-minutes.txt: ✅ Ready (processed successfully)
   - user-research.pdf: ⚙️ Processing... (extracting text from PDF)
2. User sees notification: "Processing in background - continue using the app"
3. User can view processing details by clicking on each file

**Step 5 - Completion & Integration**

1. User sees completion notification: "3 documents processed successfully"
2. User sees updated agent context: "AI agents now understand 6 documents (3 new)"
3. User sees suggested next action: "Try asking about your uploaded content"
4. Documents appear in document list with metadata:
   - project-notes.md | 1,234 words | Just now | Ready
   - meeting-minutes.txt | 567 words | 2 min ago | Ready
   - user-research.pdf | 2,890 words | 3 min ago | Ready

**Error Recovery Path**

1. If processing fails: User sees "❌ Processing failed" with retry button
2. User clicks "Retry" or "Get Help" for support
3. System provides specific error message and resolution steps

---

#### **Journey 3: Core Multi-Chat Workflow**

**User Goal**: User works across multiple chats with persistent document context, experiencing the core value proposition.

**Step 1 - Starting a Knowledge Work Chat**

1. User has uploaded documents: project-notes.md, meeting-minutes.txt, user-research.pdf
2. User creates new chat named "Q1 Strategy"
3. User sees document library in left sidebar, chat interface in center
4. User types: "Summarize key decisions from our Q1 planning meetings"
5. User presses Enter to send message

**Step 2 - Context-Aware Response**

1. System automatically searches documents for relevant context
2. User sees "thinking" indicator with context retrieval status
3. User sees which documents are being referenced: "Searching project-notes.md, meeting-minutes.txt"
4. AI response streams in with summary of key decisions
5. Response includes citations: "From meeting-minutes.txt (Jan 15, Feb 3)"

**Step 3 - Branching to New Topic**

1. User needs to work on different topic without losing main thread
2. User clicks "+ New Chat" button
3. New chat created: "User Feedback Analysis"
4. User types: "What are the main pain points from user research?"
5. System automatically has access to user-research.pdf (persistent context)
6. AI responds with insights from research document

**Step 4 - Switching Between Chats**

1. User wants to return to Q1 Strategy chat
2. User clicks on "Q1 Strategy" in chat list sidebar
3. Chat instantly switches, full conversation history preserved
4. User continues conversation: "Create action items from these decisions"
5. AI continues with same document context, no need to re-explain

**Step 5 - Experiencing Persistent Context Value**

1. User realizes they never re-uploaded or re-explained documents
2. Both chats have access to all documents automatically
3. User can freely explore topics without losing context
4. User sees clear difference from ChatGPT (where they'd need to copy/paste context)

**Step 6 - Creating Additional Chats**

1. User creates third chat: "Competitive Analysis"
2. User asks: "Compare our approach to competitors mentioned in research"
3. AI automatically pulls from user-research.pdf
4. User maintains 3 concurrent chats, all with full document context
5. User sees value: "This is way better than ChatGPT"

**Success Outcome**

- User has 3+ active chats with different topics
- All chats have persistent access to document context
- User never had to re-upload or re-explain documents
- User experiences core value proposition: persistent context for knowledge work

---

#### **Journey 4: Document Management & Organization**

**User Goal**: User needs to find, organize, and manage their growing document collection.

**Step 1 - Accessing Document Library**

1. User clicks "Documents" in main navigation
2. User sees document list with current view: Grid view, sorted by "Recent"
3. User sees 12 documents with previews:
   - Status Report | AI Generated | 2 hours ago | 892 words
   - project-notes.md | Uploaded | 1 day ago | 1,234 words
   - API Guide | Sample | 3 days ago | 2,156 words
4. User sees search bar: "Search your documents..." with filter options

**Step 2 - Search & Discovery**

1. User types "API" in search bar
2. User sees instant results as they type:
   - API Guide (sample document)
   - project-notes.md (contains "API integration" section)
   - Status Report (mentions "API development")
3. User sees search filters appear: [All Types] [Created by AI] [Uploaded] [Date Range]
4. User can click any result to preview or open

**Step 3 - Document Organization**

1. User wants to organize documents, clicks "Sort & Filter" dropdown
2. User sees options: [Recent] [Name A-Z] [Size] [Type] [Word Count]
3. User selects "Name A-Z" to alphabetically sort documents
4. User sees view options: [Grid View] [List View] [Table View]
5. User switches to List View for more detailed information

**Step 4 - Document Actions**

1. User right-clicks (or long-presses on mobile) on "old-notes.md"
2. User sees context menu:
   - 👁️ View Document
   - ✏️ Edit with AI Agent
   - 🏷️ Rename
   - 📋 Duplicate
   - 📤 Export
   - 🗑️ Delete
3. User selects "Rename"
4. User types new name: "archived-meeting-notes.md"
5. User presses Enter to confirm

**Step 5 - Bulk Operations**

1. User selects multiple documents using checkboxes
2. User sees bulk action bar appear: "3 documents selected"
3. User sees bulk options: [Export All] [Delete Selected]
4. User clicks "Export All"
5. User chooses export format: [Original] [PDF] [HTML] [Archive (ZIP)]
6. User clicks "Download" and receives zip file

**Step 6 - Document Details**

1. User clicks on "Status Report" to view details
2. User sees document viewer with:
   - Full content in reading mode
   - Metadata panel: Creation date, word count, AI model used, processing time
   - Related documents: "Based on project-notes.md and meeting-minutes.txt"
   - Edit options: "Ask AI to revise", "Edit manually", "Create similar"
3. User can seamlessly transition to editing or creating new content

**Empty State Path**

1. New user with no documents sees welcoming empty state:
   - "Your AI agents are ready to help with your content"
   - "Upload documents or try sample content to get started"
   - Large upload button and "Try Sample Documents" option
2. Clear onboarding flow to first content upload

---

### **⭐ Important User Journeys (Strong UX Enhancement)**

#### **Journey 5: Account Settings & Billing Management**

**User Goal**: User wants to upgrade from free trial to paid plan and manage billing.

**Key Steps Include**: Trial ending notification → Simple upgrade CTA → Plan details ($25/month, everything included) → Payment processing (Stripe) → Immediate plan activation → Usage dashboard showing unlimited chats and documents.

---

#### **Journey 6: Cross-Device Context Continuity**

**User Goal**: User works on desktop, then continues on tablet/mobile seamlessly with persistent context.

**Key Steps Include**: Desktop chat creation → Mobile browser access → Same chat history and document context → Continue conversation from any device → Real-time sync across devices.

---

### **🔄 Supporting User Journeys (Foundation)**

#### **Journey 7: Error Recovery & Troubleshooting**

**User Goal**: User encounters an error and needs to successfully recover without losing work or getting frustrated.

**Key Steps Include**: AI API failure with clear recovery options → Model switching fallbacks → Network connection loss with offline queuing → File upload resume capability → Contextual help system with bilingual support (Spanish/English).

---

#### **Journey 8: Document Search & Research**

**User Goal**: User needs to find specific information across their document collection and synthesize insights.

**Key Steps Include**: Global search with instant results → Search refinement with filters → Research Agent integration → Cross-document analysis with progress tracking → Structured research summary with source links → Follow-up action options.

---

#### **Journey 9: Data Export & Privacy Management**

**User Goal**: User wants to export their data and manage privacy settings (GDPR compliance scenario).

**Key Steps Include**: Privacy settings access → Data export request with format options → Export processing with email delivery → Privacy control management → Account deletion options with data preservation choices → Complete GDPR compliance workflow.

---

**Additional Journey Details**: Each supporting journey follows the same detailed step-by-step format as the critical journeys above, including specific user actions, system responses, alternative paths, and error handling scenarios. The complete journey specifications provide implementation teams with precise UX requirements for building each flow.

---

### **💾 Data Storage & Management Requirements**

#### **Database Requirements (MVP - Simplified)**

- **PostgreSQL**: Primary database with ACID compliance via Supabase
- **Full-Text Search**: PostgreSQL built-in full-text search capabilities (no vector search)
- **Basic Indexing**: Essential indexes for text search and standard queries
- **Simple Backups**: Daily automated backups via Supabase
- **Performance**: Sub-second query response times for MVP scale

#### **File Storage Requirements (MVP - Simplified)**

- **Supabase Storage**: Basic encrypted file storage for .md and .txt files
- **Access Control**: Secure file access with signed URLs
- **Basic Backup**: Automated backup via Supabase
- **Metadata**: Essential metadata storage (filename, upload date, word count)

---

### **🔐 Security & Privacy Requirements**

#### **Authentication & Authorization Requirements (MVP - Simplified)**

- **Auth**: Email/password only via Supabase Auth
- **Session Management**: Secure session handling with automatic timeout
- **API Security**: JWT-based API authentication with rate limiting
- **Basic Logging**: Simple authentication event logging

#### **Data Protection Requirements**

- **Encryption at Rest**: AES-256 encryption for all stored data
- **Encryption in Transit**: TLS 1.3 for all data transmission
- **PII Handling**: Automatic PII detection and protection mechanisms
- **GDPR Compliance**: Full GDPR compliance with data export/deletion
- **Zero-Trust Architecture**: Security model assuming no trusted network perimeter

#### **Content Security Requirements (MVP)**

- **Input Validation**: Basic input sanitization and validation
- **Output Filtering**: Basic content filtering to prevent harmful outputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **Basic Security**: Essential security measures and monitoring

---

### **📊 Analytics & Monitoring Requirements (MVP - Minimal)**

#### **Essential Monitoring Only**

- **Error Tracking**: Basic error logging and alerting (Sentry or similar)
- **Simple Metrics**: Basic request counter per user for billing
- **Agent Usage**: Simple log of which agents are used
- **Error Tracking**: Basic error logging and alerting
- **Performance Monitoring**: Basic application performance monitoring

---

### **💰 Billing & Usage Management Requirements**

#### **Subscription Management Requirements (MVP - Simplified)**

- **Stripe Integration**: Subscription billing and payment processing via Stripe
- **Simple Pricing**: $25/month, everything included (unlimited documents, unlimited chats, all features)
- **7-Day Free Trial**: No credit card required for trial signup
- **Usage Tracking**: Simple message counter for monitoring (no hard limits for MVP)
- **Simple Billing**: Monthly billing with email receipts via Stripe
- **Payment Methods**: Credit/debit cards via Stripe

#### **Usage Quota Requirements (MVP - Simplified)**

- **Request Counting**: Accurate request counting based on AI model usage
- **Real-time Limits**: Real-time enforcement of usage limits
- **Usage Analytics**: Detailed usage reporting for users and administrators

---

### **🚀 Performance Requirements**

#### **Response Time Requirements**

- **Agent Response**: AI agent responses within 10 seconds average

#### **Scalability Requirements**

- **Concurrent Users**: Support for 1,000+ concurrent active users
- **API Throughput**: 10,000+ API requests per minute capability

---

### **📱 Mobile & Cross-Platform Requirements (MVP - Simplified)**

#### **Mobile-Responsive Web App**

- **Responsive Design**: Mobile-first responsive web application (no PWA installation for MVP)
- **Works on Mobile Browsers**: Full functionality on Safari, Chrome mobile
- **Future-Ready Architecture**: Code structured for future React Native transition

---

### **🌐 Marketing & Landing Page Requirements**

#### **Landing Page Requirements**

- **Hero Section**: Clear value proposition "AI Agents for Content Creation"
- **Demo Video**: 2-minute screen recording showing agent workflows
- **Feature Highlights**: Core agent capabilities (Create, Edit, Research)
- **Pricing Display**: Simple pricing tiers with clear feature comparison
- **Email Signup**: Waitlist/early access signup with email validation
- **Mobile Optimization**: Responsive design optimized for mobile viewing

#### **SEO & Content Requirements**

- **Technical SEO**: Proper meta tags, structured data, sitemap
- **Content Strategy**: Blog posts about AI productivity and content creation
- **Keyword Targeting**: "AI writing assistant", "markdown productivity", "content creation AI"
- **Analytics Setup**: Google Analytics, conversion tracking, heatmaps
- **Performance Optimization**: Fast loading times, Core Web Vitals compliance

#### **Marketing Automation Requirements (MVP - Simplified)**

- **Email Sequences**: Basic welcome email only
- **User Onboarding**: Simple first-time user tutorial
- **No A/B Testing**: Single version for MVP launch

---

### **👤 Account Management Requirements**

#### **User Account Requirements**

- **Account Creation**: Email/password signup with verification
- **Email Verification**: Required email verification before account activation
- **Password Reset**: Secure password reset flow with email confirmation
- **Profile Management**: User profile, preferences, account settings
- **Subscription Management**: Plan selection, payment method, billing history
- **Usage Dashboard**: Request consumption, remaining quota, upgrade options
- **Account Security**: Two-factor authentication options, session management
- **Account Deletion**: Complete account deletion with data export (GDPR compliance)

#### **User Settings & Preferences (MVP - Minimal)**

- **Basic Profile**: Email, password change only
- **No AI Preferences**: Claude Sonnet is the only model

#### **Billing Integration Requirements (MVP - Simplified)**

- **Mercado Pago Integration**: Subscription billing via Suscripciones (Colombian market)
- **Plan Upgrades**: Simple free to paid upgrade flow
- **Invoice Generation**: Automated billing with email receipts
- **Payment Failures**: Basic retry logic with email notification

---

### **🔧 Integration Requirements**

#### **Third-Party Service Requirements (MVP - Core Only)**

- **Anthropic API**: Claude for all AI chat completions
- **OpenAI API**: Embeddings generation (text-embedding-3-small) for vector search
- **Supabase**: Database (PostgreSQL + pgvector), storage, and authentication
- **Stripe**: Subscription billing and payment processing
- **Vercel**: Hosting and deployment platform
- **Error Tracking**: Sentry or similar for basic error monitoring

#### **Import/Export Requirements (MVP - Simplified)**

- **Export**: Simple download of original Markdown/text files only (no format conversion)

---

### **⚖️ Legal & Compliance Requirements (MVP)**

#### **Legal Pages & Policies**

- **Terms of Service**: Clear terms of service with AI usage policies
- **Privacy Policy**: GDPR-compliant privacy policy with data handling details
- **Cookie Policy**: Cookie usage disclosure and consent management
- **AI Usage Policy**: Clear guidelines on AI-generated content ownership and usage
- **Content Guidelines**: Community guidelines for acceptable content

#### **Compliance Features**

- **Cookie Consent**: EU-compliant cookie consent banner with granular controls
- **Data Processing Consent**: Explicit consent for AI processing of user content
- **Right to be Forgotten**: Complete data deletion capabilities
- **Data Portability**: User data export in machine-readable format
- **Audit Logging**: Complete audit trail of data processing activities

---

### **🛠️ Development & Operations Requirements (MVP - Simplified)**

#### **Development Workflow**

- **Environment Management**: Separate dev/production environments only
- **Database Migrations**: Safe database migration system with rollback capability
- **No Feature Flags**: Direct deployment to production

#### **Support & Help System (MVP - Minimal)**

- **Help Documentation**: Basic help page with FAQ
- **Contact Support**: Email support only
- **User Feedback**: Simple email-based feedback

#### **Admin & Operations (MVP - No Dashboard)**

- **Direct Database Access**: Admin operations via database queries
- **Basic Monitoring**: Error tracking via Sentry
- **No Admin UI**: Will add when user base grows to 100+

---

## 📝 **MVP Scope Summary**

### **What's Included in MVP:**

✅ **Multi-Chat System**: Create unlimited independent chats with full conversation history  
✅ **Persistent Document Context**: Upload documents once, access across all chats automatically  
✅ **Vector Search (RAG)**: Semantic search with pgvector for relevant context retrieval  
✅ **Document Management**: Upload .md/.txt/.pdf with folder organization, basic list/search, rename/delete  
✅ **Web-First UI**: Desktop-optimized web application, responsive for tablets/mobile  
✅ **Authentication**: Email/password via Supabase Auth  
✅ **Billing**: Stripe integration with $25/month plan, 7-day trial (no credit card)  
✅ **Context Citations**: Show which documents informed each AI response  
✅ **Basic Monitoring**: Error tracking and simple usage counters

### **Development Time Estimate:**

- **Context-First MVP**: 8-10 weeks
- **Core Value Delivered**: Persistent context across conversations for knowledge work
- **Key Differentiator**: Only solution offering multi-chat with shared document context

### **Next Steps:**

1. Review and approve this context-first MVP scope
2. Begin implementation following [implementation plan](./implementation-plan/00-MASTER-IMPLEMENTATION-PLAN.md)
3. Launch MVP to first 20-50 power AI users experiencing context fragmentation
4. Measure key metrics: ≥2 chats created per user, 70%+ reduction in context re-explanation
5. Gather feedback and prioritize post-MVP features (chat history awareness, team features)
