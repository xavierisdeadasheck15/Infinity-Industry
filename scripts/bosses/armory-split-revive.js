const headName = "armory-head";
const tailName = "armory-tail";
const bodyName = "armory-body";
const mainName = "armory";

let armoryDeathQueue = [];

Events.on(UnitDestroyEvent, event => {
    const unit = event.unit;

    if (unit == null || unit.type.name != mainName) return;

    // Wait 1 tick to let segments spawn
    Timer.schedule(() => {
        let head = null;
        let tail = null;
        let bodies = [];

        Groups.unit.each(u => {
            if (!u.isAlive()) return;

            if (u.type.name === headName) head = u;
            else if (u.type.name === tailName) tail = u;
            else if (u.type.name === bodyName) bodies.push(u);
        });

        const trackedSegments = [head, tail, ...bodies].filter(u => u != null);

        // Store time, segments, and respawn location
        armoryDeathQueue.push({
            time: Time.time,
            segments: trackedSegments,
            x: unit.x,
            y: unit.y
        });

        // Optional: visual/sound alert
        Call.label("[orange]ARMORY SEGMENTS ACTIVE", unit.x, unit.y, 1.5, 1.2, 1.2);
    }, 0.05); // ~1 tick later
});

Events.on(WorldUpdateEvent, e => {
    for (let i = 0; i < armoryDeathQueue.length; i++) {
        const entry = armoryDeathQueue[i];
        const elapsed = Time.time - entry.time;

        if (elapsed >= 60 * 15) { // 15 seconds = 60 ticks * 15
            // Check how many segments are alive
            const aliveSegments = entry.segments.filter(s => s.isValid() && s.isAlive()).length;

            if (aliveSegments > 0) {
                const newArmory = UnitTypes.crawler.create(Team.derelict); // Use appropriate team

                newArmory.set(entry.x, entry.y);
                newArmory.type = Vars.content.unit(mainName);
                newArmory.add(); // Adds to world

                // Health calculation
                const healthMap = {
                    4: 1.0,
                    3: 0.8,
                    2: 0.6,
                    1: 0.4
                };

                newArmory.health = newArmory.maxHealth * (healthMap[aliveSegments] || 1.0);

                Fx.spawnShockwave.at(entry.x, entry.y);
                Call.label(`[scarlet]ARMORY REVIVED (${Math.floor(newArmory.health / newArmory.maxHealth * 100)}%)`, entry.x, entry.y, 1.2, 1, 1);
            } else {
                // Optional: show defeated
                Call.label("[lime]ARMORY PERMANENTLY DESTROYED", entry.x, entry.y, 1.2, 1, 1);
            }

            // Cleanup this entry
            armoryDeathQueue.splice(i, 1);
            i--;
        }
    }
});
