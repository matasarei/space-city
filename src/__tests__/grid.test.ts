import { describe, it, expect } from 'vitest';
import { Grid } from '../core/grid';
import { TerrainType } from '../core/terrain';

describe('Grid', () => {
    it('should create an empty grid when useNoise is false', () => {
        const grid = new Grid(10, 10, false);
        
        expect(grid.width).toBe(10);
        expect(grid.height).toBe(10);

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = grid.getCell(x, y);
                expect(cell).toBeDefined();
                expect(cell?.x).toBe(x);
                expect(cell?.y).toBe(y);
                expect(cell?.terrain).toBe(TerrainType.RedSand);
            }
        }
    });

    it('should create a procedural grid when useNoise is true', () => {
        const grid = new Grid(20, 20, true);
        
        expect(grid.width).toBe(20);
        expect(grid.height).toBe(20);

        // Procedural generation uses randomness (simplex noise) so we just verify types
        let hasOtherTerrain = false;
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 20; x++) {
                const cell = grid.getCell(x, y);
                expect(cell).toBeDefined();
                if (cell?.terrain !== TerrainType.RedSand) {
                    hasOtherTerrain = true;
                }
            }
        }
        // It's statistically very likely a 20x20 grid with noise has some non-sand tiles
        expect(hasOtherTerrain).toBe(true);
    });

    it('should return null for out of bounds coordinates', () => {
        const grid = new Grid(5, 5, false);

        expect(grid.getCell(-1, 0)).toBeNull();
        expect(grid.getCell(0, -1)).toBeNull();
        expect(grid.getCell(5, 0)).toBeNull();
        expect(grid.getCell(0, 5)).toBeNull();
        expect(grid.getCell(-10, -10)).toBeNull();
        expect(grid.getCell(10, 10)).toBeNull();
    });
});
