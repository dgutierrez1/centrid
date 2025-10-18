# Centrid - UX/UI Interaction Design Analysis

**Version**: 2.0  
**Date**: 2024-01-15  
**Status**: MVP-Focused Design Analysis  
**Purpose**: Simplified UX design for rapid MVP development

---

## 🎯 **Core UX Challenge**

Users need seamless flow between three key workflows:

1. **AI Conversations** - Chat with agents about documents
2. **Document Work** - Read, edit, and manage files
3. **Change Management** - Review and approve AI-generated changes

**The Problem with Single-Focus Approaches:**

- **Chat-centric**: Hard to read/edit documents directly
- **Document-centric**: Hard to see AI conversation context
- **Change-centric**: Disconnected from source conversation and documents

---

## 💡 **MVP Solution: Simple Context-Aware Interface**

**Core Philosophy**: Simple interface with basic context awareness - no complex state management.

### **MVP Design Principles**

1. **Simple Navigation** - Clear sections with basic back/forward
2. **Minimal Context** - Just show essential related information
3. **Linear Flows** - One task at a time, especially on mobile
4. **Basic Cross-References** - Simple clickable links between sections

---

## 🌊 **Simplified MVP User Flows**

### **Flow 1: Basic AI Chat with Document Reference**

#### **Desktop MVP:**

**Step 1: Simple Chat Interface**

```
┌─ Header: Centrid AI Assistant ─────────────────── [⚙️] ─┐
├─ Chat Sidebar ──────┬─ Main Chat Area ──────────────────┤
│ 💬 Recent Chats     │                                   │
│ • Project Planning  │ User: "Add metrics to overview    │
│ • Documentation     │ section of the status report"     │
│ • Content Ideas     │                                   │
│                     │ AI: "I'll help you add metrics.   │
│ 🆕 New Chat         │ Let me reference your project     │
│                     │ status report."                   │
│ 📂 My Documents     │                                   │
│ • project.md        │ Referenced: 📄 project.md         │
│ • meeting.txt       │ [Open Document]                   │
│ • specs.pdf         │                                   │
│                     │ Type your message...              │
│                     │ [Send]                            │
└─────────────────────┴───────────────────────────────────┘
```

**Step 2: Simple Document View**

```
┌─ Header: project.md ──────────── [← Back to Chat] [⚙️] ─┐
├─────────────────────────────────────────────────────────┤
│                                                         │
│ # Project Status Report                                 │
│                                                         │
│ ## Executive Summary                                    │
│ Our Q4 progress has been excellent...                  │
│                                                         │
│ ## Overview                                             │
│ [Content can be edited here]                           │
│                                                         │
│ ## Key Achievements                                     │
│ - Feature A launched                                    │
│ - Team grew by 50%                                      │
│                                                         │
│ ┌─ Actions ──────────────────────────────────────────┐   │
│ │ [💬 Ask AI] [📝 Edit] [💾 Save] [📤 Share]        │   │
│ └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### **Mobile MVP:**

**Step 1: Simple Chat**

```
┌─ Header: AI Assistant ──────────────── [⚙️] ─┐
│                                             │
│ User: Add metrics to overview section       │
│                                             │
│ AI: I'll help you add metrics. Let me      │
│ reference your project status report.      │
│                                             │
│ 📄 project.md                              │
│ [Tap to Open]                              │
│                                             │
│ ┌─ Message Input ─────────────────────────┐ │
│ │ Type message...              [Send]    │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [💬 Chat] [📂 Files] [⚙️ Settings]        │
└─────────────────────────────────────────────┘
```

**Step 2: Document View**

```
┌─ Header: project.md ──────── [← Chat] [⚙️] ─┐
│                                             │
│ # Project Status Report                     │
│                                             │
│ ## Executive Summary                        │
│ Our Q4 progress has been excellent...      │
│                                             │
│ ## Overview                                 │
│ [Editable content area]                    │
│                                             │
│ ## Key Achievements                         │
│ - Feature A launched                        │
│ - Team grew by 50%                          │
│                                             │
│ ┌─ Quick Actions ─────────────────────────┐ │
│ │ [💬 Ask AI] [📝 Edit] [💾 Save]        │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [💬 Chat] [📂 Files] [⚙️ Settings]        │
└─────────────────────────────────────────────┘
```

### **Flow 2: Simple AI Suggestions (MVP)**

#### **Desktop MVP:**

**AI Suggestion in Document**

```
┌─ Header: project.md ──────────────────────── [⚙️] ─┐
├─────────────────────────────────────────────────────┤
│ # Project Status Report                             │
│                                                     │
│ ## Executive Summary                                │
│ Our Q4 progress has been excellent...              │
│                                                     │
│ ## Overview                                         │
│ • Monthly active users: 50K                        │
│ • Revenue growth: 30%                              │
│                                                     │
│ ┌─ AI Suggestion ─────────────────────────────────┐ │
│ │ 💡 AI suggests: "Add customer satisfaction      │ │
│ │ score to complete your metrics"                  │ │
│ │                                                  │ │
│ │ Suggested addition:                              │ │
│ │ "• Customer satisfaction: 4.8/5"                │ │
│ │                                                  │ │
│ │ [✅ Apply] [✏️ Edit] [❌ Dismiss] [💬 Discuss]  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                     │
│ ## Key Achievements                                 │
│ - Feature A launched                                │
│ - Team grew by 50%                                  │
└─────────────────────────────────────────────────────┘
```

#### **Mobile MVP:**

**Simple AI Suggestion on Mobile**

```
┌─ Header: project.md ────────────────── [⚙️] ─┐
│                                             │
│ # Project Status Report                     │
│                                             │
│ ## Overview                                 │
│ • Monthly active users: 50K                │
│ • Revenue growth: 30%                      │
│                                             │
│ ┌─ AI Suggestion ─────────────────────────┐ │
│ │ 💡 Add customer satisfaction score?     │ │
│ │                                         │ │
│ │ "• Customer satisfaction: 4.8/5"       │ │
│ │                                         │ │
│ │ [✅ Apply] [❌ Dismiss] [💬 Ask AI]     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
├─────────────────────────────────────────────┤
│ [💬 Chat] [📂 Files] [⚙️ Settings]        │
└─────────────────────────────────────────────┘
```

---

## 🎛️ **MVP Implementation Components**

These simplified wireframes focus only on critical MVP functionality:

### **Core Components Needed:**

1. **Simple Chat Interface**

   - Basic message list and input
   - File references as clickable links
   - Minimal sidebar with recent chats

2. **Basic Document Viewer**

   - Simple markdown rendering
   - Basic editing capabilities
   - Back navigation to chat

3. **AI Suggestion Overlay**
   - Simple suggestion display within document
   - Three-button approval: Apply/Dismiss/Discuss
   - No separate change management interface

### **Removed for MVP:**

- ❌ Complex context switching
- ❌ Split view modes
- ❌ Advanced cross-referencing
- ❌ Multiple simultaneous panels
- ❌ Rich metadata displays
- ❌ Complex state preservation
- ❌ Separate change management interface
- ❌ Advanced workflow tracking

### **MVP Success Metrics:**

- ✅ Users can chat with AI about documents
- ✅ Users can view/edit referenced documents
- ✅ Users can approve/reject AI suggestions
- ✅ Basic functionality works on mobile and desktop
- ✅ Simple navigation between chat and documents

---

## 🚀 **MVP Implementation Plan**

### **Week 1-2: Basic Chat Interface**

- Simple chat UI with message list and input
- File upload and basic document list
- Clickable document references in chat

### **Week 3-4: Document Viewer**

- Basic markdown rendering and editing
- Simple back navigation to chat
- Basic save functionality

### **Week 5-6: AI Suggestions**

- AI suggestion overlay in documents
- Simple approve/reject buttons
- Basic integration with chat context

### **Week 7-8: Polish & Mobile**

- Mobile-responsive design
- Touch interactions
- Basic error handling

This simplified approach ensures MVP launches quickly while proving core value proposition without complex context management.
