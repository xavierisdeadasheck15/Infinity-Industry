let metaStages = new WeakMap();
let turretDps = new Map();

// ---- Track Turret Damage Over Time ----
Events.on(BulletHitEvent, e => {
    if (!e || !e.bullet || !e.hit || !e.bullet.owner) return;

    const bullet = e.bullet;
    const owner = bullet.owner;
    const target = e.hit;

    // Only track turrets hitting META
    if (target && target.type && target.type.name === "meta" && owner.isBuilding()) {
        let block = owner.build;
        if (!block || !block.block.hasItems) return;

        let current = turretDps.get(block) ?? 0;
        turretDps.set(block, current + bullet.damage);
    }
});

// ---- Handle META Stages (25% HP Loss) ----
Events.on(UnitUpdateEvent, e => {
    const unit = e.unit;
    if (!unit || unit.type.name !== "meta") return;

    let currentStage = Math.floor((1 - (unit.health / unit.maxHealth)) / 0.25);
    let lastStage = metaStages.get(unit) ?? 0;

    if (currentStage > lastStage) {
        metaStages.set(unit, currentStage);

        // Find turret with highest DPS
        let sorted = [...turretDps.entries()].sort((a, b) => b[1] - a[1]);

        if (sorted.length > 0) {
            let [targetTurret] = sorted[Math.floor(Math.random() * Math.min(3, sorted.length))]; // Pick randomly from top 3

            if (targetTurret && targetTurret.isValid()) {
                Fx.massiveExplosion.at(targetTurret.x, targetTurret.y);
                Call.label("[red]META DESTROYED TURRET", targetTurret.x, targetTurret.y, 1, 1, 1);
                targetTurret.kill();
                turretDps.delete(targetTurret);
            }
        }
    }
});

// ---- Proximity Disable Effect ----
let disabledTurrets = new WeakSet();

Events.run(Trigger.update, () => {
    Groups.unit.each(meta => {
        if (meta.type.name !== "meta" || !meta.isAlive()) return;

        const radius = 120;
        let metaPos = new Vec2(meta.x, meta.y);

        Groups.build.each(b => {
            if (!b.team || !b.team.isAI || !b.block.hasItems) return;

            let dst = metaPos.dst(b.x, b.y);

            if (dst <= radius && !disabledTurrets.has(b)) {
                // Disable turret
                b.enabled = false;
                disabledTurrets.add(b);
                Call.label("[gray]TURRET DISABLED", b.x, b.y, 0.5, 1, 1);
            }

            if (dst > radius && disabledTurrets.has(b)) {
                // Re-enable turret
                b.enabled = true;
                disabledTurrets.delete(b);
                Call.label("[white]TURRET ONLINE", b.x, b.y, 0.5, 1, 1);
            }
        });
    });
});
