// ============================================================================
// UserAcceptanceTracker1_0 — Safe, Minimal, Strict-Mode Compatible
// Tracks how often the player ACCEPTS or REJECTS automatically suggested links.
// No eval, no dynamic argument calls, fully strict-mode safe.
// ============================================================================

export class UserAcceptanceTracker1_0 {

    constructor() {
        // Store acceptance/rejection stats per category
        this.stats = {
            totalAccepted: 0,
            totalRejected: 0,
            perCategory: new Map()
        };

        // Store interaction timestamps (optional)
        this.interactions = [];

        console.log('[UserAcceptanceTracker1_0] Online ✓');
    }

    // Called when a link is created manually OR automatically
    trackLinkCreation(link) {
        if (!link) return;

        const category = link?.category || 'unknown';
        this._ensureCategory(category);

        this.stats.perCategory.get(category).created++;
    }

    // Called when a link is removed manually
    trackLinkRemoval(link) {
        if (!link) return;

        const category = link?.category || 'unknown';
        this._ensureCategory(category);

        this.stats.perCategory.get(category).removed++;
    }

    // Called when the player interacts with a link
    trackInteraction(link, action) {
        if (!link || !action) return;

        const category = link?.category || 'unknown';
        this._ensureCategory(category);

        this.interactions.push({
            time: performance.now(),
            category,
            action
        });
    }

    // Called by automation when a link suggestion is accepted
    registerAcceptance(link) {
        if (!link) return;

        this.stats.totalAccepted++;

        const category = link?.category || 'unknown';
        this._ensureCategory(category);

        this.stats.perCategory.get(category).accepted++;
    }

    // Called by automation when rejected
    registerRejection(link) {
        if (!link) return;

        this.stats.totalRejected++;

        const category = link?.category || 'unknown';
        this._ensureCategory(category);

        this.stats.perCategory.get(category).rejected++;
    }

    // Retrieve recent interactions
    getRecentInteractions(limit = 10) {
        return this.interactions.slice(-limit);
    }

    // Summary for ML engines
    getCategoryStats(category) {
        if (!category) return null;
        return this.stats.perCategory.get(category) || null;
    }

    // Internal helper to ensure category stats exist
    _ensureCategory(category) {
        if (!this.stats.perCategory.has(category)) {
            this.stats.perCategory.set(category, {
                created: 0,
                removed: 0,
                accepted: 0,
                rejected: 0
            });
        }
    }
}
