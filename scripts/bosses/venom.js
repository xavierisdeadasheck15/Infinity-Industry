let trackedUnits = new WeakMap();

Events.on(UnitUpdateEvent, event => {
    const unit = event.unit;

    // Only apply to Venom
    if (unit == null || unit.type.name != "venom") return;

    const healthPercent = unit.health / unit.maxHealth;
    const lostPercent = 1 - healthPercent;

    // Get current stage of health loss (0-9)
    const currentStage = Math.floor(lostPercent / 0.1);

    // Get previous stage from memory (default to 0)
    let lastStage = trackedUnits.get(unit) ?? 0;

    if (currentStage > lastStage) {
        // Apply speed increase: +0.25 for each 10% lost
        let addedSpeed = (currentStage - lastStage) * 0.25;
        unit.speed += addedSpeed;

        // Optional: Display floating text
        Call.label(`[lime]+${addedSpeed.toFixed(2)} Speed`, unit.x, unit.y, 0.7, 1, 1);

        // Save updated stage
        trackedUnits.set(unit, currentStage);
    }

    // Clean up dead units
    if (!unit.isAlive()) {
        trackedUnits.delete(unit);
    }
});
