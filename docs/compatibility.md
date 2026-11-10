# Compatibility

An app written for a Clay release keeps working on later releases unchanged.
If an app breaks after a Clay update, that is a bug in Clay unless the release
notes list the change under **Breaking**.

## What this covers

The promise covers the public surface apps use:

- `ui.*` functions and namespaces, including `ui.ai`, `ui.storage`, and `ui.theme`.
- Element methods such as `setText`, `classes`, and `bindValue`.
- Package exports, including exports moved to another module.
- Factory option names and element prop names.
- Event names and their payloads.
- Element wire types and protocol operations.
- CLI flags, defaults, and behavior.

The client and server ship together, but the wire format still matters.
Apps use `ui.runJavaScript` and custom clients, and old browser tabs reconnect
to new servers. Updating the server must account for those callers too.

## Rules for changes

1. What a release shipped stays available in later releases, unless its removal
   is explicitly listed under Breaking in the release notes.
2. A rename keeps the old name as an alias of the same implementation.
   Mark the old name with JSDoc `@deprecated Use newName.` so editors can guide
   callers to the replacement. Moving an export keeps it in the old module too.
3. Types only widen: options gain optional members, unions gain cases, and
   functions gain optional trailing parameters or overloads. Apps should handle
   values they do not know, for example with a default branch in a switch.
4. Behavior does not change silently. Defaults, units, payload shapes, and
   callback order are part of the contract even when the names stay the same.

For example, a renamed helper keeps a direct alias:

```typescript
export function newName(text: string) {
  return ui.label(text);
}

/** @deprecated Use newName. */
export const oldName = newName;
```

## How we check it

[compat/surface.json](../compat/surface.json) records the public names.
[packages/ui/src/compat.test.ts](../packages/ui/src/compat.test.ts) compares that
record with the current source as part of `bun run test`.
Missing names fail the test; new names also fail until the record is updated.

The record contains:

- `ui.<path>`: functions and plain-object namespaces, up to three levels deep.
  Session-created values and getters requiring a session are excluded.
- `export:<package-name>:<name>`: runtime exports from Clay, core, components,
  server, auth, and file persistence. Type-only exports are absent at runtime.
- `element.<method>`: methods on the core Element prototype chain.
- `class.<ExportName>.<method>`: own methods of other Element classes exported
  by `@close-by/clay`.
- `wire.<type>`: element types handled by the client renderer.
- `op.server.<op>`, `op.client.<op>`, and `op.patch.<op>`: protocol operations.
- `cli.<flag>`: CLI flags, including short aliases.

After adding public API, run `bun scripts/compat-surface.ts --write` and commit
`compat/surface.json` with the implementation. Review its diff before committing.
For a rename, restore the old alias before updating the record.
For an intentional removal, list it under Breaking in the release notes and
regenerate the record. Run `bun test packages/ui` to check it.
Run `bun scripts/compat-surface.ts` for counts without changing the record.

This check records names, not full signatures or behavior. Option and prop names,
event payload shapes, defaults, units, and callback order are not checked
automatically yet. Reviewers check these, along with type compatibility.
Native and network adapter packages are outside the mechanical record.

Practice adapted from [Native Shell's compatibility policy](https://nsh.dev/docs/compatibility).
