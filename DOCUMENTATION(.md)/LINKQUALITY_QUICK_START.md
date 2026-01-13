# Link Quality Predictor 1.0 — 5-Minute Quick Start

**Get link viability scores in seconds** 🎯

---

## ⚡ One-Command Test

```javascript
testQualityMatrix()
```

**Output:**
```
🧪 Link Quality Matrix Test
1. SIG-A → MEM-B: 82% (EXCELLENT MATCH)
2. SIG-B → QNT-A: 67% (GOOD MATCH)
3. MEM-A → FRAC-B: 45% (FAIR MATCH)
4. QNT-B → DES-A: 28% (POOR MATCH)
5. FRAC-A → SIG-C: 73% (GOOD MATCH)
```

---

## 🎮 Essential Commands

| Command | What It Does | Output |
|---------|-------------|--------|
| `computeLinkQuality("NODE_1", "NODE_2")` | Analyze specific pair | Quality % + reasons |
| `testQualityMatrix()` | Test 5 consecutive nodes | Ranked list |
| `testRandomCandidates()` | Test 5 random pairs | Top 5 by quality |
| `getQualityStats()` | Show overall statistics | Excellent/good/fair/poor counts |
| `setQualityThreshold(65)` | Set automation filter | Only ≥65% links auto-created |

---

## 📊 Quality Scale

| Score | Rating | Recommendation |
|-------|--------|-----------------|
| 80-100 | ⭐⭐⭐ EXCELLENT | Auto-create immediately |
| 60-79 | ⭐⭐ GOOD | Create (verified) |
| 40-59 | ⭐ FAIR | Manual review |
| 20-39 | ⚠️ POOR | Avoid |
| 0-19 | ✗ NOT VIABLE | Block |

---

## 🔍 Quick Analysis

### Check One Link

```javascript
computeLinkQuality("ANALYSIS-1", "STORAGE-5")
```

**Output shows:**
- Quality score (0-100)
- Why (excellent/good/fair/poor)
- Categories involved
- Factor breakdown (synergy, distance, etc.)
- Why it got that score

### Test All Category Pairs

```javascript
testQualityMatrix()
```

**Finds:**
- Nearest 5 node pairs
- Ranks by quality
- Shows each quality % + reason

### Random Stress Test

```javascript
testRandomCandidates()
```

**Tests:**
- 5 random node combinations
- Ranks best to worst
- Good for variety testing

---

## 📈 What Gets Scored

| Factor | Impact | Notes |
|--------|--------|-------|
| **Synergy** | 40% | How compatible nodes are |
| **Category** | 25% | ANALYSIS→STORAGE boost |
| **Distance** | 15% | Nearby = better |
| **Priority** | 10% | Historical strength |
| **Temperament** | 10% | Mood compatibility |

---

## 🛡️ Penalties & Boosts

| Effect | Change | When |
|--------|--------|------|
| **Duplicate Link** | -30 pts | Link already exists |
| **Decayed Link** | -15 pts | Old, low-activity link |
| **Category Boost** | +30 pts | Complementary categories |
| **Historical** | +20% | Strong past synergy |

---

## ⚙️ Automation Integration

### Before (Without Quality Predictor)

```javascript
enableAutoLink()
autoLinkActive()
// Creates all recommendations (even poor ones!)
```

### After (With Quality Predictor)

```javascript
setQualityThreshold(65)     // Only ≥65% quality
enableAutoLink()
autoLinkActive()
// Creates ONLY high-quality links
// Filters out poor matches automatically
```

---

## 🎯 Typical Workflow

### 1. Test System

```javascript
testQualityMatrix()      // See how it rates pairs
getQualityStats()        // Check overall picture
```

### 2. Tune Threshold

```javascript
setQualityThreshold(60)  // Lower = more links
setQualityThreshold(75)  // Higher = only best
```

### 3. Run Automation

```javascript
enableAutoLink()
autoLinkActive()
// Only creates ≥threshold quality links
```

### 4. Monitor

```javascript
getQualityStats()        // See results
getSynergyDebugStats()   // Compare with AI recommendations
```

---

## 💡 Pro Tips

1. **Default threshold is 65%** — Good balance (not too strict)
2. **Lower threshold (50%)** — Creates more links, may include mediocre ones
3. **Higher threshold (80%)** — Only cream of the crop, fewer total links
4. **Test first** — Run `testQualityMatrix()` before enabling automation
5. **Check stats** — `getQualityStats()` shows breakdown

---

## 📊 Reading Quality Scores

### 🟢 Green Zone (80+)
```
EXCELLENT MATCH ✓
✓ High synergy score
✓ Complementary categories
✓ Nearby nodes
→ Auto-create immediately
```

### 🟡 Yellow Zone (60-79)
```
GOOD MATCH ✓✓
✓ Solid synergy
✓ Acceptable categories
⚠ Moderate distance
→ Create with verification
```

### 🔴 Red Zone (<60)
```
FAIR/POOR MATCH ⚠
⚠ Low synergy
⚠ Incompatible categories
⚠ Far apart
→ Manual review or skip
```

---

## 🚀 3-Step Activation

### Step 1: Test
```javascript
testQualityMatrix()
```

### Step 2: Tune
```javascript
setQualityThreshold(70)  // Your preference
```

### Step 3: Run
```javascript
enableAutoLink()
autoLinkActive()
```

**That's it!** Quality filtering is now active. 🎯

---

## ⚡ Quick Reference Cards

### Testing Commands
```javascript
testQualityMatrix()      // Sequential node pairs
testRandomCandidates()   // Random mix
computeLinkQuality("A", "B")  // Single analysis
```

### Monitoring Commands
```javascript
getQualityStats()        // Overall statistics
getSynergyDebugStats()   // AI comparison
```

### Configuration
```javascript
setQualityThreshold(60)  // Automation filter (0-100)
```

---

## ✅ Checklist: First Run

- [ ] `testQualityMatrix()` runs without errors
- [ ] Scores range from 0-100
- [ ] Some links are 80+ (excellent)
- [ ] Some links are <40 (poor)
- [ ] `getQualityStats()` shows breakdown
- [ ] Ready to enable automation!

---

**Ready!** Your system is now equipped with intelligent link quality prediction. 🚀
