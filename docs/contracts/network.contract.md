# ATOMA — Network Contract
Version: 1.0  
Status: CANONICAL  
Last updated: 2026-01-15

---

## 1. Definition of a Network

In ATOMA, a **Network** is a connected structure of nodes.

A Network exists **only if at least two nodes are connected by a link**.

A single node without links is **NOT a network**.

---

## 2. Core Entities

### Node
- Identified by: `nodeId`
- Holds **local (node-level) metrics**
- May exist without being part of any network

### Link
- Identified by: `linkId`
- Connects exactly **two nodes**
- Is the **minimal unit that creates a network**

### Network
- A **set of nodes connected by links**
- Defined by **connectivity**, not by proximity or count
- May consist of:
  - 2 nodes (minimal network)
  - N nodes (extended network)

Disconnected clusters are **separate networks**.

---

## 3. Network Membership Rules

A node belongs to a network **if and only if**:
- it has at least one active link to another node

A node with `connections.length === 0`:
- is **isolated**
- must NOT influence global / network metrics

---

## 4. Canonical Metrics Model

### Node-level metrics (local)
Calculated per node:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `load`

These values:
- belong to the node
- may exist even if the node is isolated

---

### Network-level metrics (global)
Calculated **only from networked nodes**.

Canonical global metric names:

| Node Metric   | Global Metric       |
|--------------|---------------------|
| synergy      | networkSynergy      |
| harmony      | harmonyFlow         |
| stability    | networkStress       |
| corruption   | corruptionLevel     |
| load         | loadPressure        |

---

## 5. Network Metrics Calculation Rules

Network metrics MUST:
- consider **only nodes that belong to a network**
- ignore isolated nodes completely
- be recalculated when:
  - a link is created
  - a link is removed
  - a node enters or leaves a network

Default aggregation strategy (v1):

- Arithmetic mean of participating node values

Future strategies (v2+):
- weighted by topology
- weighted by distance
- weighted by link quality

---

## 6. Zero-Network State

If **no networks exist** in the scene:

- `networkSynergy` = 0
- `harmonyFlow` = 0
- `networkStress` = 0
- `corruptionLevel` = 0
- `loadPressure` = 0

UI may still display values, but they MUST represent a **true zero-network state**, not averages of isolated nodes.

---

## 7. Forbidden Behaviors

The following are explicitly forbidden:

- Using total node count as a proxy for a network
- Calculating network metrics from isolated nodes
- Treating "active nodes" as "networked nodes"
- Mixing visual linkage with logical network membership

---

## 8. Responsibility Boundaries

- Linking system defines **connectivity**
- Network system defines **membership**
- Metrics system consumes **network membership**
- UI displays metrics but MUST NOT infer logic

---

## 9. Contract Authority

This document is the **single source of truth** for:

- what a network is
- which nodes participate
- how global metrics are allowed to be computed

Any system violating this contract is considered **incorrect by definition**.

---
