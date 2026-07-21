export enum ZoneType {
    Empty = "Empty",
    Residential = "Residential",
    Commercial = "Commercial",
    Industrial = "Industrial",
    Transit = "Transit",
    PowerPlant = "PowerPlant",
    PowerLine = "PowerLine",
    Hospital = "Hospital",
    PoliceStation = "PoliceStation",
    MaintenanceDepot = "MaintenanceDepot",
    Launchpad = "Launchpad",
    DroneStation = "DroneStation",
    LandingBase = "LandingBase"
}

export class ZoneEntity {
    public id: string;
    public type: ZoneType;
    public centerX: number;
    public centerY: number;
    public population: number = 0;
    public densityLevel: number = 1;
    public isPowered: boolean = false;
    public isRoadConnected: boolean = false;
    public isBroken: boolean = false;
    public trafficPenalty: number = 0;

    constructor(id: string, type: ZoneType, cx: number, cy: number) {
        this.id = id;
        this.type = type;
        this.centerX = cx;
        this.centerY = cy;
    }
}
