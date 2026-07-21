import { Grid } from './grid';
import { TerrainType } from './terrain';
import { ZoneType, ZoneEntity } from './zone';

export class CityManager {
    public readonly grid: Grid;
    public zones: ZoneEntity[] = [];
    private nextZoneId = 1;

    constructor(width: number, height: number, proceduralTerrain: boolean = true) {
        this.grid = new Grid(width, height, proceduralTerrain);
        
        // Spawn initial LandingBase very close to the top-left corner (guaranteed visible)
        // Values 3-7 ensure it doesn't get hidden behind left or top UI panels
        const cx = Math.floor(Math.random() * 5) + 3; 
        const cy = Math.floor(Math.random() * 5) + 3;
        
        // Ensure terrain underneath isn't a crater
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const cell = this.grid.getCell(cx + dx, cy + dy);
                if (cell) cell.terrain = TerrainType.RedSand;
            }
        }
        
        const placed = this.placeZone(cx, cy, ZoneType.LandingBase);
        console.log(`LandingBase placed at ${cx}, ${cy}: ${placed}`);
        const base = this.zones.find(z => z.type === ZoneType.LandingBase);
        if (base) {
            base.population = 50;
        }
        (window as any).__CITY_MANAGER = this;
    }

    public placeZone(centerX: number, centerY: number, zoneType: ZoneType): boolean {
        const isMacroZone = [
            ZoneType.Residential, ZoneType.Commercial, ZoneType.Industrial, 
            ZoneType.PowerPlant, ZoneType.Hospital, ZoneType.PoliceStation, ZoneType.MaintenanceDepot, ZoneType.Launchpad, ZoneType.LandingBase
        ].includes(zoneType);
        
        if (isMacroZone) {
            // Check 3x3 area
            const cellsToModify: import('./cell').Cell[] = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const cell = this.grid.getCell(centerX + dx, centerY + dy);
                    if (!cell || cell.terrain === TerrainType.Crater || cell.zone !== ZoneType.Empty) {
                        return false;
                    }
                    cellsToModify.push(cell);
                }
            }
            
            // Apply zoning and group them into a single ZoneEntity
            const entity = new ZoneEntity((this.nextZoneId++).toString(), zoneType, centerX, centerY);
            this.zones.push(entity);

            cellsToModify.forEach(cell => {
                cell.zone = zoneType;
                cell.zoneEntity = entity;
            });
            return true;
        } else if (zoneType === ZoneType.DroneStation) {
            const cell = this.grid.getCell(centerX, centerY);
            if (!cell || cell.terrain === TerrainType.Crater || cell.zone !== ZoneType.Empty) {
                return false;
            }
            const entity = new ZoneEntity((this.nextZoneId++).toString(), zoneType, centerX, centerY);
            this.zones.push(entity);
            cell.zone = zoneType;
            cell.zoneEntity = entity;
            return true;
        } else {
            // 1x1 zoning (Transit)
            const cell = this.grid.getCell(centerX, centerY);
            if (!cell) return false;

            if (zoneType === ZoneType.PowerLine) {
                if (cell.zoneEntity != null) return false; // Can't put on buildings
                cell.hasPowerLine = true;
                return true;
            }

            if (zoneType === ZoneType.Transit) {
                if (cell.zoneEntity != null) return false; // Can't put on buildings
                cell.zone = ZoneType.Transit;
                return true;
            }

            return false;
        }
    }
    
    public clearZone(x: number, y: number): boolean {
        const cell = this.grid.getCell(x, y);
        if (!cell) return false;
        
        if (cell.zoneEntity) {
            const id = cell.zoneEntity.id;
            this.zones = this.zones.filter(z => z.id !== id);
            for (let cy = 0; cy < this.grid.height; cy++) {
                for (let cx = 0; cx < this.grid.width; cx++) {
                    const c = this.grid.getCell(cx, cy);
                    if (c && c.zoneEntity && c.zoneEntity.id === id) {
                        c.zone = ZoneType.Empty;
                        c.zoneEntity = null;
                    }
                }
            }
            return true;
        }
        
        if (cell.hasPowerLine || cell.zone !== ZoneType.Empty) {
            cell.hasPowerLine = false;
            cell.zone = ZoneType.Empty;
            return true;
        }

        return false;
    }
}
