# How to Implement Tickets

This guide describes the process for implementing tasks that are defined and stored in the `tickets/` folder.

## Overview

The `tickets/` folder contains detailed task specifications that need to be implemented. Each ticket should be treated as a complete requirement document that guides the implementation process.

## Implementation Process

### 1. Select a Ticket

- Browse the `tickets/` folder to find available tickets
- Choose a ticket based on:
  - Priority level (if specified)
  - Dependencies on other tickets
  - Your current expertise/focus area
  - Project roadmap alignment

### 2. Read and Understand the Ticket

- **Read the entire ticket thoroughly**
- Identify the main objectives and requirements
- Note any dependencies or prerequisites
- Understand the acceptance criteria
- Identify affected components (frontend, backend, shared)

### 3. Plan the Implementation

- Break down the ticket into smaller, manageable tasks
- Identify which files/modules need to be modified or created
- Plan the order of implementation (dependencies first)
- Consider potential impact on existing functionality

### 4. Set Up Development Environment

- Ensure your development environment is up to date
- Install any new dependencies if required
- Create a new git branch for the ticket (optional but recommended)
  ```bash
  git checkout -b ticket/[ticket-name]
  ```

### 5. Implementation Steps

#### A. Backend Changes (if applicable)

- Modify or create API endpoints in `backend/src/routes/`
- Update services in `backend/src/services/`
- Add new types in `backend/src/types/`
- Update providers if needed in `backend/src/providers/`

#### B. Frontend Changes (if applicable)

- Update components in `frontend/src/components/`
- Modify pages in `frontend/src/pages/`
- Update stores/state management in `frontend/src/store/`
- Add new types in `frontend/src/types/`

#### C. Shared Changes (if applicable)

- Update shared types in `shared/types.ts`
- Ensure consistency between frontend and backend

### 6. Testing

- Test the implementation manually
- Verify all acceptance criteria are met
- Test edge cases and error scenarios
- Ensure existing functionality still works

### 7. Documentation

- Update relevant documentation
- Add comments for complex logic
- Update API documentation if endpoints changed
- Update README.md if necessary

### 8. Code Review & Cleanup

- Review your code for quality and consistency
- Remove any temporary/debugging code
- Ensure code follows project conventions
- Optimize for performance if needed

### 9. Commit and Push

- Commit your changes with descriptive messages
- Reference the ticket in commit messages
- Push to the feature branch (if using branches)

### 10. Mark Ticket as Complete

- Move the ticket to a `completed/` subfolder within `tickets/`
- Or add a completion status to the ticket file
- Update any tracking documents

## Best Practices

### Code Quality

- Follow existing code patterns and conventions
- Write clean, readable code
- Add appropriate error handling
- Use TypeScript types effectively

### Communication

- Ask questions if ticket requirements are unclear
- Communicate blockers or dependencies early
- Update team on progress for large tickets

### Version Control

- Make atomic commits (one logical change per commit)
- Write clear commit messages
- Use branches for larger features

### Testing Strategy

- Test both happy path and error scenarios
- Verify integration between frontend and backend
- Test with different providers (OpenAI, Anthropic)
- Ensure responsive design works

## Common Patterns

### API Integration

- When adding new API endpoints, update both backend routes and frontend services
- Ensure consistent error handling across the stack
- Update TypeScript types in shared folder

### UI Components

- Follow existing component patterns
- Use Tailwind CSS for styling consistency
- Ensure components are responsive
- Add proper accessibility attributes

### State Management

- Use Zustand stores for complex state
- Keep state minimal and focused
- Handle loading and error states

## Troubleshooting

### Common Issues

- **Build errors**: Check TypeScript types and imports
- **API errors**: Verify endpoint URLs and request/response formats
- **Styling issues**: Ensure Tailwind classes are applied correctly
- **State issues**: Check store updates and component subscriptions

### Getting Help

- Review similar implementations in the codebase
- Check existing tickets for patterns
- Consult project documentation
- Ask team members for guidance

## Folder Structure Reference

```
tickets/
├── [ticket-name].md          # Active tickets
├── completed/                # Completed tickets (optional)
└── in-progress/             # Currently being worked on (optional)
```

## Example Workflow

1. Read `tickets/provider-switching-investigation.md`
2. Create branch: `git checkout -b ticket/provider-switching`
3. Implement changes in `frontend/src/components/ProviderSelector.tsx`
4. Update backend routes if needed
5. Test the provider switching functionality
6. Commit: `git commit -m "Implement provider switching - fixes provider-switching-investigation ticket"`
7. Move ticket to completed folder

---

Remember: The goal is to deliver working, tested, and well-documented features that meet the ticket requirements while maintaining code quality and project consistency.
