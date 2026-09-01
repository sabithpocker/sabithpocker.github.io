# Markup Monks — Generative Mathematics Platform

## Technical Architecture & Implementation Specification

---

# 0. Progress Log & Actual Architecture Status (read this first)

This section tracks what's actually been built, since the real codebase
diverges from this plan's aspirational architecture (sections 3-13) in a
way that's intentional, not an oversight - see the note below.

## Reality check on the architecture (sections 1-13)

The app is a plain static site: HTML pages + Web Components + a Gulp build
(terser minify only, no bundler, no framework, no TypeScript, no routing).
There is no `experiments/registry`, no `ExperimentDefinition` contract, no
URL state, no export pipeline, no seeded-random layer.

Per this plan's own Rule 1 ("inspect before modifying") and Rule 3
("abstract repeated behavior, not hypothetical behavior"), the full
contract/registry/URL-state/export architecture has been deliberately
**not** built. Instead, every experiment so far follows one consistent,
already-repeated pattern:

```text
src/js/components/mm-<name>.js   - self-contained custom element, owns its
                                    own canvas/renderer/animation loop
<name>.html                      - page: glass "title card" header (shared
                                    src/js/utils/title-card.js + close/open-
                                    to-pill behavior, auto-closes after 10s)
                                    + a glass toolbar (own <style> block per
                                    page, close/open-to-pill, closed by
                                    default) wiring sliders to the
                                    component's public properties + a
                                    render()/reset() method
src/js/<name>.js                 - page script: toolbar wiring, often an
                                    "Organic Drift" toggle (checked by
                                    default) that animates parameters via
                                    src/js/perlin.js's PerlinNoise
side-bar.js                      - one nav link added per experiment
```

This *is* the registry, informally: `side-bar.js`'s link list is the
discovery mechanism, and the component's public properties are the
parameter schema. Revisit building the formal registry/contract layer once
enough experiments exist that the informal pattern is genuinely getting in
the way (per Rule 3) - not before.

## What's actually built

| Category (plan's) | Experiment | Page | Status |
|---|---|---|---|
| Complex | Mandelbrot / Multibrot (generalized `z^n+c`, polar-form `cpow`) | `mandelbrot.html` | Done |
| Complex | Phoenix (`z^2+c+p*z_prev`) | `phoenix.html` | Done |
| Complex | Burning Ship ("Infinite Descent" auto-zoom) | `burning-ship.html` | Done |
| Recursive | Koch Code (grid of Koch-curve edges) | `koch-code.html` | Done |
| Recursive | Koch Snowflake (hex-packed grid) | `koch-snowflake.html` | Done |
| Recursive | Sierpinski (packed triangular tessellation) | `sierpinski-fractal.html` | Done |
| Recursive | Spirograph | `spirograph.html` | Done (pre-existing, upgraded) |
| Architecture-ish | Alhambra tessellation + reaction-diffusion | `alhambra.html` | Done (pre-existing, upgraded) |
| Chaos | Clifford / Peter de Jong attractors (density-histogram renderer, fixed-point rejection on Randomize/Drift) | `attractors.html` | Done |
| **Topology** | **Möbius Strip** (parametric surface, Three.js) | `mobius.html` | **Done - see below** |

Not built yet: Julia, Newton, Multibrot's own page was folded into
Mandelbrot's; Lorenz/Pickover/Aizawa/Thomas attractors; L-System; Barnsley
Fern/IFS; Dragon/Hilbert/Peano/Menger; Apollonian/circle packing/Penrose;
Torus/Knots/Klein Bottle; all Phase 6 3D items.

## Möbius Strip (MM-017) - implementation notes

First 3D/topology experiment on the site, so this also stood up the site's
first 3D rendering path:

- **Three.js**: was already a `package.json` dependency (0.138.3, matching
  `node_modules`) and even had a dead/unused CDN import sitting in
  `src/js/main.js` - never actually wired to a page before now. Loaded via
  CDN ES module (`https://cdn.jsdelivr.net/npm/three@0.138.3/build/three.module.js`),
  same approach `gl-matrix` already uses for `mm-alhambra.js`, just via
  `import` instead of a global `<script>` tag.
- **Import map required**: `OrbitControls.js` (from `three/examples/jsm/`)
  does a bare `import * as THREE from 'three'` internally, which needs an
  `<script type="importmap">` in the page's `<head>` mapping `"three"` to
  the same CDN URL - a plain CDN `<script>` tag is not enough once any
  three.js addon module is involved. This import map now needs to be
  copy-pasted into any future page that uses Three.js (Torus, Knots, Klein
  Bottle) until/unless there are enough of them to justify a shared partial.
- **Parametric surface pattern**: `mobiusPosition(u, v, width, twist,
  radius, target)` in `mm-mobiusstrip.js` builds a `THREE.BufferGeometry`
  from a `u,v -> (x,y,z)` grid (position + finite-difference normals +
  triangle indices) - this is directly the reusable shape for Torus/Klein
  Bottle (section 26's `ParametricSurface.position(u,v)` idea), just not
  yet extracted into a shared helper since there's only one consumer so
  far. Extract once Torus is built and the duplication is real.
- **Twist must stay an integer** for the surface to close consistently at
  u=0/u=2π (odd = one-sided Möbius, even = orientable twisted band) - this
  is why "Organic Drift" animates auto-rotation speed via Perlin noise
  instead of the twist parameter itself (unlike the fractal pages, which
  drift continuous parameters).
- Toolbar: Twist (1-6 int), Width, Segments, Material (Normal/Solid/
  Wireframe), Color (solid/wireframe only), Organic Drift + speed, Reset
  View. Interaction: OrbitControls drag-to-rotate + scroll-to-zoom (matches
  section 18's "Möbius: rotate, twist" interaction model).

## Recommended next actions (topology track)

1. **Torus (MM-018)** - cheapest next step: same
   `mm-mobiusstrip.js`-style component shape, swap `mobiusPosition` for the
   standard torus parametrization, reuse the import map + OrbitControls
   setup verbatim. This is the point where extracting a shared
   `mm-parametric-surface.js` (scene/camera/renderer/OrbitControls/resize/
   render-loop boilerplate, taking a `position(u,v)` function) actually
   pays for itself - do it now that there are two consumers, not before.
2. **Klein Bottle (MM-021)** - same shared scaffolding once it exists.
3. **Trefoil / Torus Knots (MM-019/020)** - a curve (`position(t)`), not a
   surface; needs a tube-geometry variant of the parametric approach
   (Three.js's `TubeGeometry` fits directly). Reasonable to build right
   after Torus, reusing the same Three.js/import-map setup.
4. Only after 2-3 topology pages exist: reconsider whether the
   plan's formal `ExperimentRenderer`/registry contract (sections 4-11) is
   now pulling its weight, per Rule 3.

## Information architecture (done before adding more experiments)

With 12 experiment pages accumulated flat under one "Components" sidebar
header, discovery had become the actual bottleneck - not a missing
experiment. Addressed that before continuing the backlog:

- **Sidebar (`side-bar.js`)** regrouped into six clickable category headers
  (each an `<a>` styled as the existing `.sidebar__title`, linking to a
  landing page), each with its experiment pages nested below as before.
  This is the informal registry from section 0 above, now two levels deep
  instead of flat.
- **Six category landing pages** (`fractals.html`, `recursive-geometry.html`,
  `chaos.html`, `topology.html`, `patterns.html`, `playground.html`): each a
  plain (non `--full-view`) `.fractals` section - normal document flow, not
  a canvas overlay, since these are content/index pages, not art pages - with
  a written intro (What it is / History / Main Contributors / Latest Trends)
  followed by a `.category-grid` of `.category-card` links to that
  category's pages. New shared partial: `src/sass/components/_category.sass`.
  Deliberately **no** `data-title-card` on these pages - that close/open/
  auto-collapse behavior assumes the `--full-view`/`shader-canvas` header
  variant's `translateX(-50%)` base transform; the plain static header
  variant doesn't have it, so title-card's collapse transform would
  mis-position it. A plain static header needs no such affordance anyway on
  a scrollable content page.
- Categories and what's in each currently: Fractals (Mandelbrot/Multibrot,
  Phoenix, Burning Ship), Recursive Geometry (Koch Code, Koch Snowflake,
  Sierpinski, Spirograph), Chaos & Dynamical Systems (Strange Attractors),
  Topology (Möbius Strip), Patterns & Tessellation (Alhambra), Shader
  Playground (Generic Shader, Audio Visualizer - doesn't cleanly fit a
  mathematical category, kept as a deliberately looser catch-all).
- **Not done** (in scope for later, not blocking): individual experiment
  pages don't yet link back to their category landing page; `index.html`
  doesn't showcase categories. Both are natural follow-ups but weren't part
  of "fix the navigation" as asked.
- This maps onto section 38's "Experiment Discovery / Category metadata"
  idea, done as static HTML/content rather than a data-driven `Category`
  interface - consistent with deferring the formal registry (see above).

---

# 1. Mission

Extend Markup Monks from a collection of fractal experiments into a reusable platform for interactive mathematical generative art.

The platform must support multiple classes of mathematical systems:

```text
Complex Fractals
      ↓
Recursive Geometry
      ↓
Natural / Organic Systems
      ↓
Chaos & Dynamical Systems
      ↓
Mathematical Architecture
      ↓
Topology
      ↓
3D / Higher Dimensions
```

The key architectural requirement is:

> **A new mathematical experiment should be cheap to add without duplicating application infrastructure.**

The mathematical algorithm should be isolated from:

- UI
- rendering lifecycle
- controls
- presets
- palettes
- URL state
- export
- analytics
- navigation
- responsive behavior

Do not rewrite working parts of the existing application merely to match this specification.

First inspect the existing codebase and preserve compatible architecture.

---

# 2. First Task: Audit Before Coding

Before implementing anything, inspect the existing project.

Determine:

### Application

- Framework
- Language
- Package manager
- Routing system
- State management
- Styling system
- Build tooling

### Rendering

Determine whether existing experiments use:

- Canvas 2D
- SVG
- WebGL
- WebGPU
- Three.js
- custom shaders
- workers

### Existing abstractions

Look for existing implementations of:

- fractal rendering
- complex numbers
- color palettes
- sliders
- canvas interaction
- zoom/pan
- randomization
- URL parameters
- image export
- responsive layout

### Output

Create:

```text
docs/architecture-audit.md
```

Document:

1. Existing architecture
2. Existing reusable code
3. Existing technical debt
4. Recommended integration points
5. Things that should NOT be rewritten

Do not start a major refactor until this audit is complete.

---

# 3. Proposed Folder Structure

Adapt names to the existing project conventions.

Suggested target structure:

```text
src/
│
├── app/
│   ├── routes/
│   │   ├── experiments/
│   │   │   ├── [slug]/
│   │   │   └── index
│   │   ├── categories/
│   │   └── discover/
│   │
│   └── ...
│
├── experiments/
│   │
│   ├── registry/
│   │   ├── experimentRegistry
│   │   ├── experimentTypes
│   │   └── categories
│   │
│   ├── complex/
│   │   ├── mandelbrot/
│   │   ├── julia/
│   │   ├── multibrot/
│   │   ├── burningShip/
│   │   ├── newton/
│   │   ├── phoenix/
│   │   ├── lyapunov/
│   │   └── buddhabrot/
│   │
│   ├── recursive/
│   │   ├── sierpinski/
│   │   ├── koch/
│   │   ├── dragon/
│   │   ├── hilbert/
│   │   ├── peano/
│   │   └── menger/
│   │
│   ├── natural/
│   │   ├── lsystem/
│   │   ├── ifs/
│   │   ├── fern/
│   │   ├── trees/
│   │   ├── coral/
│   │   └── lightning/
│   │
│   ├── chaos/
│   │   ├── clifford/
│   │   ├── dejong/
│   │   ├── lorenz/
│   │   ├── pickover/
│   │   ├── aizawa/
│   │   ├── thomas/
│   │   └── ikeda/
│   │
│   ├── architecture/
│   │   ├── apollonian/
│   │   ├── circlePacking/
│   │   ├── penrose/
│   │   ├── hyperbolic/
│   │   └── quasicrystal/
│   │
│   └── topology/
│       ├── mobius/
│       ├── torus/
│       ├── knots/
│       ├── torusKnots/
│       ├── kleinBottle/
│       └── surfaces/
│
├── rendering/
│   ├── core/
│   │   ├── Renderer
│   │   ├── RenderContext
│   │   ├── RenderSize
│   │   └── RenderScheduler
│   │
│   ├── canvas/
│   ├── webgl/
│   ├── webgpu/
│   ├── three/
│   └── workers/
│
├── math/
│   ├── complex/
│   ├── vectors/
│   ├── matrices/
│   ├── transforms/
│   ├── geometry/
│   ├── topology/
│   └── random/
│
├── controls/
│   ├── Slider
│   ├── Toggle
│   ├── Select
│   ├── ColorPicker
│   ├── ParameterGroup
│   └── ControlPanel
│
├── art/
│   ├── palettes/
│   ├── colorMapping/
│   ├── noise/
│   ├── postprocessing/
│   └── composition/
│
├── interaction/
│   ├── zoomPan/
│   ├── orbit/
│   ├── pointer/
│   ├── keyboard/
│   └── touch/
│
├── export/
│   ├── png/
│   ├── svg/
│   ├── animation/
│   └── metadata/
│
├── persistence/
│   ├── urlState/
│   ├── seeds/
│   └── presets/
│
├── ui/
│   ├── ExperimentShell
│   ├── ExperimentCanvas
│   ├── ExperimentControls
│   ├── ExperimentInfo
│   ├── PresetSelector
│   ├── ExportControls
│   ├── RelatedExperiments
│   └── LoadingState
│
└── types/
    ├── experiment
    ├── rendering
    ├── parameters
    └── common
```

The exact folder structure can differ if the current application uses a different architectural convention.

The important separation is:

```text
Experiment Algorithm
        ↓
Rendering Adapter
        ↓
Experiment Shell
        ↓
Controls / Interaction / Export
```

---

# 4. Core Experiment Contract

Every experiment should conform to a common conceptual interface.

```ts
interface ExperimentDefinition<P> {
  id: string;
  slug: string;

  title: string;
  description: string;

  category: ExperimentCategory;

  tags: string[];

  version: number;

  parameters: ParameterDefinition<P>[];

  presets: Preset<P>[];

  defaults: P;

  renderer: RendererType;

  createRenderer(): ExperimentRenderer<P>;

  related?: string[];
}
```

Where:

```ts
type ExperimentCategory =
  | "complex"
  | "recursive"
  | "natural"
  | "chaos"
  | "architecture"
  | "topology"
  | "3d";
```

---

# 5. Renderer Contract

The renderer must not know about the application UI.

Conceptual interface:

```ts
interface ExperimentRenderer<P> {
  initialize(context: RenderContext, parameters: P): void;

  render(parameters: P, frame?: RenderFrame): RenderResult;

  resize(size: RenderSize): void;

  updateParameters(parameters: P): void;

  reset(): void;

  dispose(): void;
}
```

Optional capabilities:

```ts
interface RendererCapabilities {
  interactiveZoom?: boolean;
  pan?: boolean;
  rotation?: boolean;
  animation?: boolean;
  progressiveRendering?: boolean;
  highResolutionExport?: boolean;
  svgExport?: boolean;
}
```

---

# 6. Rendering Abstraction

Do not make every experiment directly manipulate the DOM.

Create a rendering context:

```ts
interface RenderContext {
  canvas?: HTMLCanvasElement;

  width: number;
  height: number;

  devicePixelRatio: number;

  requestRender(): void;

  requestAnimationFrame(callback: FrameRequestCallback): number;
}
```

The renderer should receive the context and work independently of React/Vue/Svelte/etc.

---

# 7. Renderer Types

Define a small number of renderer families.

```ts
type RendererType =
  | "canvas2d"
  | "complex-plane"
  | "particle"
  | "webgl"
  | "webgpu"
  | "three";
```

Do not create a renderer type for every individual experiment.

Examples:

```text
Mandelbrot
Julia
Burning Ship
Newton
Multibrot
       ↓
complex-plane renderer
```

```text
Clifford
De Jong
Pickover
       ↓
particle/attractor renderer
```

```text
Möbius
Torus
Klein Bottle
Knots
       ↓
3D renderer
```

---

# 8. Parameter Schema

Parameters must be data-driven.

Example:

```ts
interface ParameterDefinition<T> {
  id: string;
  label: string;

  type: "number" | "integer" | "boolean" | "select" | "color" | "text";

  default: T;

  min?: number;
  max?: number;
  step?: number;

  options?: {
    value: string;
    label: string;
  }[];

  group?: string;

  advanced?: boolean;

  description?: string;
}
```

This allows the UI to automatically generate controls.

---

# 9. Example: Newton Fractal Schema

```ts
interface NewtonParameters {
  polynomialDegree: number;

  iterations: number;

  tolerance: number;

  zoom: number;

  centerX: number;

  centerY: number;

  colorMode: string;

  palette: string;

  symmetry: number;
}
```

The UI should derive its controls from metadata rather than hardcoding sliders inside the renderer.

---

# 10. Example: Clifford Attractor Schema

```ts
interface CliffordParameters {
  a: number;
  b: number;
  c: number;
  d: number;

  iterations: number;

  scale: number;

  pointSize: number;

  colorMode: string;

  palette: string;
}
```

The renderer only receives this object.

---

# 11. Experiment Registry

Create a single registry.

Conceptually:

```ts
const experimentRegistry = {
  mandelbrot,
  julia,
  multibrot,
  burningShip,
  newton,

  clifford,
  dejong,
  lorenz,

  lsystem,
  barnesleyFern,

  apollonian,

  mobius,
  torus,
  knots,
};
```

Expose helper functions:

```ts
getExperiment(slug);

getExperiments();

getExperimentsByCategory(category);

getRelatedExperiments(id);
```

The registry becomes the source of truth for discovery/navigation.

---

# 12. Metadata Schema

Each experiment should have metadata independent of its implementation.

Example:

```ts
{
  id: "newton",
  slug: "newton-fractal",

  title: "Newton Fractals",

  description:
    "Explore the intricate boundaries between the roots of a polynomial.",

  category: "complex",

  tags: [
    "fractal",
    "complex-plane",
    "newton-method",
    "iteration"
  ],

  difficulty: "intermediate",

  renderer: "complex-plane",

  related: [
    "julia",
    "multibrot",
    "burning-ship"
  ]
}
```

---

# 13. Preset Schema

```ts
interface Preset<P> {
  id: string;
  name: string;

  description?: string;

  parameters: P;

  thumbnail?: string;
}
```

Each experiment should initially have 5–8 curated presets.

Avoid arbitrary random presets being presented as curated presets.

---

# 14. Deterministic Randomness

Create a shared seeded random implementation.

```ts
interface RandomSource {
  seed: number;

  next(): number;

  range(min: number, max: number): number;

  integer(min: number, max: number): number;
}
```

Do not use `Math.random()` inside mathematical artwork where reproducibility matters.

Given:

```text
experiment
+
version
+
seed
+
parameters
```

the artwork should be reproducible as far as the renderer permits.

---

# 15. URL State

Artwork should be shareable through URLs.

Conceptually:

```text
/experiments/clifford
  ?seed=839274
  &a=-1.4
  &b=1.6
  &c=1.0
  &d=0.7
```

Do not necessarily put every parameter into the URL if that produces unreasonable URLs.

Consider:

```text
experiment + encoded state
```

for complex parameter sets.

The URL serialization layer should be independent from the renderer.

---

# 16. Parameter Versioning

This is important.

Parameters will change over time.

Store:

```ts
interface ArtworkState {
  experimentId: string;
  experimentVersion: number;

  seed?: number;

  parameters: unknown;
}
```

If an old shared URL becomes incompatible, provide migration logic where practical.

---

# 17. Experiment Shell

Build one reusable page shell.

Conceptually:

```tsx
<ExperimentShell experiment={experiment}>
  <ExperimentCanvas />

  <ExperimentToolbar>
    <Randomize />
    <PresetSelector />
    <Reset />
    <Export />
  </ExperimentToolbar>

  <ExperimentControls />

  <ExperimentInfo />

  <RelatedExperiments />
</ExperimentShell>
```

The experiment page should not contain algorithm-specific UI logic unless genuinely necessary.

---

# 18. Natural Interaction Model

Each experiment should define its preferred interactions.

```ts
interface InteractionCapabilities {
  zoom?: boolean;
  pan?: boolean;
  rotate?: boolean;
  drag?: boolean;
  touch?: boolean;
  click?: boolean;
  keyboard?: boolean;
}
```

Examples:

### Mandelbrot

```text
zoom
pan
```

### L-System

```text
grow
animate
```

### Clifford

```text
parameter exploration
```

### Möbius

```text
rotate
twist
```

### Knot

```text
rotate
deform
```

Do not force the same interaction model onto every experiment.

---

# 19. Control UX

Controls should be grouped.

Example:

```text
PARAMETERS

Geometry
---------
Scale
Rotation
Iterations

COLOR
---------
Palette
Contrast
Brightness

ADVANCED
---------
...
```

Advanced controls should be collapsed by default.

The visual output should remain dominant.

---

# 20. Rendering Pipeline

For every experiment:

```text
Parameters
    ↓
Validation
    ↓
Renderer State
    ↓
Mathematical Computation
    ↓
Geometry / Pixel / Particle Data
    ↓
Rendering
    ↓
Post Processing
    ↓
Canvas
```

Avoid:

```text
UI component
    ↓
math
    ↓
DOM
    ↓
math
    ↓
canvas
```

Keep computation and presentation separate.

---

# 21. Complex-Plane Renderer

Create reusable infrastructure for:

- complex coordinates
- viewport transforms
- iteration
- escape radius
- smooth coloring
- iteration counts
- palette lookup
- zoom
- pan

Conceptually:

```ts
interface ComplexPlaneRenderer {
  setViewport(viewport: ComplexViewport): void;

  render(iterate: ComplexIterator, options: ComplexRenderOptions): RenderResult;
}
```

Where:

```ts
interface ComplexViewport {
  centerX: number;
  centerY: number;
  scale: number;
}
```

This should power:

- Mandelbrot
- Julia
- Multibrot
- Burning Ship
- Newton
- Phoenix
- future complex fractals

---

# 22. Attractor Renderer

Create reusable infrastructure for iterative point systems.

```ts
interface AttractorSystem {
  initialState(): Vector;

  step(state: Vector, parameters: unknown): Vector;
}
```

Renderer:

```ts
interface AttractorRenderer {
  render(
    system: AttractorSystem,
    parameters: unknown,
    options: AttractorRenderOptions,
  ): RenderResult;
}
```

This should support:

- Clifford
- De Jong
- Pickover
- Lorenz
- Aizawa
- Thomas
- future systems

---

# 23. Recursive Geometry Renderer

Define recursive geometry as a tree of operations.

Possible abstraction:

```ts
interface RecursiveNode {
  transform: Transform;
  children?: RecursiveNode[];
}
```

Or an equivalent efficient representation appropriate to the implementation.

It should support:

- branching
- rotation
- scale
- translation
- recursion depth
- randomness

This becomes the basis for:

- L-Systems
- Dragon Curves
- Trees
- Koch
- Sierpiński
- recursive architecture

---

# 24. IFS Abstraction

```ts
interface IFSTransform {
  probability: number;

  transform(point: Vector2): Vector2;
}
```

An IFS system:

```ts
interface IFSSystem {
  transforms: IFSTransform[];

  iterate(random: RandomSource, iterations: number): Vector2[];
}
```

This should support:

- Barnsley Fern
- plants
- organic structures
- custom IFS experiments

---

# 25. Geometry Abstraction

For geometric experiments:

```ts
interface GeometryGenerator<P> {
  generate(parameters: P): GeometryData;
}
```

Potential outputs:

```ts
type GeometryData =
  | LineGeometry
  | PolygonGeometry
  | CircleGeometry
  | MeshGeometry
  | PointCloud;
```

This keeps geometry generation independent of the renderer.

---

# 26. Topology Architecture

Topology should eventually use a dedicated mathematical layer.

Suggested primitives:

```text
Curve
Surface
Mesh
Graph
Knot
Manifold
```

Example:

```ts
interface ParametricSurface {
  position(u: number, v: number): Vector3;
}
```

Möbius:

```ts
position(u, v);
```

Torus:

```ts
position(u, v);
```

Klein bottle:

```ts
position(u, v);
```

The same 3D renderer can then render all of them.

---

# 27. Knot Abstraction

```ts
interface KnotCurve {
  position(t: number): Vector3;
}
```

Implement:

```text
Trefoil
Figure Eight
Torus Knot
Custom Knot
```

Then add transformations:

```text
scale
twist
perturb
noise
fractal deformation
```

This creates a future bridge:

```text
Topology
    +
Fractal deformation
    ↓
Fractal Knots
```

---

# 28. 3D Rendering

Do not build a bespoke 3D engine.

Use the existing project technology if one exists.

Otherwise evaluate:

- Three.js
- WebGL
- WebGPU

The 3D abstraction should support:

```text
camera
lighting
materials
mesh
points
lines
orbit controls
export
```

But keep mathematical geometry separate from the rendering engine.

---

# 29. Color System

Create a shared palette system.

```ts
interface Palette {
  id: string;
  name: string;

  stops: ColorStop[];
}
```

Example:

```ts
interface ColorStop {
  position: number;
  color: string;
}
```

Support multiple mapping functions:

```text
linear
smooth
cyclic
iteration-based
density-based
velocity-based
height-based
```

The same palette should be usable across different experiment types.

---

# 30. Export System

Build export independently from experiments.

Minimum:

```text
PNG
```

Future:

```text
SVG
WebP
high-resolution PNG
animated GIF/WebM
metadata JSON
```

Example:

```ts
interface ExportRequest {
  format: ExportFormat;

  width: number;
  height: number;

  pixelRatio?: number;

  includeMetadata?: boolean;
}
```

---

# 31. High-Resolution Rendering

Do not simply upscale the displayed canvas.

For supported experiments:

```text
screen render
      ≠
export render
```

The renderer should be able to render directly at the requested export resolution.

This is especially important for:

- fractals
- line art
- particle systems
- 3D geometry

---

# 32. Progressive Rendering

Complex experiments should support progressive rendering where appropriate.

Example:

```text
Low quality preview
       ↓
Medium quality
       ↓
Final quality
```

When parameters change:

```text
cancel previous render
       ↓
start new render
       ↓
preview
       ↓
refine
```

Do not allow stale renders to overwrite newer parameter states.

---

# 33. Worker Architecture

Use workers when CPU computation becomes expensive.

Potential candidates:

- Buddhabrot
- high iteration fractals
- particle simulations
- complex L-Systems
- high-resolution exports

Conceptually:

```text
UI Thread
   │
   ├── parameters
   │
   ↓
Worker
   │
   ├── calculation
   │
   ↓
render result
```

Do not introduce workers into trivial experiments purely for architectural purity.

---

# 34. WebGL / WebGPU Strategy

GPU rendering should be introduced when profiling demonstrates that it is useful.

Likely candidates:

### WebGL/WebGPU

- Mandelbrot
- Julia
- Burning Ship
- Multibrot
- Newton
- Phoenix
- large attractor particle systems

Use shader-based iteration where appropriate.

Do not create a GPU abstraction that makes simple Canvas experiments unnecessarily complicated.

---

# 35. Performance Requirements

Every experiment must:

- avoid blocking the main thread unnecessarily
- cancel obsolete renders
- clean up GPU resources
- clean up animation frames
- avoid memory leaks
- handle devicePixelRatio correctly
- work at reasonable mobile resolutions
- pause expensive animation when hidden

Performance targets should be measured rather than guessed.

Add profiling notes to:

```text
docs/performance.md
```

---

# 36. Mobile Strategy

The artwork must remain usable on mobile.

Requirements:

- touch zoom where applicable
- touch rotation for 3D
- large enough controls
- collapsible parameter panel
- reasonable default render quality
- avoid requiring hover
- avoid extremely dense control layouts

Do not attempt to expose every advanced control on small screens.

---

# 37. Accessibility

Interactive mathematical artwork should still have accessible surrounding UI.

Requirements:

- keyboard-accessible controls
- labels for sliders
- visible focus states
- meaningful button names
- semantic headings
- reduced-motion consideration
- canvas description where useful

The artwork itself does not need to become an accessible mathematical representation, but the controls and explanatory content must be accessible.

---

# 38. Experiment Discovery

Create category metadata:

```ts
interface Category {
  id: ExperimentCategory;

  title: string;

  description: string;

  experiments: string[];
}
```

The category pages should eventually expose:

```text
Featured
New
Popular
Random
All
```

Avoid implementing popularity infrastructure until there is actually enough traffic/data to justify it.

---

# 39. Related Experiment Graph

Every experiment should have explicit relationships.

Eventually support relationship types:

```ts
type Relationship =
  | "variation"
  | "same-renderer"
  | "mathematical-neighbor"
  | "visual-neighbor"
  | "next-step"
  | "cross-disciplinary";
```

Example:

```text
Mandelbrot
   │
   ├── variation → Multibrot
   ├── variation → Burning Ship
   ├── mathematical-neighbor → Julia
   └── cross-disciplinary → Chaos
```

This creates the conceptual roadmap within the website.

---

# 40. Discovery / Random Artwork

Build a reusable discovery function:

```ts
generateArtwork(experimentId, seed);
```

Eventually:

```ts
discover({
  categories: [...],
  count: 12,
  seed
})
```

The system can generate a grid of random but deterministic artwork.

Important:

Randomization must be constrained.

Purely random parameters often produce ugly output.

Each experiment should define:

```ts
randomizeParameters(random);
```

or equivalent.

The experiment itself determines what constitutes a useful random range.

---

# 41. Quality-Guided Randomization

Future enhancement.

Instead of:

```text
random parameters → render
```

eventually support:

```text
random parameters
       ↓
quick preview
       ↓
evaluate visual properties
       ↓
reject poor result
       ↓
keep interesting result
```

Potential metrics:

- occupied area
- entropy
- symmetry
- density
- contrast
- connectedness
- complexity

This could eventually become one of Markup Monks' strongest generative-art features.

---

# 42. Testing Strategy

Every experiment should have three testing layers.

## Mathematical Tests

Test known values and invariants.

Example:

```text
Mandelbrot known points
Newton convergence
Torus geometry
Möbius topology
```

## Renderer Tests

Test:

- initialization
- resize
- parameter update
- cleanup
- deterministic output

## UI Tests

Test:

- controls
- presets
- randomization
- reset
- URL state
- export

Do not attempt pixel-perfect screenshot tests for every mathematical render unless necessary.

---

# 43. Experiment Implementation Template

Every new experiment should follow a standard structure.

Example:

```text
experiments/chaos/clifford/

  index.ts

  definition.ts

  renderer.ts

  parameters.ts

  presets.ts

  math.ts

  tests/
    math.test.ts
    renderer.test.ts
```

For very small experiments, files may be consolidated.

Do not create needless files just to satisfy the template.

---

# 44. Example Experiment

## Clifford Attractor

Structure:

```text
definition
    ↓
parameters
    ↓
Clifford equations
    ↓
attractor renderer
    ↓
color mapping
    ↓
canvas
```

Mathematical function:

```text
x' = sin(a*y) + c*cos(a*x)
y' = sin(b*x) + d*cos(b*y)
```

Parameters:

```text
a
b
c
d
iterations
scale
pointSize
palette
colorMode
```

Preset examples:

```text
Butterfly
Nebula
Flower
Smoke
Galaxy
```

---

# 45. Initial Experiment Backlog

## Phase 1 — Complex Fractals

### MM-001 — Newton Fractal

Requirements:

- complex-plane renderer
- Newton iteration
- configurable polynomial degree
- zoom
- pan
- presets
- palette
- randomization
- export

---

### MM-002 — Burning Ship

Reuse:

```text
complex-plane renderer
viewport
palette
zoom/pan
export
```

Only the iteration function should be experiment-specific.

---

### MM-003 — Multibrot

Add:

```text
power parameter
```

Validate useful exponent ranges.

---

### MM-004 — Phoenix Fractal

Add previous-iteration state to the complex iteration abstraction.

This may require extending the complex iterator interface.

Do not hack Phoenix into a Mandelbrot-specific implementation.

---

# 46. Phase 2 — Chaos

### MM-005 — Clifford Attractor

Build attractor abstraction.

Requirements:

- deterministic seed
- 500k+ point support where practical
- presets
- density rendering
- palette
- export

---

### MM-006 — De Jong Attractor

Reuse attractor infrastructure.

---

### MM-007 — Lorenz Attractor

Add continuous dynamical system integration.

Potential numerical integration:

```text
Euler initially
Runge-Kutta later if required
```

Keep numerical integration separate from rendering.

---

### MM-008 — Pickover Attractor

Reuse attractor infrastructure.

---

# 47. Phase 3 — Recursive Geometry

### MM-009 — L-System

Requirements:

- grammar definition
- axiom
- production rules
- recursion depth
- angle
- scale
- drawing commands
- animation/growth
- presets

Architecture:

```text
Grammar
 ↓
String expansion
 ↓
Turtle interpretation
 ↓
Geometry
 ↓
Renderer
```

Do not couple grammar expansion to Canvas.

---

### MM-010 — Barnsley Fern / IFS

Requirements:

- transform list
- probabilities
- iterations
- density
- color
- presets

---

### MM-011 — Dragon Curve

Reuse recursive geometry infrastructure.

---

### MM-012 — Hilbert Curve

Reuse recursive geometry infrastructure.

---

# 48. Phase 4 — Mathematical Architecture

### MM-013 — Apollonian Gasket

Implement:

- circle representation
- tangent-circle generation
- recursion
- depth
- coloring
- zoom
- export

Future extension:

```text
Apollonian + radial symmetry
Apollonian + Islamic pattern systems
```

---

### MM-014 — Circle Packing

Support:

- seed
- radius rules
- packing density
- symmetry
- color

---

### MM-015 — Penrose Tiling

Implement tile grammar separately from renderer.

---

### MM-016 — Hyperbolic Tiling

Treat this as a more advanced mathematical experiment.

Do not prioritize until the geometry architecture is mature.

---

# 49. Phase 5 — Topology

### MM-017 — Möbius Strip

First topology experiment.

Requirements:

- parametric surface
- 3D renderer
- orbit controls
- twist parameter
- width parameter
- segmentation
- material
- lighting
- export

Interaction:

```text
drag → rotate
slider → twist
```

---

### MM-018 — Torus

Implement reusable parametric surface infrastructure.

---

### MM-019 — Trefoil Knot

Implement curve rendering.

---

### MM-020 — Torus Knots

Parameters:

```text
p
q
radius
tubeRadius
segments
```

---

### MM-021 — Klein Bottle

Use the same parametric-surface infrastructure.

---

### MM-022 — Fractal Surface

First explicit:

```text topology + fractal deformation

```

experiment.

---

# 50. Phase 6 — Advanced 3D

Backlog:

```text
MM-023 Quaternion Julia
MM-024 Mandelbulb
MM-025 Menger Sponge
MM-026 3D Strange Attractor
MM-027 Recursive Polyhedra
MM-028 Higher-Dimensional Projection
```

Do not begin these until 3D infrastructure is stable.

---

# 51. Cross-Family Experiments

These are strategically important.

Do not treat them as simple backlog items.

Eventually build:

### MM-X01 — Fractal Knots

Topology + fractal deformation.

---

### MM-X02 — Fractal Möbius

Map recursive/fractal geometry onto a Möbius surface.

---

### MM-X03 — Fractal Torus

Map fractal patterns onto a toroidal surface.

---

### MM-X04 — Chaotic Fractal

Use chaotic systems to drive fractal parameters.

---

### MM-X05 — Organic Attractor

Convert attractor trajectories into organic structures.

---

# 52. Suggested Git / Ticket Strategy

Each experiment should be a discrete ticket.

Example:

```text
feat(experiments): add Newton fractal

feat(rendering): add complex-plane viewport

feat(math): add Newton iteration

feat(experiments): add Burning Ship

feat(experiments): add Clifford attractor
```

Avoid giant commits such as:

```text
"Add all new fractals"
```

---

# 53. Definition of Done

An experiment is complete only when:

```text
[ ] Mathematical implementation
[ ] Mathematical tests
[ ] Renderer
[ ] Responsive rendering
[ ] Default parameters
[ ] 5+ curated presets
[ ] Randomization
[ ] Reset
[ ] URL/share state
[ ] PNG export
[ ] Loading state
[ ] Error handling
[ ] Mobile controls
[ ] Accessibility
[ ] Short description
[ ] Mathematical explanation
[ ] Related experiments
[ ] Performance check
```

---

# 54. Agent Rules

The coding agent must follow these rules.

## Rule 1

**Inspect before modifying.**

Never assume the existing architecture.

---

## Rule 2

**Reuse before abstracting.**

If existing infrastructure already solves a problem, use it.

---

## Rule 3

**Abstract repeated behavior, not hypothetical behavior.**

Do not build an enormous generic rendering engine before there are multiple experiments demonstrating the need.

---

## Rule 4

**Algorithms must be independent of UI.**

Mathematical functions should be testable without a browser UI.

---

## Rule 5

**Rendering must be independent of page layout.**

A renderer should not know whether it is being displayed on a desktop page, mobile page, gallery, or export pipeline.

---

## Rule 6

**Do not expose every mathematical parameter.**

Curate the interface.

---

## Rule 7

**Every experiment needs a visual hook.**

The question is not:

> "Does the equation work?"

The question is:

> "Is this interesting to explore?"

---

## Rule 8

**Do not add dependencies without justification.**

Before adding a library:

1. Check whether existing dependencies solve the problem.
2. Check bundle size.
3. Check browser support.
4. Check maintenance status.
5. Explain why the dependency is needed.

---

## Rule 9

**Do not rewrite existing experiments unless necessary.**

New infrastructure should be introduced incrementally.

---

## Rule 10

**Keep the artwork as the primary UI element.**

The control panel should support the artwork, not dominate it.

---

# 55. Recommended Implementation Sequence

Execute in this order:

```text
1. Audit existing codebase
       ↓
2. Identify reusable infrastructure
       ↓
3. Establish experiment definition contract
       ↓
4. Establish registry
       ↓
5. Establish parameter schema
       ↓
6. Extract/improve complex-plane renderer
       ↓
7. Newton
       ↓
8. Burning Ship
       ↓
9. Multibrot
       ↓
10. Phoenix
       ↓
11. Attractor abstraction
       ↓
12. Clifford
       ↓
13. De Jong
       ↓
14. Lorenz
       ↓
15. Recursive geometry abstraction
       ↓
16. L-System
       ↓
17. IFS / Barnsley Fern
       ↓
18. Apollonian
       ↓
19. 3D renderer
       ↓
20. Möbius
       ↓
21. Torus
       ↓
22. Knots
       ↓
23. Klein Bottle
       ↓
24. Cross-family experiments
```

---

# 56. Success Criteria

The architecture is successful if adding a new experiment generally requires:

```text
1 mathematical implementation
+
1 experiment definition
+
parameters
+
presets
```

rather than:

```text
new page
new controls
new renderer
new export code
new randomization
new URL handling
new responsive implementation
new navigation
```

The ideal end state is:

```text
                    ┌── Mandelbrot
                    ├── Julia
Complex ────────────┼── Newton
                    ├── Burning Ship
                    └── Multibrot

                    ┌── Clifford
Chaos ──────────────┼── De Jong
                    ├── Lorenz
                    └── Pickover

                    ┌── L-System
Recursive ──────────┼── Dragon
                    ├── Hilbert
                    └── Sierpiński

                    ┌── Apollonian
Architecture ───────┼── Penrose
                    └── Hyperbolic

                    ┌── Möbius
Topology ───────────┼── Torus
                    ├── Knots
                    └── Klein Bottle

                    ┌── Quaternion Julia
3D ─────────────────┼── Mandelbulb
                    └── Menger Sponge
```

with shared infrastructure underneath:

```text
                 ┌────────────────────┐
                 │ Experiment Registry│
                 └─────────┬──────────┘
                           │
                 ┌─────────▼──────────┐
                 │ Experiment Contract│
                 └─────────┬──────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ↓                   ↓                   ↓
 Complex Renderer    Attractor Renderer   Geometry Renderer
       │                   │                   │
       ↓                   ↓                   ↓
     Math                Math                Math
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ↓
                 ┌────────────────────┐
                 │ Experiment Shell   │
                 └─────────┬──────────┘
                           │
       ┌───────────┬───────┼────────┬────────────┐
       ↓           ↓       ↓        ↓            ↓
    Controls    Presets   URL     Export      Related
```

---

# 57. Final Product Principle

Do not build Markup Monks as a database of mathematical algorithms.

Build it as a **laboratory for exploring mathematical systems visually**.

The core loop should always be:

```text
DISCOVER
   ↓
SEE
   ↓
INTERACT
   ↓
RANDOMIZE
   ↓
UNDERSTAND
   ↓
MODIFY
   ↓
CREATE
   ↓
SHARE
```

The architecture exists to make that loop increasingly powerful.

When deciding between two technically valid implementations, prefer the one that makes the next interesting mathematical experiment **faster to build and better to explore**.
