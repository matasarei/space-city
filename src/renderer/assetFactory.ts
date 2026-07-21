import { Graphics, Application, Texture } from 'pixi.js';

export class AssetFactory {
    public static roadTexturesCyan: Texture[] = [];
    public static roadTexturesYellow: Texture[] = [];
    public static roadTexturesRed: Texture[] = [];
    public static powerLineTextures: Texture[] = [];
    public static terrainTextures: Record<string, Texture> = {};
    public static buildingTextures: Record<string, Texture> = {};

    public static generateAll(app: Application) {
        this.generateTerrain(app);
        this.generateRoads(app, 0x00FFFF, this.roadTexturesCyan);
        this.generateRoads(app, 0xFFFF00, this.roadTexturesYellow);
        this.generateRoads(app, 0xFF0000, this.roadTexturesRed);
        this.generatePowerLines(app);
        this.generateBuildings(app);
    }

    private static generateTerrain(app: Application) {
        let g = new Graphics();
        g.rect(0, 0, 32, 32);
        g.fill(0xAA4433);
        for(let i=0; i<20; i++) {
            g.rect(Math.random()*30, Math.random()*30, 2, 2);
            g.fill(0x993322);
        }
        this.terrainTextures['redsand'] = app.renderer.generateTexture(g);
        
        g = new Graphics();
        g.rect(0, 0, 32, 32);
        g.fill(0xAA4433);
        g.circle(16, 16, 12);
        g.fill(0x554444);
        g.circle(10, 10, 6);
        g.fill(0x665555);
        this.terrainTextures['rock'] = app.renderer.generateTexture(g);

        g = new Graphics();
        g.rect(0, 0, 32, 32);
        g.fill(0xAA4433);
        g.circle(16, 16, 14);
        g.fill(0x662211);
        g.circle(16, 16, 10);
        g.fill(0x331100);
        this.terrainTextures['crater'] = app.renderer.generateTexture(g);
    }

    private static generateRoads(app: Application, glowColor: number, targetArray: Texture[]) {
        for (let i = 0; i < 16; i++) {
            const g = new Graphics();
            g.rect(0, 0, 32, 32);
            g.fill(0xAA4433); // Mars sand base
            
            // Tube base
            g.rect(10, 10, 12, 12);
            g.fill(0x222222);
            
            if (i & 1) { g.rect(10, 0, 12, 10); g.fill(0x222222); } 
            if (i & 2) { g.rect(22, 10, 10, 12); g.fill(0x222222); } 
            if (i & 4) { g.rect(10, 22, 12, 10); g.fill(0x222222); } 
            if (i & 8) { g.rect(0, 10, 10, 12); g.fill(0x222222); } 

            // Glowing lines
            g.rect(15, 14, 2, 4); g.fill(glowColor);
            if (i & 1) { g.rect(15, 0, 2, 14); g.fill(glowColor); }
            if (i & 2) { g.rect(18, 15, 14, 2); g.fill(glowColor); }
            if (i & 4) { g.rect(15, 18, 2, 14); g.fill(glowColor); }
            if (i & 8) { g.rect(0, 15, 14, 2); g.fill(glowColor); }
            
            // Tube Ribs/Supports (Metal rings)
            g.rect(12, 12, 8, 8); g.stroke({color: 0x555555, width: 1}); // center junction
            
            if (i & 1) { g.rect(10, 4, 12, 2); g.fill(0x555555); }
            if (i & 2) { g.rect(26, 10, 2, 12); g.fill(0x555555); }
            if (i & 4) { g.rect(10, 26, 12, 2); g.fill(0x555555); }
            if (i & 8) { g.rect(4, 10, 2, 12); g.fill(0x555555); }

            targetArray[i] = app.renderer.generateTexture(g);
        }
    }

    private static generatePowerLines(app: Application) {
        for (let i = 0; i < 16; i++) {
            const g = new Graphics();
            
            // Force 32x32 bounds with a completely transparent rectangle
            // Otherwise PixiJS will crop the texture to just the pole/lines and stretch it!
            g.rect(0, 0, 32, 32);
            g.fill({ color: 0x000000, alpha: 0 });
            
            if (i & 1) { g.rect(15, 0, 2, 16); g.fill(0x222222); }
            if (i & 2) { g.rect(16, 15, 16, 2); g.fill(0x222222); }
            if (i & 4) { g.rect(15, 16, 2, 16); g.fill(0x222222); }
            if (i & 8) { g.rect(0, 15, 16, 2); g.fill(0x222222); }

            g.rect(14, 14, 4, 4);
            g.fill(0x888888);

            this.powerLineTextures[i] = app.renderer.generateTexture(g);
        }
    }

    private static generateBuildings(app: Application) {
        this.generateResidentialAssets(app);
        this.generateCommercialAssets(app);
        this.generateIndustrialAssets(app);
        
        // Power Plant 3x3
        const p = new Graphics();
        p.rect(0, 0, 96, 96); p.fill(0x555555); // base
        // Cooling towers / Reactor cores
        p.circle(72, 72, 16); p.fill(0x333333);
        p.circle(72, 72, 10); p.fill(0x00FFFF); // glowing core
        p.circle(72, 24, 16); p.fill(0x333333);
        p.circle(72, 24, 10); p.fill(0x00FFFF); 
        // Pipes connecting cores to main building
        p.rect(48, 22, 12, 4); p.fill(0x777777); 
        p.rect(48, 70, 12, 4); p.fill(0x777777);
        p.rect(56, 26, 4, 44); p.fill(0x777777);
        // Main generator building
        p.rect(8, 8, 40, 80); p.fill(0x444444);
        // Yellow Lightning Bolt on the building
        const drawBolt = (x: number, y: number, scale: number) => {
            p.rect(x + 5*scale, y + 1*scale, 2*scale, 2*scale); p.fill(0xFFCC00);
            p.rect(x + 4*scale, y + 3*scale, 2*scale, 2*scale); p.fill(0xFFCC00);
            p.rect(x + 3*scale, y + 5*scale, 2*scale, 2*scale); p.fill(0xFFCC00);
            p.rect(x + 1*scale, y + 7*scale, 7*scale, 2*scale); p.fill(0xFFCC00);
            p.rect(x + 4*scale, y + 9*scale, 2*scale, 2*scale); p.fill(0xFFCC00);
            p.rect(x + 3*scale, y + 11*scale, 2*scale, 2*scale); p.fill(0xFFCC00);
        };
        drawBolt(12, 32, 2.5);
        this.buildingTextures['powerplant'] = app.renderer.generateTexture(p);

        // Hospital 3x3
        const h = new Graphics();
        h.rect(0, 0, 96, 96); h.fill(0xAA4433); // Mars sand base
        
        // Green healing gardens in the four corners
        h.rect(4, 4, 32, 32); h.fill(0x228822); // Top left
        h.rect(60, 4, 32, 32); h.fill(0x228822); // Top right
        h.rect(4, 60, 32, 32); h.fill(0x228822); // Bottom left
        h.rect(60, 60, 32, 32); h.fill(0x228822); // Bottom right
        // Trees in gardens
        h.circle(20, 20, 6); h.fill(0x00FF00);
        h.circle(76, 20, 6); h.fill(0x00FF00);
        h.circle(20, 76, 6); h.fill(0x00FF00);
        h.circle(76, 76, 6); h.fill(0x00FF00);

        // Cross shaped building
        h.rect(32, 8, 32, 80); h.fill(0xDDDDDD);
        h.rect(8, 32, 80, 32); h.fill(0xDDDDDD);
        // Roof red cross on the center
        h.rect(44, 32, 8, 32); h.fill(0xCC0000);
        h.rect(32, 44, 32, 8); h.fill(0xCC0000);
        
        // Helipads on the building ends
        h.circle(48, 16, 8); h.fill(0x666666); h.circle(48, 16, 4); h.fill(0x999999);
        h.circle(48, 80, 8); h.fill(0x666666); h.circle(48, 80, 4); h.fill(0x999999);
        
        // Ambulance Drones
        const drawAmbulance = (x: number, y: number) => {
            h.rect(x-4, y-4, 8, 8); h.fill(0xFFFFFF); // white body
            h.rect(x-1, y-3, 2, 6); h.fill(0xCC0000); // red cross
            h.rect(x-3, y-1, 6, 2); h.fill(0xCC0000); 
            h.rect(x-5, y-2, 2, 4); h.fill(0x333333); // thrusters
            h.rect(x+3, y-2, 2, 4); h.fill(0x333333);
        };
        drawAmbulance(48, 16); // parked top
        drawAmbulance(48, 80); // parked bottom
        drawAmbulance(76, 48); // hovering over right wing
        this.buildingTextures['hospital'] = app.renderer.generateTexture(h);

        // PoliceStation 3x3
        const po = new Graphics();
        po.rect(0, 0, 96, 96); po.fill(0x333333); // Yard
        // U-Shaped Fortress Building
        po.rect(8, 8, 24, 80); po.fill(0x2244AA); // Left wing
        po.rect(64, 8, 24, 80); po.fill(0x2244AA); // Right wing
        po.rect(32, 8, 32, 24); po.fill(0x113388); // Connecting back block
        
        // Central courtyard / landing zone
        po.rect(32, 32, 32, 56); po.fill(0x222222); 
        
        // Large Police Shield in the courtyard
        po.rect(40, 48, 16, 16); po.fill(0x0088FF); // Shield base
        po.rect(42, 64, 12, 4); po.fill(0x0088FF);  // Shield taper
        po.rect(44, 68, 8, 4); po.fill(0x0088FF);   // Shield point
        
        // Gold star in the center
        po.rect(46, 52, 4, 8); po.fill(0xFFDD00);
        po.rect(44, 54, 8, 4); po.fill(0xFFDD00);
        
        // Roof details on wings
        po.rect(12, 12, 16, 16); po.fill(0x555555);
        po.rect(68, 12, 16, 16); po.fill(0x555555);
        
        // Police Patrol Drones
        const pd = (dx: number, dy: number) => {
            po.rect(dx, dy, 8, 8); po.fill(0x111111); // Drone body
            po.rect(dx+1, dy-2, 2, 2); po.fill(0xFF0000); // Red light
            po.rect(dx+5, dy-2, 2, 2); po.fill(0x0000FF); // Blue light
            po.rect(dx-2, dy+2, 2, 4); po.fill(0x555555); // wings
            po.rect(dx+8, dy+2, 2, 4); po.fill(0x555555);
        };
        pd(36, 40); // Courtyard parked
        pd(52, 40); // Courtyard parked
        pd(16, 76); // Hovering over wing
        pd(72, 76); // Hovering over wing
        this.buildingTextures['policestation'] = app.renderer.generateTexture(po);

        // MaintenanceDepot 3x3
        const ma = new Graphics();
        ma.rect(0, 0, 96, 96); ma.fill(0x333333); // yard
        ma.rect(8, 8, 40, 80); ma.fill(0x555555); // garage building
        ma.rect(16, 16, 24, 16); ma.fill(0x222222); // open bay 1
        ma.rect(16, 40, 24, 16); ma.fill(0x222222); // open bay 2
        ma.rect(16, 64, 24, 16); ma.fill(0x222222); // open bay 3
        
        // Wrench icon on roof
        ma.rect(60, 24, 24, 4); ma.fill(0xAAAAAA);
        ma.rect(56, 20, 8, 4); ma.fill(0xAAAAAA);
        ma.rect(56, 28, 8, 4); ma.fill(0xAAAAAA);
        
        // Repair drones in the yard
        const rd = (dx: number, dy: number) => {
            ma.rect(dx, dy, 8, 8); ma.fill(0xFF8800); // Orange body
            ma.rect(dx+2, dy+2, 4, 4); ma.fill(0x000000);
            ma.rect(dx-2, dy+2, 12, 4); ma.fill(0x888888); // Arms/Tracks
        };
        rd(64, 48);
        rd(76, 64);
        rd(56, 76);
        
        // Pipes / junk in yard
        ma.rect(56, 8, 32, 4); ma.fill(0x777777);
        ma.rect(84, 8, 4, 24); ma.fill(0x777777);
        
        this.buildingTextures['maintenancedepot'] = app.renderer.generateTexture(ma);

        // Launchpad 3x3
        const lp = new Graphics();
        lp.rect(0, 0, 96, 96); lp.fill(0x222222); // dark concrete pad
        
        // Big place shuttle launch (Right side)
        lp.rect(48, 16, 40, 64); lp.fill(0x444444); // launch platform
        lp.rect(60, 20, 16, 40); lp.fill(0xDDDDDD); // Shuttle body
        lp.rect(56, 40, 24, 16); lp.fill(0xDDDDDD); // Shuttle wings
        lp.rect(64, 60, 8, 16); lp.fill(0xFF4400); // Booster flame engines
        lp.rect(52, 16, 4, 64); lp.fill(0x883311); // Launch tower
        lp.rect(48, 24, 8, 4); lp.fill(0x777777); // tower arms
        lp.rect(48, 44, 8, 4); lp.fill(0x777777);
        
        // Grid of drones (Left side)
        lp.rect(8, 16, 32, 64); lp.fill(0x333333); // drone yard
        for(let dy=20; dy<70; dy+=12) {
            for(let dx=12; dx<36; dx+=12) {
                lp.rect(dx, dy, 6, 6); lp.fill(0x00FFFF); // drone body
                lp.rect(dx+2, dy+2, 2, 2); lp.fill(0x000000); // drone center
            }
        }
        this.buildingTextures['launchpad'] = app.renderer.generateTexture(lp);

        // DroneStation 1x1
        const ds = new Graphics();
        ds.rect(0, 0, 32, 32); ds.fill(0x333333); // pad
        ds.circle(16, 16, 10); ds.fill(0x222222); // landing zone
        ds.rect(14, 14, 4, 4); ds.fill(0x00FFFF); // Drone
        ds.rect(12, 12, 2, 2); ds.fill(0x555555); // rotor
        ds.rect(18, 18, 2, 2); ds.fill(0x555555); // rotor
        ds.rect(12, 18, 2, 2); ds.fill(0x555555); // rotor
        ds.rect(18, 12, 2, 2); ds.fill(0x555555); // rotor
        ds.rect(2, 2, 6, 6); ds.fill(0x555555); // control box
        this.buildingTextures['dronestation'] = app.renderer.generateTexture(ds);

        // LandingBase 3x3 (Starting Colony Base)
        const lb = new Graphics();
        lb.rect(0, 0, 96, 96); lb.fill(0x333333); // Metal foundation
        
        // Central Command Dome (Residential-like)
        lb.circle(48, 48, 24); lb.fill(0x99DDFF); // Glass dome
        lb.circle(48, 48, 20); lb.fill(0x228822); // Greenery inside
        lb.rect(44, 44, 8, 8); lb.fill(0xFFFFFF); // Center hab
        
        // Industrial processing wings (Industrial-like)
        lb.rect(8, 36, 16, 24); lb.fill(0xFFFF55); // Yellow tanks
        lb.rect(72, 36, 16, 24); lb.fill(0xFFFF55); // Yellow tanks
        lb.circle(16, 48, 6); lb.fill(0x222222); 
        lb.circle(80, 48, 6); lb.fill(0x222222);
        
        // Solar panels for starting power
        lb.rect(24, 8, 48, 12); lb.fill(0x0055AA);
        lb.rect(24, 76, 48, 12); lb.fill(0x0055AA);
        
        // Connection pipes
        lb.rect(46, 20, 4, 28); lb.fill(0x888888);
        lb.rect(46, 48, 4, 28); lb.fill(0x888888);
        lb.rect(24, 46, 24, 4); lb.fill(0x888888);
        lb.rect(48, 46, 24, 4); lb.fill(0x888888);

        this.buildingTextures['landingbase'] = app.renderer.generateTexture(lb);
    }

    private static generateResidentialAssets(app: Application) {
        const type = 'res';
        const color = 0x33CC33;
        // house
        const h = new Graphics();
        h.rect(0, 0, 32, 32); h.fill(0xAA4433);
        h.circle(16, 16, 12); h.fill(0xDDDDDD); // Capsule
        h.circle(16, 16, 8); h.fill(0x99DDFF); // Glass
        h.circle(24, 24, 4); h.fill(0x00FF00); // Tree
        h.circle(8, 24, 3); h.fill(0x00FF00); // Tree
        this.buildingTextures[`house_${type}`] = app.renderer.generateTexture(h);
        
        // med_0 (Multi-capsule)
        const m1 = new Graphics();
        m1.rect(0, 0, 64, 64); m1.fill(0xAA4433);
        m1.circle(32, 32, 24); m1.fill(0xDDDDDD); m1.circle(32, 32, 16); m1.fill(0x99DDFF);
        m1.circle(16, 16, 12); m1.fill(0xDDDDDD); m1.circle(16, 16, 8); m1.fill(0x99DDFF);
        m1.circle(48, 48, 12); m1.fill(0xDDDDDD); m1.circle(48, 48, 8); m1.fill(0x99DDFF);
        m1.circle(16, 48, 12); m1.fill(0xDDDDDD); m1.circle(16, 48, 8); m1.fill(0x99DDFF);
        for(let i=0; i<6; i++) { m1.circle(10 + Math.random()*44, 10 + Math.random()*44, 4); m1.fill(0x00FF00); }
        this.buildingTextures[`med_${type}_0`] = app.renderer.generateTexture(m1);

        // med_1 (Biodome with trees and houses)
        const m2 = new Graphics();
        m2.rect(0, 0, 64, 64); m2.fill(0xAA4433);
        m2.circle(32, 32, 30); m2.fill(0x99DDFF); // Glass dome base
        m2.circle(32, 32, 28); m2.fill(0x228822); // inner forest
        for(let i=0; i<15; i++) { m2.circle(16 + Math.random()*32, 16 + Math.random()*32, 3); m2.fill(0x00FF00); }
        m2.rect(20, 30, 8, 8); m2.fill(0xFFFFFF); // inner houses
        m2.rect(36, 20, 8, 8); m2.fill(0xFFFFFF);
        m2.rect(32, 40, 8, 8); m2.fill(0xFFFFFF);
        m2.circle(24, 24, 6); m2.fill({color:0xFFFFFF, alpha:0.5}); // glass shine overlay
        this.buildingTextures[`med_${type}_1`] = app.renderer.generateTexture(m2);

        // arcology_0 (Mega-Habitat Dome)
        const b1 = new Graphics();
        b1.rect(0, 0, 96, 96); b1.fill(0xAA4433);
        b1.circle(48, 48, 44); b1.fill(0x444444); // outer ring
        b1.circle(48, 48, 40); b1.fill(0x99DDFF); // Huge dome
        b1.circle(48, 48, 36); b1.fill(0x22AA22); // Terraces
        b1.circle(48, 48, 28); b1.fill(0xDDDDDD);
        b1.circle(48, 48, 24); b1.fill(0x33CC33);
        b1.circle(48, 48, 16); b1.fill(0xDDDDDD);
        b1.circle(48, 48, 12); b1.fill(0x00FF00);
        this.buildingTextures[`arcology_${type}_0`] = app.renderer.generateTexture(b1);

        // arcology_1 (Modular Hanging Gardens)
        const b2 = new Graphics();
        b2.rect(0, 0, 96, 96); b2.fill(0xAA4433);
        b2.rect(4, 4, 88, 88); b2.fill(0x444444);
        const tw = (x:number, y:number) => {
            b2.rect(x, y, 24, 24); b2.fill(0xDDDDDD);
            b2.rect(x+4, y+4, 16, 16); b2.fill(0x22AA22); // hanging garden
            b2.rect(x+8, y+8, 8, 8); b2.fill(0x99DDFF); // glass core
        };
        tw(8, 8); tw(64, 8); tw(8, 64); tw(64, 64);
        b2.rect(32, 16, 32, 8); b2.fill(0x22AA22); // Connectors
        b2.rect(32, 72, 32, 8); b2.fill(0x22AA22);
        b2.rect(16, 32, 8, 32); b2.fill(0x22AA22);
        b2.rect(72, 32, 8, 32); b2.fill(0x22AA22);
        b2.rect(32, 32, 32, 32); b2.fill(0xDDDDDD); // Center hub
        b2.circle(48, 48, 12); b2.fill(0x99DDFF);
        this.buildingTextures[`arcology_${type}_1`] = app.renderer.generateTexture(b2);

        this.generateEmptyZone(app, type, color);
    }

    private static generateCommercialAssets(app: Application) {
        const type = 'com';
        const color = 0x5555FF;
        // house (Small Shop)
        const h = new Graphics();
        h.rect(0, 0, 32, 32); h.fill(0xAA4433);
        h.rect(4, 4, 24, 24); h.fill(0x444444);
        h.rect(8, 8, 16, 16); h.fill(0x5555FF);
        h.rect(8, 20, 16, 4); h.fill(0xFF00FF); // Neon sign magenta
        h.rect(12, 8, 8, 4); h.fill(0x00FFFF); // Neon sign cyan
        this.buildingTextures[`house_${type}`] = app.renderer.generateTexture(h);
        
        // med_0 (Corporate Office)
        const m1 = new Graphics();
        m1.rect(0, 0, 64, 64); m1.fill(0xAA4433);
        m1.rect(8, 8, 48, 48); m1.fill(0x333333);
        m1.rect(12, 12, 40, 40); m1.fill(0x5555FF);
        for(let x=16; x<50; x+=8) { m1.rect(x, 12, 4, 40); m1.fill(0x99DDFF); } // Vertical window slits
        this.buildingTextures[`med_${type}_0`] = app.renderer.generateTexture(m1);

        // med_1 (Shopping Mall)
        const m2 = new Graphics();
        m2.rect(0, 0, 64, 64); m2.fill(0xAA4433);
        m2.rect(4, 4, 56, 56); m2.fill(0x444444);
        m2.rect(8, 8, 48, 48); m2.fill(0x222222);
        m2.rect(12, 12, 16, 8); m2.fill(0xFF00FF); // Neon signs on the roof
        m2.rect(36, 12, 16, 16); m2.fill(0x00FFFF);
        m2.rect(12, 44, 24, 8); m2.fill(0xFFFF00);
        m2.circle(44, 44, 10); m2.fill(0xFF0000);
        m2.rect(24, 24, 16, 16); m2.fill(0x99DDFF); // Glass atrium
        this.buildingTextures[`med_${type}_1`] = app.renderer.generateTexture(m2);

        // arcology_0 (Mega-Mall)
        const b1 = new Graphics();
        b1.rect(0, 0, 96, 96); b1.fill(0xAA4433);
        b1.rect(4, 4, 88, 88); b1.fill(0x333333); // Base
        b1.rect(12, 12, 72, 72); b1.fill(0x222222);
        b1.rect(16, 16, 24, 12); b1.fill(0xFF00FF); // Holographic Billboards
        b1.rect(56, 16, 24, 32); b1.fill(0x00FFFF);
        b1.rect(16, 68, 48, 12); b1.fill(0xFFFF00);
        b1.circle(72, 72, 12); b1.fill(0xFF0000);
        b1.rect(16, 40, 32, 16); b1.fill(0x99DDFF); // Glass walkways
        b1.rect(40, 16, 16, 64); b1.fill(0x99DDFF);
        this.buildingTextures[`arcology_${type}_0`] = app.renderer.generateTexture(b1);

        // arcology_1 (Financial Tower)
        const b2 = new Graphics();
        b2.rect(0, 0, 96, 96); b2.fill(0xAA4433);
        b2.rect(16, 16, 64, 64); b2.fill(0x5555FF);
        b2.rect(32, 8, 32, 80); b2.fill(0x333333); // Hexagonal or cross tower
        b2.rect(8, 32, 80, 32); b2.fill(0x333333);
        b2.rect(36, 12, 24, 72); b2.fill(0x99DDFF); // Blue glass
        b2.rect(12, 36, 72, 24); b2.fill(0x99DDFF);
        b2.circle(48, 48, 16); b2.fill(0xFF00FF); // Core neon
        b2.circle(48, 48, 8); b2.fill(0x00FFFF);
        this.buildingTextures[`arcology_${type}_1`] = app.renderer.generateTexture(b2);

        this.generateEmptyZone(app, type, color);
    }

    private static generateIndustrialAssets(app: Application) {
        const type = 'ind';
        const color = 0xFFFF55;
        // house (Extractor/Tank)
        const h = new Graphics();
        h.rect(0, 0, 32, 32); h.fill(0xAA4433);
        h.rect(4, 4, 24, 24); h.fill(0x555555); // concrete pad
        h.circle(16, 16, 8); h.fill(0xFFFF55); // Yellow tank
        h.rect(14, 4, 4, 12); h.fill(0x888888); // Pipe
        h.rect(20, 20, 6, 6); h.fill(0x333333); // Small pump
        this.buildingTextures[`house_${type}`] = app.renderer.generateTexture(h);
        
        // med_0 (Heavy Plant)
        const m1 = new Graphics();
        m1.rect(0, 0, 64, 64); m1.fill(0xAA4433);
        m1.rect(4, 4, 56, 56); m1.fill(0x444444);
        m1.rect(8, 8, 16, 8); m1.fill(0xCC0000); // Containers
        m1.rect(8, 20, 16, 8); m1.fill(0x0044CC);
        m1.rect(28, 8, 28, 48); m1.fill(0x555555); // Main factory
        m1.rect(28, 8, 28, 4); m1.fill(0xFFFF00); // Hazard stripes
        m1.rect(28, 52, 28, 4); m1.fill(0xFFFF00);
        m1.circle(42, 24, 6); m1.fill(0x222222); // Smokestacks
        m1.circle(42, 40, 6); m1.fill(0x222222);
        this.buildingTextures[`med_${type}_0`] = app.renderer.generateTexture(m1);

        // med_1 (Hydroponics Farm)
        const m2 = new Graphics();
        m2.rect(0, 0, 64, 64); m2.fill(0xAA4433);
        m2.rect(4, 4, 56, 56); m2.fill(0x444444); // pad
        m2.rect(8, 8, 32, 48); m2.fill(0x99DDFF); // Greenhouse glass
        for(let y=12; y<52; y+=8) { m2.rect(12, y, 24, 4); m2.fill(0x00FF00); } // Green crops inside
        m2.circle(52, 32, 8); m2.fill(0xFFFF55); // Yellow Water Tank
        m2.rect(40, 30, 12, 4); m2.fill(0x888888); // pipe
        this.buildingTextures[`med_${type}_1`] = app.renderer.generateTexture(m2);

        // arcology_0 (Mega-Factory)
        const b1 = new Graphics();
        b1.rect(0, 0, 96, 96); b1.fill(0xAA4433);
        b1.rect(4, 4, 88, 88); b1.fill(0x333333); 
        b1.rect(24, 24, 48, 48); b1.fill(0x444444); // Huge central smelter
        b1.circle(48, 48, 20); b1.fill(0x222222);
        b1.circle(48, 48, 12); b1.fill(0xFF4400); // molten core
        b1.rect(44, 4, 8, 20); b1.fill(0x666666); // Massive pipes
        b1.rect(44, 72, 8, 20); b1.fill(0x666666);
        b1.rect(4, 44, 20, 8); b1.fill(0x666666);
        b1.rect(72, 44, 20, 8); b1.fill(0x666666);
        b1.rect(8, 8, 12, 24); b1.fill(0xAA0000); // Container Yard
        b1.rect(76, 64, 12, 24); b1.fill(0x0055AA);
        this.buildingTextures[`arcology_${type}_0`] = app.renderer.generateTexture(b1);

        // arcology_1 (Mega-Hydroponics)
        const b2 = new Graphics();
        b2.rect(0, 0, 96, 96); b2.fill(0xAA4433);
        b2.rect(4, 4, 88, 88); b2.fill(0x222222); // Base
        b2.rect(8, 8, 80, 80); b2.fill(0x99DDFF); // Full glass roof
        for(let x=12; x<84; x+=8) { b2.rect(x, 12, 4, 72); b2.fill(0x00FF00); } // Dense crop rows
        b2.rect(32, 40, 32, 16); b2.fill(0xDDDDDD); // Central distribution hub
        b2.circle(48, 48, 6); b2.fill(0xFFFF55);
        this.buildingTextures[`arcology_${type}_1`] = app.renderer.generateTexture(b2);

        this.generateEmptyZone(app, type, color);
    }

    private static generateEmptyZone(app: Application, type: string, color: number) {
        const d = new Graphics();
        d.rect(0, 0, 96, 96); d.fill(0xAA4433);
        for(let x=0; x<3; x++) {
            for(let y=0; y<3; y++) {
                d.rect(x*32 + 2, y*32 + 2, 28, 28);
                d.fill(0x993322); // Paved red sand grid
            }
        }
        d.rect(0, 0, 96, 96);
        d.stroke({color: color, width: 4}); // Zone color border
        this.buildingTextures[`empty_${type}`] = app.renderer.generateTexture(d);
    }
}
