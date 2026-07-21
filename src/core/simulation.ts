import { CityManager } from './cityManager';
import { ZoneType, ZoneEntity } from './zone';

export class SimulationEngine {
    public date = new Date(2100, 0, 1);
    public funds = 5000;
    public population = 0;
    private poweredCells = new Set<string>();
    
    public lastRevenue = { r: 0, c: 0, i: 0 };
    public lastExpenses = { power: 0, health: 0, police: 0, maint: 0 };

    constructor(private cityManager: CityManager) {}
    
    public tick() {
        this.date.setMonth(this.date.getMonth() + 1);
        
        this.calculatePowerGrid();
        this.calculateTraffic();
        
        let newPopulation = 0;
        
        // Calculate total current population by zone type for RCI Demand
        let popR = 0, popC = 0, popI = 0;
        const hospitals: import('./zone').ZoneEntity[] = [];
        const police: import('./zone').ZoneEntity[] = [];
        const maintenance: import('./zone').ZoneEntity[] = [];
        
        let expPower = 0, expHealth = 0, expPolice = 0, expMaint = 0;
        let revR = 0, revC = 0, revI = 0;

        for (const z of this.cityManager.zones) {
            if (z.type === ZoneType.Residential) popR += z.population;
            if (z.type === ZoneType.Commercial) popC += z.population;
            if (z.type === ZoneType.Industrial) popI += z.population;
            
            z.isPowered = this.checkZonePower(z);
            z.isRoadConnected = this.checkZoneRoad(z);
            
            if (z.type === ZoneType.PowerPlant || z.type === ZoneType.LandingBase) {
                z.isPowered = true;
                z.isRoadConnected = true;
                if (z.type === ZoneType.PowerPlant) expPower += 150;
                // LandingBase is completely neutral to the economy
            } else if (z.isPowered && z.isRoadConnected) {
                if (z.type === ZoneType.Hospital) { expHealth += 200; hospitals.push(z); }
                if (z.type === ZoneType.PoliceStation) { expPolice += 200; police.push(z); }
                if (z.type === ZoneType.MaintenanceDepot) { expMaint += 250; maintenance.push(z); }
                if (z.type === ZoneType.Launchpad) { expMaint += 500; } // High maintenance cost
                if (z.type === ZoneType.DroneStation) { expMaint += 100; }
            }
        }
        
        const checkCoverage = (z: import('./zone').ZoneEntity, list: import('./zone').ZoneEntity[], radius: number) => {
            for (const s of list) {
                const dist = Math.max(Math.abs(z.centerX - s.centerX), Math.abs(z.centerY - s.centerY));
                if (dist <= radius) return true;
            }
            return false;
        };

        for (const zone of this.cityManager.zones) {
            if ([ZoneType.PowerPlant, ZoneType.Hospital, ZoneType.PoliceStation, ZoneType.MaintenanceDepot, ZoneType.Launchpad, ZoneType.LandingBase].includes(zone.type)) {
                continue;
            }
            
            const hasHealth = checkCoverage(zone, hospitals, 25);
            const hasPolice = checkCoverage(zone, police, 25);
            const hasMaint = checkCoverage(zone, maintenance, 25);

            if (hasMaint && zone.isBroken) {
                zone.isBroken = false;
            } else if (!hasMaint && Math.random() < 0.01) { 
                zone.isBroken = true;
            }

            if (zone.isPowered && zone.isRoadConnected && !zone.isBroken) {
                let demand = 1.0;
                if (!hasHealth) demand -= 0.2; 
                if (!hasPolice) demand -= 0.2;
                if (zone.trafficPenalty > 0) demand -= zone.trafficPenalty; // Apply traffic gridlock penalty

                if (zone.type === ZoneType.Residential) {
                    if (popR > (popC + popI) * 2 + 100) demand = 0; // More forgiving start limit
                } else if (zone.type === ZoneType.Commercial) {
                    if (popC > popR * 0.8 + 30) demand = 0;
                } else if (zone.type === ZoneType.Industrial) {
                    if (popI > popR * 0.8 + 30) demand = 0;
                }

                if (zone.population < 100 && demand > 0) {
                    // Guarantee at least 1 population growth if there is demand
                    const growth = Math.max(1, Math.floor((Math.random() * 4 + 1) * demand));
                    zone.population += growth;
                    if (zone.population > 100) zone.population = 100;
                }
                
                if (zone.type === ZoneType.Residential) revR += Math.floor(zone.population * 0.5);
                if (zone.type === ZoneType.Commercial) revC += Math.floor(zone.population * 1.5); 
                if (zone.type === ZoneType.Industrial) revI += Math.floor(zone.population * 1.2); 
            } else {
                if (zone.population > 0) zone.population -= zone.isBroken ? 2 : 1; // Lose population slower
                if (zone.population < 0) zone.population = 0;
            }
            
            newPopulation += zone.population;
        }
        
        let roadCount = 0;
        let powerLineCount = 0;
        for (let y = 0; y < this.cityManager.grid.height; y++) {
            for (let x = 0; x < this.cityManager.grid.width; x++) {
                const cell = this.cityManager.grid.getCell(x, y);
                if (cell) {
                    if (cell.zone === ZoneType.Transit) roadCount++;
                    if (cell.hasPowerLine) powerLineCount++;
                }
            }
        }
        expMaint += roadCount * 1;
        expPower += powerLineCount * 1;

        this.lastRevenue = { r: revR, c: revC, i: revI };
        this.lastExpenses = { power: expPower, health: expHealth, police: expPolice, maint: expMaint };
        const totalRev = revR + revC + revI;
        const totalExp = expPower + expHealth + expPolice + expMaint;
        this.funds += (totalRev - totalExp);

        this.population = newPopulation;
    }

    private calculatePowerGrid() {
        this.poweredCells.clear();
        
        const powerPlants = this.cityManager.zones.filter(z => z.type === ZoneType.PowerPlant);
        const queue: {x: number, y: number}[] = [];
        
        for (const pp of powerPlants) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const cx = pp.centerX + dx;
                    const cy = pp.centerY + dy;
                    queue.push({x: cx, y: cy});
                    this.poweredCells.add(`${cx},${cy}`);
                }
            }
        }
        
        let head = 0;
        while(head < queue.length) {
            const curr = queue[head++];
            const neighbors = [
                {x: curr.x, y: curr.y-1}, {x: curr.x, y: curr.y+1},
                {x: curr.x-1, y: curr.y}, {x: curr.x+1, y: curr.y},
                {x: curr.x-1, y: curr.y-1}, {x: curr.x+1, y: curr.y+1},
                {x: curr.x-1, y: curr.y+1}, {x: curr.x+1, y: curr.y-1}, // Diagonals carry power
            ];
            
            for (const n of neighbors) {
                const key = `${n.x},${n.y}`;
                if (!this.poweredCells.has(key)) {
                    const cell = this.cityManager.grid.getCell(n.x, n.y);
                    if (cell && (cell.hasPowerLine || cell.zoneEntity != null)) {
                        this.poweredCells.add(key);
                        queue.push(n);
                    }
                }
            }
        }
    }
    
    private calculateTraffic() {
        for (let y = 0; y < this.cityManager.grid.height; y++) {
            for (let x = 0; x < this.cityManager.grid.width; x++) {
                const cell = this.cityManager.grid.getCell(x, y);
                if (cell) cell.traffic = 0;
            }
        }
        
        for (const zone of this.cityManager.zones) {
            zone.trafficPenalty = 0;
        }

        const resZones = this.cityManager.zones.filter(z => z.type === ZoneType.Residential && z.population > 0);
        const workZones = this.cityManager.zones.filter(z => (z.type === ZoneType.Commercial || z.type === ZoneType.Industrial) && z.population > 0);
        
        const activeLaunchpads = this.cityManager.zones.filter(z => z.type === ZoneType.Launchpad && z.isPowered && z.isRoadConnected && !z.isBroken);
        const airNetworkActive = activeLaunchpads.length >= 2;

        const activeDroneStations = this.cityManager.zones.filter(z => z.type === ZoneType.DroneStation && z.isPowered && z.isRoadConnected && !z.isBroken);
        const droneNetworkActive = activeDroneStations.length >= 2;

        if (workZones.length === 0) return;

        for (const res of resZones) {
            // BFS/Dijkstra to find nearest work zone along roads
            const queue: {x: number, y: number, path: {x:number, y:number}[]}[] = [];
            const visited = new Set<string>();
            
            queue.push({x: res.centerX, y: res.centerY, path: []});
            visited.add(`${res.centerX},${res.centerY}`);
            
            let foundPath: {x:number, y:number}[] | null = null;
            
            while (queue.length > 0) {
                const curr = queue.shift()!;
                
                const cell = this.cityManager.grid.getCell(curr.x, curr.y);
                if (cell && cell.zoneEntity && (cell.zoneEntity.type === ZoneType.Commercial || cell.zoneEntity.type === ZoneType.Industrial)) {
                    foundPath = curr.path;
                    break;
                }
                
                // Allow walking onto adjacent roads or adjacent work zones
                const neighbors = [
                    {x: curr.x, y: curr.y-1}, {x: curr.x, y: curr.y+1},
                    {x: curr.x-1, y: curr.y}, {x: curr.x+1, y: curr.y}
                ];
                
                for (const n of neighbors) {
                    const key = `${n.x},${n.y}`;
                    if (!visited.has(key)) {
                        const nCell = this.cityManager.grid.getCell(n.x, n.y);
                        if (nCell) {
                            // Can traverse if it's a Transit (Road), the destination Work Zone, the starting zone's own footprint, or a Launchpad
                            const isTransit = nCell.zone === ZoneType.Transit;
                            const isWork = nCell.zoneEntity && (nCell.zoneEntity.type === ZoneType.Commercial || nCell.zoneEntity.type === ZoneType.Industrial);
                            const isSameZone = nCell.zoneEntity && nCell.zoneEntity.id === res.id;
                            const isLaunchpad = nCell.zoneEntity && nCell.zoneEntity.type === ZoneType.Launchpad;
                            const isDroneStation = nCell.zoneEntity && nCell.zoneEntity.type === ZoneType.DroneStation;
                            
                            if (isTransit || isWork || isSameZone || isLaunchpad || isDroneStation) {
                                visited.add(key);
                                const newPath = [...curr.path];
                                if (isTransit) newPath.push({x: n.x, y: n.y});
                                queue.push({x: n.x, y: n.y, path: newPath});
                                
                                // Air Network Teleport
                                if (isLaunchpad && airNetworkActive) {
                                    for (const lp of activeLaunchpads) {
                                        if (lp.id !== nCell.zoneEntity!.id) {
                                            const lpKey = `${lp.centerX},${lp.centerY}`;
                                            if (!visited.has(lpKey)) {
                                                visited.add(lpKey);
                                                // Jump directly to other launchpad without adding any road cells to path
                                                queue.push({x: lp.centerX, y: lp.centerY, path: [...newPath]});
                                            }
                                        }
                                    }
                                }
                                
                                // Drone Network Teleport
                                if (isDroneStation && droneNetworkActive) {
                                    for (const ds of activeDroneStations) {
                                        if (ds.id !== nCell.zoneEntity!.id) {
                                            const dsKey = `${ds.centerX},${ds.centerY}`;
                                            if (!visited.has(dsKey)) {
                                                visited.add(dsKey);
                                                // Jump directly to other drone station without adding any road cells to path
                                                queue.push({x: ds.centerX, y: ds.centerY, path: [...newPath]});
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            if (foundPath) {
                let maxTrafficOnPath = 0;
                for (const p of foundPath) {
                    const c = this.cityManager.grid.getCell(p.x, p.y);
                    if (c) {
                        c.traffic += res.population;
                        if (c.traffic > maxTrafficOnPath) maxTrafficOnPath = c.traffic;
                    }
                }
                // Traffic above 100 starts causing penalties
                if (maxTrafficOnPath > 100) {
                    res.trafficPenalty = Math.min(1.0, (maxTrafficOnPath - 100) / 100);
                }
            } else {
                // Cannot reach work, severe penalty
                res.trafficPenalty = 1.0;
            }
        }
    }
    
    private checkZonePower(zone: ZoneEntity): boolean {
        if (zone.type === ZoneType.DroneStation) {
            return this.poweredCells.has(`${zone.centerX},${zone.centerY}`);
        }
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (this.poweredCells.has(`${zone.centerX + dx},${zone.centerY + dy}`)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    private checkZoneRoad(zone: ZoneEntity): boolean {
        if (zone.type === ZoneType.DroneStation) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (Math.abs(dx) + Math.abs(dy) === 1) { // adjacent
                        const cell = this.cityManager.grid.getCell(zone.centerX + dx, zone.centerY + dy);
                        if (cell && cell.zone === ZoneType.Transit) return true;
                    }
                }
            }
            return false;
        }

        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (Math.abs(dx) === 2 || Math.abs(dy) === 2) {
                    const cell = this.cityManager.grid.getCell(zone.centerX + dx, zone.centerY + dy);
                    if (cell && cell.zone === ZoneType.Transit) return true;
                }
            }
        }
        return false;
    }
}
