import { TerrainType } from './terrain';
import { ZoneType, ZoneEntity } from './zone';

export class Cell {
    public x: number;
    public y: number;
    public terrain: TerrainType;
    public zone: ZoneType = ZoneType.Empty;
    public hasPowerLine: boolean = false;
    public traffic: number = 0;
    public zoneEntity: ZoneEntity | null = null;

    constructor(x: number, y: number, terrain: TerrainType) {
        this.x = x;
        this.y = y;
        this.terrain = terrain;
    }
}
