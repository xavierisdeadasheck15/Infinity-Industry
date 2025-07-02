// Assuming the unit type is already created and named "Rusher"
const overclocked = StatusEffects.overclock; // built-in status effect

Events.on(UnitUpdateEvent, event => {
    const unit = event.unit;

    if (unit == null || unit.type.name != "rusher") return;

    // Only apply if not already affected
    if (unit.health <= unit.maxHealth / 2 && !unit.hasEffect(overclock)) {
        // Apply Overclocked for 10 seconds (600 ticks)
        unit.apply(overclock, 600);
    }
});
