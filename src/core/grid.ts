import { Cell } from './cell';
import { TerrainType } from './terrain';
import { createNoise2D } from 'simplex-noise';

export class Grid {
    public readonly width: number;
    public readonly height: number;
    private cells: Cell[][];

    constructor(width: number, height: number, useNoise: boolean = true) {
        this.width = width;
        this.height = height;
        if (useNoise) {
            this.cells = this.generateProceduralGrid(width, height);
        } else {
            this.cells = this.generateEmptyGrid(width, height);
        }
    }

    private generateEmptyGrid(width: number, height: number): Cell[][] {
        const grid: Cell[][] = [];
        for (let y = 0; y < height; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < width; x++) {
                row.push(new Cell(x, y, TerrainType.RedSand));
            }
            grid.push(row);
        }
        return grid;
    }

    private generateProceduralGrid(width: number, height: number): Cell[][] {
        const grid: Cell[][] = [];
        const noiseRock = createNoise2D();
        const noiseIce = createNoise2D();
        const noiseCrater = createNoise2D();

        for (let y = 0; y < height; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < width; x++) {
                let terrain = TerrainType.RedSand;
                
                // Adjust scale for organic clustering
                const scale = 0.08;
                
                const valRock = noiseRock(x * scale, y * scale);
                const valIce = noiseIce(x * scale, y * scale);
                const valCrater = noiseCrater(x * 0.15, y * 0.15); // Smaller clusters

                // Layering logic based on thresholds
                if (valCrater > 0.8) {
                    terrain = TerrainType.Crater;
                } else if (valIce > 0.6) {
                    terrain = TerrainType.Ice;
                } else if (valRock > 0.4) {
                    terrain = TerrainType.Rock;
                } else if (valRock > 0.3 && valRock <= 0.4) {
                    // Fringe of rock patches
                    terrain = Math.random() > 0.7 ? TerrainType.Iron : TerrainType.Rock;
                }

                row.push(new Cell(x, y, terrain));
            }
            grid.push(row);
        }
        return grid;
    }

    public getCell(x: number, y: number): Cell | null {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null; // Out of bounds
        }
        return this.cells[y][x];
    }
}
