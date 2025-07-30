# CircleEditor

> A lightweight visual canvas editor for structured components — inspired by GrapesJS, built for React.

## 🚀 Overview

**CircleEditor** is a React-based component editor that lets you visually render and manipulate component structures inside a sandboxed iframe environment.

Unlike heavier alternatives like GrapesJS, CircleEditor is designed for **performance**, **modularity**, and **developer control**.

> Inject your own component systems. Define your own types. Keep it fast.

---

## ✨ Features

- 🧩 **Custom Component System** — Define reusable visual nodes.
- 📐 **Device Simulation** — Emulate screen sizes with max-width breakpoints.
- 🪟 **Isolated Canvas** — Uses `<iframe>` for true sandboxing.
- 💉 **jQuery Injection Support** — Auto-injected into iframe (if needed).
- ♻️ **Imperative API** — Control rendering, clearing, and reloading.
- ⚡ **No Dependencies** — Pure React + MUI.

---

## 📦 Installation

```bash
npm install circle-editor
```

Or via Yarn:
```bash
yarn add circle-editor
```


---

## 🧠 Concept

CircleEditor does not include built-in UI panels, drag-and-drop managers, or styling panels. Instead, you build your own around it — **it's just the renderer and core logic**, giving you freedom and performance.

> Think of it as the "engine" under the visual editor hood.

---

## 🧪 Example Usage

```tsx
import CircleEditor from 'circle-editor';

function App() {

  return (
    <CircleEditor />
  );
}
```

## 🛠️ Built-In Contexts

CircleEditor provides several internal contexts to organize and control the editor state. These are fully extensible and designed for modular usage:

- **`Components`** — Manages the tree of rendered component instances.
- **`Types`** — Defines available component types, their structure, and lifecycle logic (init, render, update).
- **`Styles`** — Provides scoped styling logic per component type or globally.
- **`Events`** — Handles component and canvas-level events (e.g., click, select, drop).
- **`Devices`** — Manages responsive breakpoints for device preview modes.



## 🤝 Credits & Inspiration

[`GrapesJS`](https://grapesjs.com) — The OG visual editor, inspiring this simplified React variant.

[`React`](https://react.dev), [`MUI`](https://mui.com), [`Framer Motion`](https://motion.dev) and all open-source contributors who made this possible.

## 📄 License

MIT

⚠️ Warning: CircleEditor is not a full page builder — it's your programmable canvas. Customize everything to fit your stack.