# ATOMA — Glyph Metric HUD Concept

## 🧠 Purpose

Transform numeric metric values (0.000000–1.000000) into a symbolic glyph-based representation in HUD.

Goal:
- Preserve precision
- Replace numeric digits with stylized symbols
- Enhance visual identity of ATOMA
- Reduce perception of update frequency (10Hz smoothing effect)

---

## 🎯 Core Idea

Instead of rendering:

0.673421

Render:

◯·△▢⟐✶…

Each digit is replaced by a corresponding glyph.

---

## 🔢 Glyph Mapping (MVP)

```js
const DIGIT_GLYPHS = {
  "0": "◯",
  "1": "|",
  "2": "∿",
  "3": "△",
  "4": "▢",
  "5": "⬟",
  "6": "⟡",
  "7": "⟐",
  "8": "◎",
  "9": "✶",
  ".": "·"
};