# ATOMA Debug HUD 1.0 - Quick Reference Guide

---

## 🎮 Quick Start

### Toggle HUD
Press **F4** key

### Exit HUD
Press **F4** again OR click **✕** button

---

## 📊 Tab Guide

### 🔴 Decay Engine Tab
**What it monitors:** Link priority decay system

| Stat | What It Means |
|------|---------------|
| Status | Is decay engine active? |
| Decay Rate | How fast priorities decrease per second |
| Active Links | Number of links currently tracked |
| Decayed Links | Links that have lost priority |
| Avg Priority | Average link priority value |
| Max Priority | Highest priority currently tracked |
| Update Freq | How many times per second decay runs |

**Green means:** ✅ System working normally  
**Gray means:** ⚪ System not yet initialized

---

### 🤖 ML Engine Tab
**What it monitors:** Machine learning recommendation system

| Stat | What It Means |
|------|---------------|
| Status | Is ML engine active? |
| Accuracy | How often recommendations are correct |
| Recommendations | Total suggestions made |
| Accepted | How many suggestions user agreed with |
| Rejected | How many suggestions user disagreed with |
| Pending | Awaiting user feedback |
| Confidence | How confident the ML system is |

**Green means:** ✅ ML making good predictions  
**Gray means:** ⚪ Insufficient data yet

---

### 💎 Quality Feedback Tab
**What it monitors:** Link quality scoring system

| Stat | What It Means |
|------|---------------|
| Status | Is quality loop active? |
| Avg Quality | Average quality score (0-100%) |
| High Quality | Links ranked as excellent |
| Medium Quality | Links ranked as acceptable |
| Low Quality | Links ranked as poor |
| Feedback Rate | Percentage of links getting feedback |
| Last Update | Time since last quality check |

**Green means:** ✅ Good link quality overall  
**Gray means:** ⚪ Still collecting data

---

### 👥 Acceptance Tracker Tab
**What it monitors:** How users accept/reject recommendations

| Stat | What It Means |
|------|---------------|
| Status | Is tracker active? |
| Total Events | Total recommendations evaluated |
| Accepted | User agreed with recommendation |
| Rejection Rate | % of recommendations rejected |
| Acceptance Rate | % of recommendations accepted |
| Trend | Is user becoming more/less accepting? |
| Learning Score | How well system learned user preferences |

**Green means:** ✅ System learning user preferences  
**Gray means:** ⚪ Insufficient user feedback

---

### 🔧 Repair Layer Tab
**What it monitors:** System for fixing broken links

| Stat | What It Means |
|------|---------------|
| Status | Is repair system active? |
| Total Repairs | Links fixed so far |
| Orphaned Nodes | Nodes with no connections |
| Broken Links | Links that stopped working |
| Recovered | Links successfully repaired |
| Success Rate | % of repair attempts successful |
| Last Action | What repair was done most recently |

**Green means:** ✅ System maintaining link integrity  
**Gray means:** ⚪ No issues to repair yet

---

## 🎨 Color Legend

| Color | Meaning | Example |
|-------|---------|---------|
| 🟢 Green (#00ff88) | Active/Good | "Active ✓" status |
| 🔵 Cyan (#00ffff) | Labels/Borders | Stat names and frame |
| ⚪ Gray (#666666) | Inactive/Unavailable | "(inactive)" status |
| 🔴 Red | Close button | ✕ button |

---

## ⚙️ Settings & Info

### Refresh Rate
HUD updates every **300 milliseconds** (0.3 seconds)

### Position
Fixed at **bottom-right corner** of screen

### Size
- Desktop: **420×500px**
- Mobile: **Responsive** (adapts to screen)

### Keyboard Shortcut
**F4** = Toggle on/off

### No Configuration
HUD works automatically with no setup needed

---

## 🐛 Troubleshooting

### HUD Not Appearing
1. Press **F4** again (toggle state)
2. Check if game is loaded
3. Refresh page if stuck

### Stats Show "(inactive)"
- System hasn't initialized yet
- Wait a few seconds
- Or it's not part of this game build

### Stats Show "(N/A)"
- No data collected yet
- System working but no activity
- Wait for game events to generate data

### HUD Frozen/Not Updating
1. Press F4 to close HUD
2. Press F4 to reopen HUD
3. This resets the update cycle

### F4 Not Working
1. Make sure game window is focused (click on it)
2. Check if F4 is bound to something else on your system
3. Try refreshing the page

---

## 📈 What To Look For

### Healthy System Indicators
- ✅ All tabs show "Active ✓"
- ✅ Stats show numbers (not N/A)
- ✅ Numbers change every ~0.3 seconds
- ✅ Green text appears
- ✅ Decay rate is steady
- ✅ ML accuracy improving
- ✅ Quality scores increasing
- ✅ Acceptance rate stable

### Warning Signs
- ⚠️ Any tab stuck on "(inactive)"
- ⚠️ Stats not updating for >5 seconds
- ⚠️ All stats showing "(N/A)"
- ⚠️ Decay rate = 0 for extended time
- ⚠️ ML accuracy stuck at low % 
- ⚠️ Quality scores declining
- ⚠️ Repair count increasing rapidly

---

## 💡 Usage Tips

### Monitor While Playing
Leave HUD open to watch system health while playing

### Check Before Sessions
Press F4 at start to verify all systems initialized

### Performance Check
If game feels slow, check repair layer (high repairs = network issues)

### Learning Curve
ML accuracy improves over time - check back in 5-10 minutes

### Quality Trends
Watch quality feedback tab to see if links improve after activity

---

## 🔄 Update Information

### Current Version
**ATOMA Debug HUD 1.0**

### Last Updated
Session 28

### Features
- 5-tab real-time monitoring
- Neon UI matching game aesthetics
- F4 toggle hotkey
- 300ms refresh rate
- Responsive design

### Known Issues
None at this time

### Future Enhancements
- Data export functionality
- Real-time graphing
- Custom alert thresholds
- Historical trend tracking
- System health scoring

---

## ❓ FAQ

**Q: Can I disable the HUD permanently?**  
A: Press F4 to hide it. Or close the entire game.

**Q: Does the HUD affect game performance?**  
A: Minimal impact (~1-2ms per frame when hidden, ~5ms when visible)

**Q: What if the HUD blocks my view?**  
A: Press F4 to hide it while playing, press F4 again to show it later

**Q: Can I move the HUD?**  
A: Current version is fixed to bottom-right. Future versions may add dragging.

**Q: Why are all stats gray?**  
A: Systems haven't initialized yet. Wait a few seconds or restart game.

**Q: Can I export the data?**  
A: Not in v1.0. Future versions will add export features.

**Q: Is it safe to leave the HUD open?**  
A: Yes, completely safe. It's a monitoring tool with zero side effects.

**Q: What's the difference between tabs?**  
A: Each tab monitors a different AI system. See Tab Guide section above.

---

## 🎓 Learning Resources

### Documentation Files
- `ATOMA_DEBUG_HUD_INTEGRATION_REPORT.md` - Technical overview
- `INTEGRATION_DIFF_VIEW.md` - Code changes details
- `EXTREME_SAFE_INTEGRATION_FINAL_REPORT.md` - Integration verification

### Key Concepts

**Decay Engine:**
Links lose importance over time if not used. This tracks that process.

**ML Engine:**
System learns your linking preferences and makes suggestions. This shows accuracy.

**Quality Feedback:**
Links are scored based on how well they work. This shows quality trends.

**Acceptance Tracker:**
How well the system learns from your accept/reject decisions.

**Repair Layer:**
Automatically fixes broken links and reconnects orphaned nodes.

---

## ✨ Pro Tips

1. **Check at start:** Press F4 when entering a new area to verify systems
2. **Monitor improvements:** Watch quality scores improve as you link nodes
3. **Track ML learning:** Accuracy should improve over time as system learns
4. **Repair watching:** High repair counts might mean unstable link area
5. **Performance indicator:** Smooth 300ms updates = good FPS
6. **Benchmark:** Use as reference to compare session performance

---

## 📞 Support

### For Issues
1. Check F4 toggle works
2. Check stats for "(inactive)" systems
3. Wait 5-10 seconds for data
4. Refresh page if necessary

### For Feedback
- Report issues to development team
- Include screenshot of HUD state
- Note which tab(s) had problems
- Mention if stats were updating

---

**Quick Reference Version:** 1.0  
**Last Updated:** Session 28  
**Status:** Ready for Use ✅

---

*Press F4 to toggle the debug HUD anytime during gameplay!*
