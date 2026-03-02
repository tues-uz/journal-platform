# Journal Platform CMS-Aligned Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `journal-platform` into a CMS-aligned, feature-based architecture that is scalable, maintainable, and consistent with `cms-all-platform` best practices.

**Architecture:** Introduce a clear separation between app shell, feature modules, API/query boundaries, and UI components. Move role/auth state into provider-based context, centralize route definitions, and extract page-level logic into feature hooks/services. Keep UI behavior intact while reducing file size and coupling.

**Tech Stack:** React 18, TypeScript, React Router, TanStack Query, Tailwind, Radix UI

---

### Task 1: App shell and routing foundation

**Files:**
- Create: `src/app/providers.tsx`
- Create: `src/app/router.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: Write the failing test**

```ts
// router.test.tsx
it("renders public journal route and protects dashboard routes", () => {
  // render App router with unauthenticated state
  // expect dashboard route to redirect to sign-in
});
```

**Step 2: Run test to verify it fails**

Run: `npm test src/app/router.test.tsx -v`
Expected: FAIL because routing/protected wrappers do not exist.

**Step 3: Write minimal implementation**

```tsx
// providers.tsx
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

```tsx
// router.tsx
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Journal />} />
      <Route path="/signin" element={<JournalSignIn />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<JournalDashboard />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test src/app/router.test.tsx -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/providers.tsx src/app/router.tsx src/App.tsx src/main.tsx
git commit -m "refactor: split app shell and centralize route composition"
```

### Task 2: Auth domain and protected routes

**Files:**
- Create: `src/features/auth/context.tsx`
- Create: `src/features/auth/components/ProtectedRoute.tsx`
- Create: `src/features/auth/storage.ts`
- Modify: `src/pages/JournalSignIn.tsx`
- Modify: `src/components/JournalDashboardSidebar.tsx`

**Step 1: Write the failing test**

```ts
it("stores auth state and exposes role through auth context", async () => {
  // login via context
  // assert user, role, and storage values are set
});
```

**Step 2: Run test to verify it fails**

Run: `npm test src/features/auth/context.test.tsx -v`
Expected: FAIL because context and storage helpers are missing.

**Step 3: Write minimal implementation**

```ts
export type JournalRole = "journal_maker" | "journal_kurator";
export function deriveRole(email: string): JournalRole { /* ... */ }
```

```tsx
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test src/features/auth/context.test.tsx -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/auth src/pages/JournalSignIn.tsx src/components/JournalDashboardSidebar.tsx
git commit -m "refactor: add auth provider and route protection for dashboard"
```

### Task 3: Dashboard feature extraction

**Files:**
- Create: `src/features/dashboard/types.ts`
- Create: `src/features/dashboard/data/mockArticles.ts`
- Create: `src/features/dashboard/hooks/useDashboardArticles.ts`
- Create: `src/features/dashboard/components/DashboardHeader.tsx`
- Create: `src/features/dashboard/components/DashboardStats.tsx`
- Modify: `src/pages/JournalDashboard.tsx`

**Step 1: Write the failing test**

```ts
it("filters and sorts dashboard articles deterministically", () => {
  // invoke filtering/sorting hook helper with sample inputs
  // expect stable sorted output
});
```

**Step 2: Run test to verify it fails**

Run: `npm test src/features/dashboard/hooks/useDashboardArticles.test.ts -v`
Expected: FAIL because hook/helpers do not exist.

**Step 3: Write minimal implementation**

```ts
export function useDashboardArticles(params: FilterParams) {
  // derive list from role + query + status + sort
}
```

**Step 4: Run test to verify it passes**

Run: `npm test src/features/dashboard/hooks/useDashboardArticles.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/dashboard src/pages/JournalDashboard.tsx
git commit -m "refactor: extract dashboard domain logic into feature hooks"
```

### Task 4: Sidebar and shared state cleanup

**Files:**
- Create: `src/features/layout/sidebar-context.tsx`
- Modify: `src/components/JournalDashboardSidebar.tsx`
- Modify: `src/pages/JournalDashboard.tsx`
- Modify: `src/pages/JournalEditor.tsx`

**Step 1: Write the failing test**

```ts
it("syncs sidebar collapse state through context without polling", () => {
  // render sidebar + consuming page
  // toggle collapse and assert both views update
});
```

**Step 2: Run test to verify it fails**

Run: `npm test src/features/layout/sidebar-context.test.tsx -v`
Expected: FAIL because context is missing and polling is still present.

**Step 3: Write minimal implementation**

```tsx
const SidebarContext = createContext<SidebarState | null>(null);
```

**Step 4: Run test to verify it passes**

Run: `npm test src/features/layout/sidebar-context.test.tsx -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/layout src/components/JournalDashboardSidebar.tsx src/pages/JournalDashboard.tsx src/pages/JournalEditor.tsx
git commit -m "refactor: replace sidebar polling with shared layout context"
```

### Task 5: Route and navigation consistency pass

**Files:**
- Modify: `src/components/JournalHeader.tsx`
- Modify: `src/pages/JournalPlaceholder.tsx`
- Modify: `src/pages/JournalSignIn.tsx`
- Modify: `src/pages/JournalDashboard.tsx`
- Modify: `src/components/JournalDashboardSidebar.tsx`

**Step 1: Write the failing test**

```ts
it("uses normalized route paths across header, sign-in, dashboard and placeholders", () => {
  // render and assert links match central route constants
});
```

**Step 2: Run test to verify it fails**

Run: `npm test src/app/routes.test.tsx -v`
Expected: FAIL because route constants and normalized paths are missing.

**Step 3: Write minimal implementation**

```ts
export const routes = {
  home: "/",
  signin: "/signin",
  dashboard: "/dashboard",
};
```

**Step 4: Run test to verify it passes**

Run: `npm test src/app/routes.test.tsx -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/JournalHeader.tsx src/pages/JournalPlaceholder.tsx src/pages/JournalSignIn.tsx src/pages/JournalDashboard.tsx src/components/JournalDashboardSidebar.tsx
git commit -m "fix: normalize journal routes and remove path drift"
```

### Task 6: Editor maintainability baseline

**Files:**
- Create: `src/features/editor/hooks/useEditorState.ts`
- Create: `src/features/editor/services/editorCommands.ts`
- Modify: `src/pages/JournalEditor.tsx`

**Step 1: Write the failing test**

```ts
it("applies editor commands through service API", () => {
  // call command helper with mock selection context
  // expect safe no-op or applied command result
});
```

**Step 2: Run test to verify it fails**

Run: `npm test src/features/editor/services/editorCommands.test.ts -v`
Expected: FAIL because command service does not exist.

**Step 3: Write minimal implementation**

```ts
export const editorCommands = {
  bold: () => document.execCommand("bold"),
};
```

**Step 4: Run test to verify it passes**

Run: `npm test src/features/editor/services/editorCommands.test.ts -v`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/editor src/pages/JournalEditor.tsx
git commit -m "refactor: isolate editor state and command execution"
```

### Task 7: Verification and documentation

**Files:**
- Modify: `README.md` (if present)
- Create: `docs/architecture/journal-platform.md`

**Step 1: Write the failing test**

```ts
it("typechecks and builds after refactor", () => {
  expect(true).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL initially if unresolved imports/types remain.

**Step 3: Write minimal implementation**

```md
Document module boundaries, ownership, and data flow.
```

**Step 4: Run test to verify it passes**

Run: `npm run build && npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/architecture/journal-platform.md README.md
git commit -m "docs: add journal architecture guide and verification baseline"
```
