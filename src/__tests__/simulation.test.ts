import { describe, it, expect, beforeEach } from 'vitest';
import { SimulationEngine } from '../core/simulation';
import { CityManager } from '../core/cityManager';
import { ZoneType } from '../core/zone';

describe('SimulationEngine', () => {
    let manager: CityManager;
    let engine: SimulationEngine;

    beforeEach(() => {
        manager = new CityManager(30, 30, false);
        // Clear LandingBase
        const initialZones = [...manager.zones];
        initialZones.forEach(z => manager.clearZone(z.centerX, z.centerY));

        engine = new SimulationEngine(manager);
    });

    it('should initialize with starting funds and population', () => {
        expect(engine.funds).toBe(5000);
        expect(engine.population).toBe(0);
    });

    describe('Power and Roads', () => {
        it('PowerPlant provides power to adjacent zones', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(5, 8, ZoneType.Residential);
            // PowerPlant covers (4,4) to (6,6). Adjacent is (3,3) to (7,7)
            // Residential is (4,7) to (6,9). They touch at y=7! Wait, the powerplant's power radius is just its bounding box + 1?
            // Actually checkZonePower checks if any 3x3 of the zone touches the poweredCells.
            
            engine.tick();
            
            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            expect(res.isPowered).toBe(true);
        });

        it('PowerLines distribute power further', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant); // 4-6
            manager.placeZone(5, 7, ZoneType.PowerLine); // 5,7
            manager.placeZone(5, 8, ZoneType.PowerLine); // 5,8
            manager.placeZone(5, 9, ZoneType.PowerLine); // 5,9
            manager.placeZone(5, 10, ZoneType.PowerLine); // 5,10
            manager.placeZone(5, 12, ZoneType.Residential); // 11-13
            
            engine.tick();
            
            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            expect(res.isPowered).toBe(true);
        });

        it('Road adjacency provides road connection', () => {
            manager.placeZone(5, 5, ZoneType.Residential);
            // Place road next to Residential (center 5,5 covers 4-6. Road at 7,5 is adjacent)
            manager.placeZone(7, 5, ZoneType.Transit);
            
            engine.tick();
            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            expect(res.isRoadConnected).toBe(true);
        });
    });

    describe('Population Growth & Demands', () => {
        it('Residential grows if powered and road connected', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(8, 5, ZoneType.Residential);
            manager.placeZone(10, 5, ZoneType.Transit); // Provide road

            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            res.population = 10;
            engine.tick();
            
            expect(res.population).toBeGreaterThan(0);
            expect(engine.population).toBeGreaterThan(0);
            expect(engine.lastRevenue.r).toBeGreaterThan(0);
        });

        it('Commercial grows if there is Residential population', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(5, 8, ZoneType.Residential);
            manager.placeZone(7, 8, ZoneType.Transit);
            manager.placeZone(8, 11, ZoneType.Commercial);
            manager.placeZone(10, 11, ZoneType.Transit);
            
            // Artificial boost to R pop
            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            res.population = 50;

            engine.tick();
            
            const com = manager.zones.find(z => z.type === ZoneType.Commercial)!;
            expect(com.population).toBeGreaterThan(0);
            expect(engine.lastRevenue.c).toBeGreaterThan(0);
        });
        
        it('Industrial grows if there is Residential population', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(5, 8, ZoneType.Residential);
            manager.placeZone(7, 8, ZoneType.Transit);
            manager.placeZone(8, 11, ZoneType.Industrial);
            manager.placeZone(10, 11, ZoneType.Transit);
            
            // Artificial boost to R pop
            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            res.population = 50;

            engine.tick();
            
            const ind = manager.zones.find(z => z.type === ZoneType.Industrial)!;
            expect(ind.population).toBeGreaterThan(0);
            expect(engine.lastRevenue.i).toBeGreaterThan(0);
        });

        it('Population shrinks if no power/road', () => {
            manager.placeZone(5, 5, ZoneType.Residential);
            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            res.population = 10;
            
            engine.tick();
            expect(res.population).toBeLessThan(10);
        });
    });

    describe('Services & Maintenance', () => {
        it('should break down randomly without maintenance, but fixed with maintenance', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(5, 8, ZoneType.Residential);
            manager.placeZone(7, 8, ZoneType.Transit); // Provide road for residential
            manager.placeZone(8, 5, ZoneType.MaintenanceDepot); // Next to PowerPlant (overlaps x=7, gets power)
            manager.placeZone(8, 7, ZoneType.Transit); // Provide road for MaintenanceDepot
            
            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            res.isBroken = true;

            engine.tick();
            
            // Maintenance depot should fix it
            expect(res.isBroken).toBe(false);
        });
        
        it('DroneStation should be powered if on powered cell', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(7, 5, ZoneType.DroneStation);
            
            engine.tick();
            const ds = manager.zones.find(z => z.type === ZoneType.DroneStation)!;
            expect(ds.isPowered).toBe(true);
        });
    });

    describe('Traffic and Pathfinding', () => {
        it('should calculate traffic path from Residential to Work', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(5, 8, ZoneType.Residential);
            manager.placeZone(5, 12, ZoneType.Commercial);
            
            // Connect with road from (5,10) to (5,10)
            manager.placeZone(5, 10, ZoneType.Transit);

            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            res.population = 150; // Generate high traffic

            const com = manager.zones.find(z => z.type === ZoneType.Commercial)!;
            com.population = 50; // Ensure work zone is active

            engine.tick();

            // Transit cell at 5,10 should have traffic
            const transitCell = manager.grid.getCell(5, 10);
            expect(transitCell?.traffic).toBeGreaterThan(0);
            expect(res.trafficPenalty).toBeGreaterThan(0); // Because population 150 > 100 capacity
        });
        
        it('should teleport traffic via Launchpads', () => {
            manager.placeZone(5, 5, ZoneType.PowerPlant);
            manager.placeZone(5, 10, ZoneType.Residential);
            manager.placeZone(5, 20, ZoneType.Commercial);
            
            manager.placeZone(8, 10, ZoneType.Launchpad);
            manager.placeZone(8, 20, ZoneType.Launchpad);
            
            // Add roads to connect
            manager.placeZone(7, 10, ZoneType.Transit);
            manager.placeZone(7, 20, ZoneType.Transit);

            const res = manager.zones.find(z => z.type === ZoneType.Residential)!;
            res.population = 50;

            engine.tick();
            
            // Path found successfully without continuous roads
            expect(res.trafficPenalty).toBe(0);
        });
    });
});
