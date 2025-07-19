# How to Create Task Tickets

This guide provides a structured approach to creating task tickets for the BlaBlaBlaGPT prompt refinement application. Use this template every time you need to add a feature, fix a bug, or make improvements.

## Project Overview

**BlaBlaBlaGPT** is a prompt refinement application with:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + TypeScript + Express
- **Architecture**: Multi-provider AI integration (OpenAI, Anthropic)
- **Key Features**: Prompt refinement, question suggestions, provider selection

## Ticket Creation Steps

### 1. **Analyze the Feature/Task**

Before creating a ticket, understand:

- **User Need**: What problem does this solve?
- **User Journey**: How will users interact with this feature?
- **Business Value**: Why is this important?
- **Technical Impact**: What parts of the system are affected?

### 2. **Choose Ticket Type**

- 🆕 **Feature**: New functionality
- 🐛 **Bug**: Fix existing issues
- 🔧 **Enhancement**: Improve existing features
- 📚 **Documentation**: Update docs or comments
- 🏗️ **Technical Debt**: Refactoring, optimization
- 🧪 **Testing**: Add/improve tests

### 3. **Write the Ticket Title**

Format: `ticket_<ticket number>_<feature name shortly>`

Where:

- **ticket number**: Sequential number that increments with each new ticket (e.g., 001, 002, 003...). Always use the next available number in sequence.
- **feature name shortly**: Brief description of the feature/fix (use underscores instead of spaces)

**Examples:**

- `ticket_001_conversation_history_sidebar`
- `ticket_002_fix_provider_switching_bug`
- `ticket_003_improve_prompt_validation`

### 4. **Define the Problem/Opportunity**

```markdown
## Problem Statement

Clearly describe what needs to be addressed:

- Current state vs desired state
- User pain points
- Technical limitations
```

### 5. **Specify Requirements**

```markdown
## Requirements

### Functional Requirements

- [ ] Specific behavior the feature must have
- [ ] User interactions and expected responses
- [ ] Data requirements and constraints

### Non-Functional Requirements

- [ ] Performance expectations
- [ ] Accessibility requirements
- [ ] Browser compatibility
- [ ] Mobile responsiveness (if applicable)
```

### 6. **Write Acceptance Criteria**

Use the **Given-When-Then** format:

```markdown
## Acceptance Criteria

### Scenario 1: [Description]

- **Given** initial conditions
- **When** user performs action
- **Then** expected outcome

### Scenario 2: [Description]

- **Given** different conditions
- **When** user performs different action
- **Then** different expected outcome
```

### 7. **Technical Considerations**

```markdown
## Technical Implementation

### Frontend Changes

- [ ] Components to create/modify
- [ ] State management updates
- [ ] Styling requirements
- [ ] API integration needs

### Backend Changes

- [ ] New endpoints or routes
- [ ] Database schema changes
- [ ] Service layer updates
- [ ] Provider integration updates

### Shared Changes

- [ ] Type definitions
- [ ] Validation schemas
- [ ] Error handling
```

### 8. **Dependencies and Constraints**

```markdown
## Dependencies

- [ ] Other tickets that must be completed first
- [ ] External API changes
- [ ] Design requirements
- [ ] Third-party library updates

## Constraints

- [ ] Time limitations
- [ ] Resource constraints
- [ ] Technical limitations
- [ ] Budget considerations
```

### 9. **Testing Strategy**

```markdown
## Testing Requirements

### Unit Tests

- [ ] Component testing (Frontend)
- [ ] Service testing (Backend)
- [ ] Utility function testing

### Integration Tests

- [ ] API endpoint testing
- [ ] Provider integration testing
- [ ] End-to-end user flows

### Manual Testing

- [ ] Browser testing checklist
- [ ] Mobile device testing
- [ ] Accessibility testing
```

### 10. **Definition of Done**

```markdown
## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No breaking changes to existing functionality
- [ ] Performance requirements met
- [ ] Accessibility standards met
- [ ] Cross-browser testing completed
```

## Ticket Template

Copy and customize this template for each new ticket (replace XXX with the next sequential number):

```markdown
# ticket_XXX_feature_name_shortly

## Problem Statement

[Describe the current problem or opportunity]

## Requirements

### Functional Requirements

- [ ] Requirement 1
- [ ] Requirement 2

### Non-Functional Requirements

- [ ] Performance requirement
- [ ] Accessibility requirement

## Acceptance Criteria

### Scenario 1: [Name]

- **Given** [initial condition]
- **When** [action performed]
- **Then** [expected result]

## Technical Implementation

### Frontend Changes

- [ ] Component changes needed
- [ ] State management updates

### Backend Changes

- [ ] API changes needed
- [ ] Service updates

### Shared Changes

- [ ] Type definition updates

## Dependencies

- [ ] Dependent ticket/task

## Testing Requirements

- [ ] Unit tests for new functionality
- [ ] Integration tests for API changes
- [ ] Manual testing scenarios

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation updated
```

## Best Practices

### ✅ Do

- Keep tickets focused on a single feature/fix
- Write clear, actionable acceptance criteria
- Include relevant technical context
- Consider edge cases and error scenarios
- Estimate complexity and time requirements
- Link related tickets
- Use consistent terminology

### ❌ Don't

- Create overly broad tickets
- Skip acceptance criteria
- Ignore dependencies
- Forget about testing requirements
- Make assumptions about technical implementation
- Skip the problem statement
- Use vague language

## Project-Specific Considerations

### BlaBlaBlaGPT Architecture

- **Provider Pattern**: Consider impact on multiple AI providers
- **State Management**: Check if global state needs updates
- **Type Safety**: Ensure TypeScript types are updated
- **Error Handling**: Consider provider-specific error scenarios
- **Session Management**: Think about user session implications

### Common Integration Points

- `/src/providers/` - AI provider integrations
- `/src/services/` - Business logic services
- `/src/components/` - UI components
- `/src/store/` - Global state management
- `/shared/types.ts` - Shared type definitions

### Testing Considerations

- Mock AI provider responses for consistent testing
- Test provider switching scenarios
- Validate prompt refinement accuracy
- Check session persistence
- Test error recovery flows

---

## Example Ticket

```markdown
# ticket_004_prompt_history_with_search

## Problem Statement

Users currently lose their previous prompts when they refresh the page or start a new session. This creates frustration as they cannot reference or reuse successful prompts from earlier sessions.

## Requirements

### Functional Requirements

- [ ] Store prompt history locally in browser
- [ ] Display last 50 prompts in sidebar
- [ ] Allow users to search through history
- [ ] Enable clicking to reuse previous prompts
- [ ] Show timestamp and provider used for each prompt

### Non-Functional Requirements

- [ ] Search results appear within 100ms
- [ ] History persists across browser sessions
- [ ] Graceful degradation if localStorage is unavailable

## Acceptance Criteria

### Scenario 1: Viewing Prompt History

- **Given** user has submitted prompts in previous sessions
- **When** user opens the application
- **Then** they see a history sidebar with previous prompts

### Scenario 2: Searching History

- **Given** user has prompt history
- **When** user types in the search box
- **Then** history filters to show matching prompts in real-time

### Scenario 3: Reusing Previous Prompt

- **Given** user views their prompt history
- **When** user clicks on a previous prompt
- **Then** it populates the main input field with that prompt text

## Technical Implementation

### Frontend Changes

- [ ] Create PromptHistory component
- [ ] Add search functionality with debouncing
- [ ] Integrate with sessionStorage service
- [ ] Update layout to accommodate sidebar

### Backend Changes

- [ ] No backend changes required (client-side only)

### Shared Changes

- [ ] Add PromptHistoryItem type definition
- [ ] Update storage interface types

## Dependencies

- [ ] None

## Testing Requirements

- [ ] Unit tests for PromptHistory component
- [ ] Unit tests for search filtering logic
- [ ] Integration tests for localStorage persistence
- [ ] Manual testing across different browsers

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Component tests written and passing
- [ ] Cross-browser testing completed
- [ ] No performance impact on main application
- [ ] Accessibility requirements met (keyboard navigation, screen readers)
```

Use this guide as your go-to resource for creating consistent, comprehensive task tickets that lead to successful feature development!
