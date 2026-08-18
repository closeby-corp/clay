# Branding — close-by clay

Product identity for this repo (folder/git remote may still be `bad-ui`).

## House brand: close-by

**close-by** (`close-by.org`) is the umbrella: human-centric tools in the age of AI — beside the person, on their side of the work. Not a replacement cockpit, not an autonomous swarm.

| Layer | Role | Example |
|-------|------|---------|
| **close-by** | Philosophy / house | Tools that stay with the human |
| **Product** | A concrete practice or place | ask, clay, … |
| **CLI / URL** | Short handle | `ask`, `clay` · `ask.close-by.org`, `clay.close-by.org` |

**Naming rule:** under a proximity brand, the product name carries the **noun** (what it is), not another proximity word (`near`, `beside`, …). Those read as saying “close” twice.

Sibling product: **close-by ask** — say the goal from the shell you’re already in (`ask` / `?`).

Tagline family: “close by your ___.”

## Product: clay

**close-by clay** — server-driven UI for TypeScript (NiceGUI-shaped `ui.*`), already tempered so you can mold useful apps quickly without feeling you’ve chosen a toy when things get serious.

| | |
|--|--|
| **Product** | clay |
| **Site** | `clay.close-by.org` |
| **CLI** | `clay` (or `cbclay` if bare `clay` is awkward on PATH) |
| **Packages** | `@close-by/clay-*` monorepo (`@close-by/clay` exports the familiar `ui` facade) |
| **API in code** | Keep `ui.*` — NiceGUI muscle memory; soul lives in the product name |

```ts
import { ui } from '@close-by/clay';

ui.run(() => {
  ui.button('Save', { onClick: () => { /* … */ } });
});
```

### Intention

Stay in TypeScript on the server — compose the interface there. Don’t leave for a separate frontend cockpit. Mold something useful in an afternoon; grow it into something serious without a “we picked the wrong framework” feeling.

### Why clay (not Legos, not a kit)

- **Clay** is already a mix of substances. You don’t assemble it first; you press it into shape.
- **Legos** are pre-made bricks with one allowed shape-language — snap parts, hit the limits of the brick set.
- **Component kits / “assemble your stack”** are Legos: React + router + state + UI library + glue, then hope it holds.
- **Clay** is continuous material: the same tempered lump becomes a small tool, an internal app, or something odd that still works.

Pitch line: *not a box of parts — clay.*

What’s already mixed here: imperative `ui.*`, per-client element tree, WebSocket patches, thin React + ShadCN client. You mold apps; you don’t kit-bash the stack.

## Names we considered

| Name | Verdict |
|------|---------|
| **BadUI** | Childish; undersells seriousness |
| **desk** | Nice suite slot (“ask / desk”), weak intention — names where you sit, not what you do |
| **hub** | Sounds like a portal / integration center; wrong metaphor |
| **dash** | Punchy, but Plotly Dash collision + “dashboard-only” reading |
| **ui** | Honest in code, soulless as a product |
| **gui** | Clear, a bit retro; still dry |
| **page** / **view** | Accurate, crowded, low soul |
| **art** / **artsy** | Soulful but drifts to generative-art; `artsy` is a vibe, not a thing |
| **dx** / **dex** | `dx` is a category (“developer experience”), not a product; `dex` is inventedy and mute on UI |
| **clay** | Tactile, moldable, serious enough; fits brand + feeling |

## Brand vs code

**close-by ask** aligns name and verb (`ask`). Clay keeps a healthy split: product/CLI/site carry soul; the programming surface stays `ui.*` so the DX stays familiar and the name doesn’t have to double as every function prefix.
