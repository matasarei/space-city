import { describe, it, expect } from 'vitest';
import { Cell } from '../core/cell';
import { TerrainType } from '../core/terrain';
import { ZoneType } from '../core/zone';

describe('Cell', () => {
    it('should initialize with provided coordinates and terrain', () => {
        const cell = new Cell(2, 3, TerrainType.RedSand);
        
        expect(cell.x).toBe(2);
        expect(cell.y).toBe(3);
        expect(cell.terrain).toBe(TerrainType.RedSand);
    });

    it('should have default empty properties for zones and traffic', () => {
        const cell = new Cell(0, 0, TerrainType.Rock);
        
        expect(cell.zone).toBe(ZoneType.Empty);
        expect(cell.hasPowerLine).toBe(false);
        expect(cell.traffic).toBe(0);
        expect(cell.zoneEntity).toBeNull();
    });
});
