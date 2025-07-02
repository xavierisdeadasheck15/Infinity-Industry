let straggleTriggers = new WeakMap();

Events.on(UnitUpdateEvent, event => {
    const unit = event.unit;

    if (unit == null || unit.type.name != "straggle") return;

    const healthPercent = unit.health / unit.maxHealth;
    const lostPercent = 1 - healthPercent;

    // Determine how many 25% chunks lost (0 to 3)
    const currentStage = Math.floor(lostPercent / 0.25);
    let lastStage = straggleTriggers.get(unit) ?? 0;

    if (currentStage > lastStage) {
        // Save new stage
        straggleTriggers.set(unit, currentStage);

        // Reset reload for all weapons
        for (let i = 0; i < unit.type.weapons.size; i++) {
            unit.reloads[i] = 0;
        }

        // Set invincibility
        unit.isImmune = true;

        // Optional: show visual effect
        Fx.shieldBreak.at(unit.x, unit.y);
        Call.label("[scarlet]Straggle Invincible!", unit.x, unit.y, 0.6, 1, 1);

        // Remove invincibility after 0.5 seconds (30 ticks)
        Timer.schedule(() => {
            if (unit.isAlive()) {
                unit.isImmune = false;
                Call.label("[white]Straggle Vulnerable", unit.x, unit.y, 0.5, 1, 1);
            }
        }, 0.5);
    }

    // Clean up if unit is dead
    if (!unit.isAlive()) {
        straggleTriggers.delete(unit);
    }
});
