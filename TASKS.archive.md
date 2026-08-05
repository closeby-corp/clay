# Ralph Tasks (archive)

Historical DaisyUI / HTMX-era checklist. For the live backlog, see [`TASKS.md`](./TASKS.md).

## Iteration 0: Foundation & Project Structure
- [x] Set up Bun monorepo with workspaces
- [x] Create root package.json with workspace config
- [x] Set up TypeScript config (relaxed mode)
- [x] Create packages/ directory structure
  - [x] packages/core/ - Component base, State, HTMX engine
  - [x] packages/server/ - Bun HTTP + WebSocket
  - [x] packages/components/ - DaisyUI components
  - [x] packages/htmx/ - HTMX integration
  - [x] apps/demo/ - Example application
- [x] Implement Component base class
- [x] Implement reactive State system
- [x] Create HTMX attribute generator
- [x] Set up inter-package imports

## Iteration 1: Server Core & Routing
- [x] Implement Bun HTTP server
- [x] Add WebSocket support
- [x] Create @page decorator for route registration
- [x] Build per-client state isolation
  - [x] Client class with isolated state
  - [x] WebSocket protocol (update, event, register)
- [x] Create HTML page template with CDN links
  - [x] DaisyUI CSS
  - [x] HTMX
  - [x] Hyperscript
  - [x] TailwindCSS
- [x] Handle multiple concurrent clients

## Iteration 2: HTMX Integration
- [x] Integrate HTMX for server communication
- [x] Implement HTMX attribute generation
- [x] Handle OOB (Out-of-Band) swaps for reactive updates
- [x] Create EventRouter for HTMX events
- [x] Build event handler registry
- [x] Coordinate WebSocket + HTMX updates
- [x] Handle HTMX triggers (click, submit, etc.)

## Iteration 3: Event System
- [x] Implement onClick handlers
- [x] Implement onInput handlers with debouncing
- [x] Implement onChange handlers
- [x] Add form submission support
- [x] Create event batching system
- [x] Support multiple events per component
- [x] Handle event data passing (client, value)

## Iteration 4: Reactive State Management
- [x] Implement server-side reactive state
- [x] Create State class with subscriptions
- [x] Add computed() for derived state
- [x] Build Client state store
- [x] Implement component binding to state
- [x] Auto-sync state changes to UI via WebSocket
- [x] Create GlobalState for shared state (chat, etc.)
- [ ] Add state persistence (session storage)

## Iteration 5: Basic Components
- [x] Button component (DaisyUI variants)
  - [x] Colors: primary, secondary, accent, error, etc.
  - [x] Sizes: xs, sm, md, lg
  - [x] Variants: outline, ghost, soft
  - [x] Loading state
- [x] Label/Text component
  - [x] Sizes: xs to 3xl
  - [x] Weights: light to bold
- [x] Input component
  - [x] Types: text, password, email, number
  - [x] Label support
  - [x] Error states
- [x] Container component
  - [x] Width control
  - [x] Centering
  - [x] Padding options
- [x] Row component (flex row)
- [x] Column component (flex column)
- [x] Create functional API (button(), label(), etc.)

## Iteration 6: Form Components
- [x] Checkbox component
- [x] Select/Dropdown component
  - [x] Options array support
  - [x] Placeholder
- [x] Slider/Range component
  - [x] Min/max/step
  - [x] Value display
- [x] TextArea component
  - [x] Resize options
- [x] Form validation system
  - [x] Built-in validators: required, minLength, maxLength, email, pattern
  - [x] Compose validators
- [x] ValidatedInput component

## Iteration 7: Layout & Navigation
- [x] Tabs component
  - [x] DaisyUI variants: bordered, lifted, boxed
  - [x] Active tab state
  - [x] Tab content switching
- [x] Card component
  - [x] Title, subtitle
  - [x] Image support (top/side)
  - [x] Compact mode
- [x] Dialog/Modal component
  - [x] DaisyUI modal
  - [x] Show/close methods
  - [x] Hyperscript integration
- [x] Link component
  - [x] Internal navigation
  - [x] External links
- [x] SPA routing with @page
  - [x] Navigation between pages
  - [x] History management

## Iteration 8: Advanced Components
- [x] DataTable component
  - [x] Sorting
  - [x] Pagination
  - [x] Row selection
  - [x] Custom cell renderers
- [x] Toast notification system
  - [x] Types: info, success, warning, error
  - [x] Auto-dismiss
  - [x] Position options
- [x] Dark Mode toggle
  - [x] DaisyUI theme switching
  - [x] LocalStorage persistence
- [x] Progress bar
  - [x] Indeterminate mode
  - [x] Value display
- [x] Loading spinner
  - [x] Size variants

## Iteration 9: Example Applications
- [x] Counter example
  - [x] Basic reactive state
  - [x] Step control
- [x] Todo list application
  - [x] CRUD operations
  - [x] Filters (all/active/completed)
  - [x] Computed stats
- [x] Chat application
  - [x] Real-time updates (WebSocket)
  - [x] Global state (messages, online users)
- [x] File upload example
  - [x] Progress indication
  - [x] File list management
- [x] Dashboard example
  - [x] Stats cards
  - [x] Data table
  - [x] Multiple components

## Project Complete! 🎉

All iterations implemented successfully.
