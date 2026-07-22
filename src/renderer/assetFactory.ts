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
        this.generateRoads(app, 0x00E5FF, this.roadTexturesCyan);
        this.generateRoads(app, 0xFFDD00, this.roadTexturesYellow);
        this.generateRoads(app, 0xFF3333, this.roadTexturesRed);
        this.generatePowerLines(app);
        this.generateBuildings(app);
    }

    // Helper: Draw Yellow High-Voltage Lightning Bolt Power Sign
    private static drawLightningBolt(g: Graphics, bx: number, by: number, scale: number = 1) {
        const color = 0xFFDD00;
        const shadow = 0x553300;
        const s = scale;
        
        const draw = (ox: number, oy: number, c: number) => {
            g.rect(ox + 4*s, oy, 3*s, 3*s); g.fill(c);
            g.rect(ox + 3*s, oy + 3*s, 3*s, 3*s); g.fill(c);
            g.rect(ox + 2*s, oy + 6*s, 3*s, 3*s); g.fill(c);
            g.rect(ox, oy + 8*s, 9*s, 2.5*s); g.fill(c);
            g.rect(ox + 3*s, oy + 10.5*s, 3*s, 3*s); g.fill(c);
            g.rect(ox + 2*s, oy + 13.5*s, 3*s, 3*s); g.fill(c);
            g.rect(ox + 1*s, oy + 16.5*s, 2*s, 4*s); g.fill(c);
        };
        
        draw(bx + 1, by + 1, shadow);
        draw(bx, by, color);
    }

    // Helper: Draw Mars Sand Base with ONE General Outer Perimeter Border in the Zone Color
    private static drawZoneBorder(
        g: Graphics,
        w: number, h: number,
        borderColor: number,
        borderWidth: number = 4
    ) {
        g.rect(0, 0, w, h);
        g.fill(0xC2461A);
        for (let i = 0; i < 20; i++) {
            const rx = (i * 17) % (w - 2);
            const ry = (i * 23) % (h - 2);
            g.rect(rx, ry, 2, 1);
            g.fill(i % 2 === 0 ? 0xD55627 : 0x9E300B);
        }

        g.rect(0, 0, w, h);
        g.stroke({ color: borderColor, width: borderWidth });

        g.rect(borderWidth, borderWidth, w - borderWidth * 2, h - borderWidth * 2);
        g.stroke({ color: 0x101215, width: 1, alpha: 0.4 });

        const drawCorner = (cx: number, cy: number) => {
            g.rect(cx, cy, 7, 7); g.fill(borderColor);
            g.rect(cx + 2, cy + 2, 3, 3); g.fill(0x101215);
        };
        drawCorner(0, 0);
        drawCorner(w - 7, 0);
        drawCorner(0, h - 7);
        drawCorner(w - 7, h - 7);
    }

    // Helper: 3D Extruded Building Block with Roof, Sun-facing Front Wall, and Shaded Side Wall
    private static draw3DBlock(
        g: Graphics, 
        x: number, y: number, 
        w: number, h: number, 
        wallH: number = 6, 
        roofColor: number = 0xDDDDDD, 
        frontWallColor: number = 0x999999, 
        sideWallColor: number = 0x666666
    ) {
        // Drop shadow onto ground
        g.rect(x + wallH, y + wallH, w, h + wallH);
        g.fill({ color: 0x300A02, alpha: 0.45 });

        // Front Wall (south facing facade)
        g.rect(x, y + h, w, wallH);
        g.fill(frontWallColor);

        // Right Wall (east facing facade)
        g.poly([x + w, y, x + w + wallH, y + wallH, x + w + wallH, y + h + wallH, x + w, y + h]);
        g.fill(sideWallColor);

        // Roof Top
        g.rect(x, y, w, h);
        g.fill(roofColor);
        
        // Roof Edge Highlight
        g.rect(x, y, w, 1); g.fill({ color: 0xFFFFFF, alpha: 0.35 });
        g.rect(x, y, 1, h); g.fill({ color: 0xFFFFFF, alpha: 0.35 });
    }

    // Helper: Rooftop AC Unit / HVAC Detail
    private static drawRooftopAC(g: Graphics, x: number, y: number) {
        g.rect(x+1, y+1, 8, 6); g.fill({ color: 0x101215, alpha: 0.4 });
        g.rect(x, y, 8, 6); g.fill(0x7E8896);
        g.rect(x+1, y+1, 6, 4); g.fill(0x4D535E);
        g.circle(x+4, y+3, 1.5); g.fill(0x1C1F24);
    }

    // Helper: Rooftop Satellite Dish Detail
    private static drawRooftopSatellite(g: Graphics, cx: number, cy: number) {
        g.ellipse(cx+1, cy+1, 5, 4); g.fill({ color: 0x101215, alpha: 0.4 });
        g.ellipse(cx, cy, 5, 4); g.fill(0xD1D8E0);
        g.ellipse(cx, cy, 3, 2); g.fill(0x9EABBA);
        g.rect(cx-1, cy-3, 2, 3); g.fill(0x4D535E);
        g.rect(cx-1, cy-4, 2, 1); g.fill(0xFF0000);
    }

    // Helper: 3D Volumetric Spherical Glass Dome
    private static draw3DDome(
        g: Graphics, 
        cx: number, cy: number, 
        r: number, 
        baseColor: number = 0x1E7B1E,
        wallH: number = 5
    ) {
        // Drop Shadow cast to bottom-right
        g.ellipse(cx + wallH, cy + wallH, r, r * 0.85);
        g.fill({ color: 0x300A02, alpha: 0.45 });

        // 3D Metal Foundation Collar Wall
        g.ellipse(cx, cy + wallH/2, r + 1, r * 0.85 + wallH/2);
        g.fill(0x22262C);
        g.ellipse(cx, cy + wallH/2, r, r * 0.85 + wallH/2);
        g.fill(0x4D535E);

        // Biosphere Floor
        g.circle(cx, cy, r);
        g.fill(baseColor);
        g.circle(cx, cy, r);
        g.stroke({ color: 0x124D12, width: 1.5 });
    }

    private static draw3DDomeGlassOverlay(g: Graphics, cx: number, cy: number, r: number) {
        g.circle(cx + 2, cy + 2, r);
        g.fill({ color: 0x1A3B5C, alpha: 0.2 });

        g.circle(cx, cy, r);
        g.fill({ color: 0x88CCFF, alpha: 0.35 });

        g.circle(cx - r*0.35, cy - r*0.35, Math.max(2, r * 0.22));
        g.fill({ color: 0xFFFFFF, alpha: 0.75 });
        g.circle(cx - r*0.2, cy - r*0.4, Math.max(1, r * 0.1));
        g.fill({ color: 0xFFFFFF, alpha: 0.9 });
    }

    // Helper: Dedicated Drone Landing Pad with Parked Drone
    private static drawDronePad(
        g: Graphics, 
        cx: number, cy: number, 
        padType: 'ambulance' | 'police' | 'cargo'
    ) {
        g.circle(cx + 2, cy + 2, 11); g.fill({ color: 0x300A02, alpha: 0.45 });
        g.circle(cx, cy, 11); g.fill(0x4D535E);
        g.circle(cx, cy, 9); g.fill(0x1C1F24);

        const rimColor = padType === 'police' ? 0x0077FF : (padType === 'ambulance' ? 0xCC1111 : 0xFFDD00);
        g.circle(cx, cy, 8); g.stroke({ color: rimColor, width: 1.5 });

        if (padType === 'ambulance') {
            g.rect(cx - 1, cy - 5, 2, 10); g.fill(0xCC1111);
            g.rect(cx - 5, cy - 1, 10, 2); g.fill(0xCC1111);
            
            g.rect(cx-3, cy-3, 6, 6); g.fill(0xFFFFFF);
            g.rect(cx-1, cy-3, 2, 6); g.fill(0xCC1111);
            g.rect(cx-3, cy-1, 6, 2); g.fill(0xCC1111);
            g.rect(cx-5, cy-5, 2, 2); g.fill(0xFF0000); g.rect(cx+3, cy-5, 2, 2); g.fill(0xFF0000);
            g.rect(cx-5, cy+3, 2, 2); g.fill(0xFF0000); g.rect(cx+3, cy+3, 2, 2); g.fill(0xFF0000);
        } else if (padType === 'police') {
            g.rect(cx - 3, cy - 4, 6, 8); g.fill(0x1B3880);
            g.rect(cx - 2, cy - 2, 4, 4); g.fill(0xFFDD00);
            
            g.rect(cx-3, cy-3, 6, 6); g.fill(0x1B3880);
            g.rect(cx-1, cy-1, 2, 2); g.fill(0xFFDD00);
            g.rect(cx-5, cy-5, 2, 2); g.fill(0xFF0000); g.rect(cx+3, cy-5, 2, 2); g.fill(0x0000FF);
            g.rect(cx-5, cy+3, 2, 2); g.fill(0xFF0000); g.rect(cx+3, cy+3, 2, 2); g.fill(0x0000FF);
        } else {
            g.rect(cx - 4, cy - 4, 2, 8); g.fill(0xFFFFFF);
            g.rect(cx + 2, cy - 4, 2, 8); g.fill(0xFFFFFF);
            g.rect(cx - 2, cy - 1, 4, 2); g.fill(0xFFFFFF);
        }
    }

    private static drawRetroLetter(g: Graphics, x: number, y: number, char: 'R' | 'C' | 'I', fillColor: number, shadowColor: number = 0x000000, scale: number = 1) {
        const draw = (ox: number, oy: number, color: number) => {
            const s = scale;
            if (char === 'R') {
                g.rect(ox, oy, 3 * s, 12 * s); g.fill(color);
                g.rect(ox + 3 * s, oy, 5 * s, 3 * s); g.fill(color);
                g.rect(ox + 6 * s, oy + 2 * s, 3 * s, 4 * s); g.fill(color);
                g.rect(ox + 3 * s, oy + 5 * s, 5 * s, 3 * s); g.fill(color);
                g.rect(ox + 4 * s, oy + 7 * s, 3 * s, 2 * s); g.fill(color);
                g.rect(ox + 6 * s, oy + 9 * s, 3 * s, 3 * s); g.fill(color);
            } else if (char === 'C') {
                g.rect(ox + 2 * s, oy, 7 * s, 3 * s); g.fill(color);
                g.rect(ox, oy + 2 * s, 3 * s, 8 * s); g.fill(color);
                g.rect(ox + 2 * s, oy + 9 * s, 7 * s, 3 * s); g.fill(color);
            } else if (char === 'I') {
                g.rect(ox, oy, 9 * s, 3 * s); g.fill(color);
                g.rect(ox + 3 * s, oy + 3 * s, 3 * s, 6 * s); g.fill(color);
                g.rect(ox, oy + 9 * s, 9 * s, 3 * s); g.fill(color);
            }
        };
        draw(x + 1 * scale, y + 1 * scale, shadowColor);
        draw(x, y, fillColor);
    }

    private static generateTerrain(app: Application) {
        // RedSand
        let g = new Graphics();
        g.rect(0, 0, 32, 32); g.fill(0xC2461A);
        for (let i = 0; i < 24; i++) {
            const rx = (i * 7) % 31;
            const ry = (i * 13) % 31;
            g.rect(rx, ry, 2, 1);
            g.fill(i % 2 === 0 ? 0xD55627 : 0x9E300B);
        }
        g.rect(5, 8, 1, 1); g.fill(0xE77F4F);
        g.rect(22, 14, 1, 1); g.fill(0xE77F4F);
        g.rect(14, 25, 1, 1); g.fill(0xE77F4F);
        g.rect(27, 3, 1, 1); g.fill(0x6E1E05);
        this.terrainTextures['redsand'] = app.renderer.generateTexture(g);

        // Rock / Ridge
        g = new Graphics();
        g.rect(0, 0, 32, 32); g.fill(0xC2461A);
        g.rect(4, 4, 24, 24); g.fill(0x521606);
        g.rect(4, 4, 22, 22); g.fill(0x7D250C);
        g.rect(4, 4, 18, 18); g.fill(0xA03814);
        g.rect(4, 4, 14, 14); g.fill(0xC2461A);
        g.rect(4, 4, 24, 2); g.fill(0xE87D4F);
        g.rect(4, 4, 2, 24); g.fill(0xE87D4F);
        g.rect(12, 14, 2, 8); g.fill(0x401004);
        this.terrainTextures['rock'] = app.renderer.generateTexture(g);

        // Crater
        g = new Graphics();
        g.rect(0, 0, 32, 32); g.fill(0xC2461A);
        g.circle(16, 16, 14); g.fill(0x4A1305);
        g.circle(15, 15, 13); g.fill(0xE87B4A);
        g.circle(16, 16, 11); g.fill(0x3B0E04);
        g.circle(17, 17, 8); g.fill(0x270802);
        g.circle(16, 16, 3); g.fill(0x8C2A0A);
        g.circle(15, 15, 1); g.fill(0xD55627);
        this.terrainTextures['crater'] = app.renderer.generateTexture(g);

        // Ice
        g = new Graphics();
        g.rect(0, 0, 32, 32); g.fill(0xC2461A);
        g.rect(4, 4, 24, 24); g.fill(0x6AB4CE);
        g.rect(6, 6, 20, 20); g.fill(0x8ED9EE);
        g.rect(8, 8, 16, 16); g.fill(0xC8F4FF);
        g.rect(10, 12, 12, 2); g.fill(0xFFFFFF);
        g.rect(14, 8, 2, 10); g.fill(0xFFFFFF);
        this.terrainTextures['ice'] = app.renderer.generateTexture(g);

        // Iron
        g = new Graphics();
        g.rect(0, 0, 32, 32); g.fill(0xC2461A);
        g.rect(4, 4, 24, 24); g.fill(0x562316);
        g.rect(6, 6, 20, 20); g.fill(0x7A3320);
        for(let i=0; i<8; i++) {
            g.rect(6 + (i*5)%18, 6 + (i*7)%18, 3, 3);
            g.fill(i%2 === 0 ? 0xD86B32 : 0xFFAA44);
        }
        this.terrainTextures['iron'] = app.renderer.generateTexture(g);
    }

    private static generateRoads(app: Application, glowColor: number, targetArray: Texture[]) {
        for (let i = 0; i < 16; i++) {
            const g = new Graphics();
            g.rect(0, 0, 32, 32); g.fill(0xC2461A);

            // Pipe Drop Shadow on Sand
            g.rect(8, 10, 16, 16); g.fill(0x300A02);
            if (i & 1) { g.rect(8, 0, 16, 10); g.fill(0x300A02); }
            if (i & 2) { g.rect(20, 8, 12, 16); g.fill(0x300A02); }
            if (i & 4) { g.rect(8, 20, 16, 12); g.fill(0x300A02); }
            if (i & 8) { g.rect(0, 8, 12, 16); g.fill(0x300A02); }

            // Pipe Base
            g.rect(10, 10, 12, 12); g.fill(0x353A42);
            if (i & 1) { g.rect(10, 0, 12, 10); g.fill(0x353A42); }
            if (i & 2) { g.rect(20, 10, 12, 12); g.fill(0x353A42); }
            if (i & 4) { g.rect(10, 20, 12, 10); g.fill(0x353A42); }
            if (i & 8) { g.rect(0, 10, 10, 12); g.fill(0x353A42); }

            // Mid Metal Body
            g.rect(11, 11, 10, 10); g.fill(0x616A75);
            if (i & 1) { g.rect(11, 0, 10, 11); g.fill(0x616A75); }
            if (i & 2) { g.rect(20, 11, 12, 10); g.fill(0x616A75); }
            if (i & 4) { g.rect(11, 20, 10, 12); g.fill(0x616A75); }
            if (i & 8) { g.rect(0, 11, 11, 10); g.fill(0x616A75); }

            // Specular Top Highlight
            g.rect(12, 12, 8, 4); g.fill(0xD1D8E0);
            if (i & 1) { g.rect(13, 0, 6, 12); g.fill(0xD1D8E0); }
            if (i & 2) { g.rect(20, 13, 12, 6); g.fill(0xD1D8E0); }
            if (i & 4) { g.rect(13, 20, 6, 12); g.fill(0xD1D8E0); }
            if (i & 8) { g.rect(0, 13, 12, 6); g.fill(0xD1D8E0); }

            // Status Light
            g.rect(14, 14, 4, 4); g.fill(glowColor);
            g.rect(15, 15, 2, 2); g.fill(0xFFFFFF);

            // Metal Coupling Flanges
            const drawFlangeV = (fy: number) => {
                g.rect(8, fy, 16, 3); g.fill(0x22262C);
                g.rect(9, fy + 1, 14, 1); g.fill(0xABC0D0);
            };
            const drawFlangeH = (fx: number) => {
                g.rect(fx, 8, 3, 16); g.fill(0x22262C);
                g.rect(fx + 1, 9, 1, 14); g.fill(0xABC0D0);
            };

            if (i & 1) drawFlangeV(2);
            if (i & 2) drawFlangeH(27);
            if (i & 4) drawFlangeV(27);
            if (i & 8) drawFlangeH(2);

            targetArray[i] = app.renderer.generateTexture(g);
        }
    }

    private static generatePowerLines(app: Application) {
        for (let i = 0; i < 16; i++) {
            const g = new Graphics();
            g.rect(0, 0, 32, 32); g.fill({ color: 0x000000, alpha: 0 });
            
            if (i & 1) { g.rect(15, 0, 2, 16); g.fill(0x00E5FF); }
            if (i & 2) { g.rect(16, 15, 16, 2); g.fill(0x00E5FF); }
            if (i & 4) { g.rect(15, 16, 2, 16); g.fill(0x00E5FF); }
            if (i & 8) { g.rect(0, 15, 16, 2); g.fill(0x00E5FF); }

            g.rect(12, 12, 8, 8); g.fill(0x22262C);
            g.rect(13, 13, 6, 6); g.fill(0x616A75);
            g.rect(14, 14, 4, 4); g.fill(0x00E5FF);
            this.powerLineTextures[i] = app.renderer.generateTexture(g);
        }
    }

    private static generateBuildings(app: Application) {
        this.generateResidentialAssets(app);
        this.generateCommercialAssets(app);
        this.generateIndustrialAssets(app);
        
        // Solar Power Plant (3x3)
        const p = new Graphics();
        this.drawZoneBorder(p, 96, 96, 0x616A75, 4);
        this.draw3DBlock(p, 4, 4, 88, 84, 6, 0x353A42, 0x22262C, 0x181A1E);
        
        const draw3DPanel = (px: number, py: number) => {
            p.rect(px+4, py+4, 26, 20); p.fill({ color: 0x181A1E, alpha: 0.5 });
            p.rect(px+2, py+18, 3, 5); p.fill(0x181A1E);
            p.rect(px+21, py+18, 3, 5); p.fill(0x181A1E);
            p.rect(px, py, 26, 18); p.fill(0x1C1F24);
            p.rect(px+1, py+1, 24, 16); p.fill(0x1761B0);
            for(let x=px+2; x<px+24; x+=6) {
                p.rect(x, py+2, 5, 14); p.fill(0x2289FF);
                p.rect(x+1, py+3, 3, 6); p.fill(0x75C0FF);
            }
        };
        draw3DPanel(8, 8); draw3DPanel(35, 8); draw3DPanel(62, 8);
        draw3DPanel(8, 32); draw3DPanel(62, 32);
        
        this.draw3DBlock(p, 34, 48, 28, 36, 6, 0x4F5663, 0x353A42, 0x22262C);
        p.rect(38, 52, 20, 28); p.fill(0x181A1E);
        
        this.drawLightningBolt(p, 44, 55, 1.2);

        this.buildingTextures['powerplant'] = app.renderer.generateTexture(p);

        // Hospital (3x3)
        const h = new Graphics();
        this.drawZoneBorder(h, 96, 96, 0x616A75, 4);
        this.draw3DBlock(h, 4, 4, 88, 84, 6, 0x353A42, 0x22262C, 0x181A1E);
        
        this.draw3DDome(h, 20, 20, 13);
        this.draw3DDome(h, 76, 20, 13);
        this.draw3DDome(h, 20, 76, 13);
        this.draw3DDome(h, 76, 76, 13);
        this.draw3DDomeGlassOverlay(h, 20, 20, 13);
        this.draw3DDomeGlassOverlay(h, 76, 20, 13);
        this.draw3DDomeGlassOverlay(h, 20, 76, 13);
        this.draw3DDomeGlassOverlay(h, 76, 76, 13);

        this.draw3DBlock(h, 32, 12, 32, 70, 7, 0xF0F0F0, 0xBFBFBF, 0x8C8C8C);
        this.draw3DBlock(h, 12, 32, 72, 32, 7, 0xF0F0F0, 0xBFBFBF, 0x8C8C8C);
        
        h.rect(44, 28, 8, 40); h.fill(0xCC1111);
        h.rect(28, 44, 40, 8); h.fill(0xCC1111);
        
        this.drawDronePad(h, 48, 18, 'ambulance');
        this.drawDronePad(h, 48, 78, 'ambulance');

        this.buildingTextures['hospital'] = app.renderer.generateTexture(h);

        // PoliceStation (3x3)
        const po = new Graphics();
        this.drawZoneBorder(po, 96, 96, 0x616A75, 4);
        this.draw3DBlock(po, 4, 4, 88, 84, 6, 0x252930, 0x181A1E, 0x101215);
        
        this.draw3DBlock(po, 8, 8, 26, 78, 8, 0x2549A8, 0x183378, 0x102354);
        this.draw3DBlock(po, 62, 8, 26, 78, 8, 0x2549A8, 0x183378, 0x102354);
        this.draw3DBlock(po, 34, 8, 28, 24, 8, 0x1A3580, 0x12255C, 0x0C193D);
        
        po.rect(34, 32, 28, 54); po.fill(0x353A42);
        
        po.rect(40, 36, 16, 14); po.fill(0x0077FF);
        po.rect(42, 50, 12, 3); po.fill(0x0077FF);
        po.rect(46, 40, 4, 6); po.fill(0xFFDD00);
        po.rect(44, 42, 8, 2); po.fill(0xFFDD00);

        this.drawDronePad(po, 48, 18, 'police');
        this.drawDronePad(po, 48, 78, 'police');

        this.buildingTextures['policestation'] = app.renderer.generateTexture(po);

        // MaintenanceDepot (3x3)
        const ma = new Graphics();
        this.drawZoneBorder(ma, 96, 96, 0x616A75, 4);
        this.draw3DBlock(ma, 4, 4, 88, 84, 6, 0x353A42, 0x22262C, 0x181A1E);
        
        this.draw3DBlock(ma, 8, 8, 44, 78, 7, 0x616A75, 0x454C54, 0x2E3338);
        ma.rect(14, 14, 32, 18); ma.fill(0x181A1E);
        ma.rect(14, 38, 32, 18); ma.fill(0x181A1E);
        ma.rect(14, 62, 32, 18); ma.fill(0x181A1E);
        
        ma.rect(60, 24, 24, 4); ma.fill(0xE6A100);
        ma.rect(56, 20, 8, 4); ma.fill(0xE6A100);
        ma.rect(56, 28, 8, 4); ma.fill(0xE6A100);
        
        this.drawDronePad(ma, 72, 64, 'cargo');

        this.buildingTextures['maintenancedepot'] = app.renderer.generateTexture(ma);

        // Launchpad (3x3)
        const lp = new Graphics();
        this.drawZoneBorder(lp, 96, 96, 0x616A75, 4);
        this.draw3DBlock(lp, 4, 4, 88, 84, 6, 0x2B2E36, 0x1C1E24, 0x14151A);
        
        this.draw3DBlock(lp, 44, 12, 44, 70, 7, 0x4F5663, 0x353A42, 0x22262C);
        lp.rect(48, 16, 36, 62); lp.fill(0x181A1E);
        
        lp.rect(62, 22, 16, 42); lp.fill({ color: 0x101215, alpha: 0.5 });
        this.draw3DBlock(lp, 58, 20, 16, 40, 4, 0xFFFFFF, 0xD9D9D9, 0xB3B3B3);
        lp.rect(54, 40, 24, 14); lp.fill(0xD0D0D0);
        lp.rect(62, 14, 8, 6); lp.fill(0x333333);
        lp.rect(60, 60, 12, 14); lp.fill(0xFF4400);

        this.draw3DBlock(lp, 48, 12, 6, 70, 5, 0xAA3314, 0x77220D, 0x551809);
        lp.rect(44, 22, 10, 4); lp.fill(0xABC0D0);
        lp.rect(44, 42, 10, 4); lp.fill(0xABC0D0);

        for(let dy=16; dy<76; dy+=26) {
            this.drawDronePad(lp, 24, dy+6, 'cargo');
        }

        this.buildingTextures['launchpad'] = app.renderer.generateTexture(lp);

        // DroneStation (1x1)
        const ds = new Graphics();
        this.drawZoneBorder(ds, 32, 32, 0x616A75, 3);
        this.drawDronePad(ds, 16, 16, 'cargo');
        this.buildingTextures['dronestation'] = app.renderer.generateTexture(ds);

        // LandingBase (3x3)
        const lb = new Graphics();
        this.drawZoneBorder(lb, 96, 96, 0x616A75, 4);
        this.draw3DBlock(lb, 4, 4, 88, 84, 6, 0x353A42, 0x22262C, 0x181A1E);
        
        // Power Generator Block
        this.draw3DBlock(lb, 26, 8, 44, 22, 5, 0x4F5663, 0x353A42, 0x22262C);
        lb.rect(30, 12, 36, 14); lb.fill(0x181A1E);
        this.drawLightningBolt(lb, 42, 12, 0.9);
        lb.rect(8, 8, 16, 14); lb.fill(0x1761B0); lb.stroke({ color: 0x2289FF, width: 1 });
        lb.rect(72, 8, 16, 14); lb.fill(0x1761B0); lb.stroke({ color: 0x2289FF, width: 1 });
        lb.rect(24, 13, 2, 4); lb.fill(0xABC0D0);
        lb.rect(70, 13, 2, 4); lb.fill(0xABC0D0);

        // Residential Command Biosphere Dome
        this.draw3DDome(lb, 48, 48, 22, 0x1E7B1E, 5);
        lb.circle(42, 42, 3.5); lb.fill(0x3CDA3C);
        lb.circle(54, 44, 3); lb.fill(0x3CDA3C);
        this.draw3DBlock(lb, 44, 44, 8, 7, 3, 0xFFFFFF, 0xD0D0D0, 0xA0A0A0);
        lb.rect(46, 46, 4, 3); lb.fill(0x00FFFF);
        this.draw3DDomeGlassOverlay(lb, 48, 48, 22);

        lb.rect(46, 30, 4, 10); lb.fill(0xABC0D0);
        lb.rect(26, 46, 12, 4); lb.fill(0xABC0D0);
        lb.rect(58, 46, 12, 4); lb.fill(0xABC0D0);

        // Industrial Ore Extractor & Cargo Pad
        this.draw3DBlock(lb, 8, 60, 32, 26, 5, 0x4F5663, 0x353A42, 0x22262C);
        lb.ellipse(18, 72, 7, 6); lb.fill(0xE6A100);
        lb.ellipse(30, 72, 7, 6); lb.fill(0xE6A100);
        for(let x=10; x<36; x+=6) {
            lb.rect(x, 62, 3, 3); lb.fill(0xFFDD00);
        }

        this.drawDronePad(lb, 74, 72, 'cargo');

        this.buildingTextures['landingbase'] = app.renderer.generateTexture(lb);
    }

    private static generateResidentialAssets(app: Application) {
        const type = 'res';
        const color = 0x38D638; // Vibrant Green
        
        // house_res (1x1) - Curved Glass Biosphere & Hab Pod
        const h = new Graphics();
        this.draw3DDome(h, 16, 16, 13, 0x1E7B1E, 4);
        h.circle(10, 12, 3); h.fill(0x3CDA3C);
        h.circle(22, 14, 2.5); h.fill(0x3CDA3C);
        h.circle(14, 22, 2); h.fill(0x3CDA3C);
        this.draw3DBlock(h, 12, 16, 8, 6, 3, 0xFFFFFF, 0xD0D0D0, 0xA0A0A0);
        h.rect(14, 18, 4, 2); h.fill(0x00FFFF);
        this.draw3DDomeGlassOverlay(h, 16, 16, 13);
        this.buildingTextures[`house_${type}`] = app.renderer.generateTexture(h);
        
        // med_res_0 (2x2) - Multi-Dome Garden Habitat Cluster
        const m1 = new Graphics();
        m1.rect(16, 14, 32, 4); m1.fill(0x7E8896);
        m1.rect(14, 16, 4, 32); m1.fill(0x7E8896);

        const drawResDome = (cx: number, cy: number, r: number) => {
            this.draw3DDome(m1, cx, cy, r, 0x1E7B1E, 4);
            m1.circle(cx - r/3, cy - r/3, 3); m1.fill(0x3CDA3C);
            m1.circle(cx + r/3, cy + r/3, 2.5); m1.fill(0x3CDA3C);
            this.draw3DBlock(m1, cx - 4, cy + r/5, 8, 6, 3, 0xFFFFFF, 0xD0D0D0, 0xA0A0A0);
            this.draw3DDomeGlassOverlay(m1, cx, cy, r);
        };
        
        drawResDome(32, 32, 22);
        drawResDome(14, 14, 11);
        drawResDome(50, 50, 11);
        drawResDome(14, 50, 11);
        drawResDome(50, 14, 11);
        this.buildingTextures[`med_${type}_0`] = app.renderer.generateTexture(m1);

        // med_res_1 (2x2) - Grand Terraced Biosphere Dome
        const m2 = new Graphics();
        this.draw3DDome(m2, 32, 32, 27, 0x1E7B1E, 5);
        for(let i=0; i<14; i++) {
            const angle = (i * Math.PI) / 7;
            m2.circle(32 + Math.cos(angle)*18, 32 + Math.sin(angle)*18, 4);
            m2.fill(0x3CDA3C);
        }
        this.draw3DBlock(m2, 16, 18, 8, 6, 3, 0xFFFFFF, 0xD0D0D0, 0xA0A0A0);
        this.draw3DBlock(m2, 40, 18, 8, 6, 3, 0xFFFFFF, 0xD0D0D0, 0xA0A0A0);
        this.draw3DBlock(m2, 16, 40, 8, 6, 3, 0xFFFFFF, 0xD0D0D0, 0xA0A0A0);
        this.draw3DBlock(m2, 40, 40, 8, 6, 3, 0xFFFFFF, 0xD0D0D0, 0xA0A0A0);

        m2.circle(32, 32, 7); m2.fill(0x3CDA3C);
        m2.circle(32, 32, 3); m2.fill(0x00FFFF);
        this.draw3DDomeGlassOverlay(m2, 32, 32, 27);
        this.buildingTextures[`med_${type}_1`] = app.renderer.generateTexture(m2);

        // arcology_res_0 (3x3) - Mega Biosphere Pyramid Arcology with Stepped Terraces
        const b1 = new Graphics();
        // Stepped Pyramid Base 1
        this.draw3DBlock(b1, 8, 8, 80, 76, 6, 0x353A42, 0x22262C, 0x181A1E);
        // Stepped Pyramid Base 2
        this.draw3DBlock(b1, 16, 16, 64, 60, 6, 0x4F5663, 0x353A42, 0x22262C);
        // Stepped Pyramid Base 3 (Garden Promenade)
        b1.rect(20, 20, 56, 52); b1.fill(0x1B6B1B);
        for(let i=0; i<16; i++) {
            const rx = 24 + (i*9)%48;
            const ry = 24 + (i*11)%44;
            b1.circle(rx, ry, 3); b1.fill(0x3CDA3C);
        }
        // Central Glass Crown Dome
        this.draw3DDome(b1, 48, 46, 22, 0x1E7B1E, 6);
        this.drawRooftopSatellite(b1, 48, 46);
        this.draw3DDomeGlassOverlay(b1, 48, 46, 22);

        this.buildingTextures[`arcology_${type}_0`] = app.renderer.generateTexture(b1);

        // arcology_res_1 (3x3) - Quad-Tower Biosphere Complex with Skywalk Bridges
        const b2 = new Graphics();
        this.draw3DBlock(b2, 6, 6, 84, 80, 6, 0x353A42, 0x22262C, 0x181A1E);
        
        // Connecting Glass Skywalk Bridges
        b2.rect(22, 20, 52, 6); b2.fill(0x00E5FF); b2.stroke({ color: 0x616A75, width: 1 });
        b2.rect(22, 70, 52, 6); b2.fill(0x00E5FF); b2.stroke({ color: 0x616A75, width: 1 });
        b2.rect(20, 22, 6, 52); b2.fill(0x00E5FF); b2.stroke({ color: 0x616A75, width: 1 });
        b2.rect(70, 22, 6, 52); b2.fill(0x00E5FF); b2.stroke({ color: 0x616A75, width: 1 });

        const drawTower = (tx: number, ty: number) => {
            this.draw3DBlock(b2, tx, ty, 28, 28, 6, 0x616A75, 0x454C54, 0x2E3338);
            b2.rect(tx+3, ty+3, 22, 22); b2.fill(0x1E7B1E);
            this.drawRooftopAC(b2, tx+4, ty+4);
            b2.rect(tx+3, ty+3, 22, 22); b2.fill({ color: 0x99DDFF, alpha: 0.35 });
        };
        drawTower(8, 8); drawTower(60, 8); drawTower(8, 60); drawTower(60, 60);

        this.buildingTextures[`arcology_${type}_1`] = app.renderer.generateTexture(b2);
        this.generateEmptyZone(app, type, color, 'R');
    }

    private static generateCommercialAssets(app: Application) {
        const type = 'com';
        const color = 0x00FFFF; // Neon Cyan
        
        // house_com (1x1) - Cyberpunk Shop Pod
        const h = new Graphics();
        this.draw3DBlock(h, 4, 4, 24, 22, 5, 0x3D266B, 0x2B1B4D, 0x1E1236);
        h.rect(6, 6, 20, 4); h.fill(0x00FFFF);
        h.rect(6, 16, 20, 3); h.fill(0xFF00FF);
        this.drawRooftopAC(h, 16, 8);
        this.buildingTextures[`house_${type}`] = app.renderer.generateTexture(h);
        
        // med_com_0 (2x2) - Twin Cyber Office Towers with Glass Facades
        const m1 = new Graphics();
        this.draw3DBlock(m1, 6, 6, 52, 48, 7, 0x482B80, 0x311E59, 0x20133A);
        // Tower 1 Window Strips
        for(let y=12; y<46; y+=8) {
            m1.rect(10, y, 16, 4); m1.fill(0x00FFFF);
        }
        // Tower 2 Window Strips
        for(let y=12; y<46; y+=8) {
            m1.rect(34, y, 16, 4); m1.fill(0xFF00FF);
        }
        this.draw3DBlock(m1, 8, 8, 20, 18, 4, 0x20133A, 0x140B26, 0x0C061A);
        this.draw3DBlock(m1, 32, 8, 20, 18, 4, 0x20133A, 0x140B26, 0x0C061A);
        this.drawRooftopSatellite(m1, 18, 14);
        this.drawRooftopAC(m1, 36, 12);
        this.buildingTextures[`med_${type}_0`] = app.renderer.generateTexture(m1);

        // med_com_1 (2x2) - Cyber Galleria Mall with Glass Dome Atrium
        const m2 = new Graphics();
        this.draw3DBlock(m2, 4, 4, 56, 52, 6, 0x311E59, 0x20133A, 0x140B26);
        this.draw3DBlock(m2, 8, 8, 22, 20, 4, 0x482B80, 0x311E59, 0x20133A);
        this.draw3DBlock(m2, 34, 8, 22, 20, 4, 0x482B80, 0x311E59, 0x20133A);
        this.draw3DBlock(m2, 8, 32, 22, 20, 4, 0x482B80, 0x311E59, 0x20133A);
        this.draw3DBlock(m2, 34, 32, 22, 20, 4, 0x482B80, 0x311E59, 0x20133A);
        this.draw3DDome(m2, 32, 30, 13, 0x311E59, 3);
        this.draw3DDomeGlassOverlay(m2, 32, 30, 13);
        this.drawRooftopAC(m2, 12, 12);
        this.drawRooftopAC(m2, 40, 38);
        this.buildingTextures[`med_${type}_1`] = app.renderer.generateTexture(m2);

        // arcology_com_0 (3x3) - Stepped Cyber Arcade Arcology with Billboards
        const b1 = new Graphics();
        this.draw3DBlock(b1, 6, 6, 84, 80, 7, 0x482B80, 0x311E59, 0x20133A);
        this.draw3DBlock(b1, 16, 16, 64, 60, 6, 0x5D37A6, 0x3D246D, 0x261645);
        this.draw3DBlock(b1, 26, 26, 44, 40, 5, 0x7642D6, 0x502D94, 0x331C5E);
        
        // Holographic Billboard Displays
        b1.rect(20, 20, 24, 10); b1.fill(0xFF00FF);
        b1.rect(52, 20, 24, 10); b1.fill(0x00FFFF);
        this.drawDronePad(b1, 48, 44, 'cargo');

        this.buildingTextures[`arcology_${type}_0`] = app.renderer.generateTexture(b1);

        // arcology_com_1 (3x3) - Financial Sky-Spire Arcology
        const b2 = new Graphics();
        this.draw3DBlock(b2, 8, 8, 80, 76, 8, 0x3D246D, 0x261645, 0x180D2E);
        this.draw3DBlock(b2, 20, 20, 56, 52, 8, 0x5D37A6, 0x3D246D, 0x261645);
        this.draw3DBlock(b2, 32, 32, 32, 28, 8, 0x7642D6, 0x502D94, 0x331C5E);
        
        // Glass Curtain Column
        b2.rect(42, 12, 12, 68); b2.fill(0x00FFFF);
        this.drawRooftopSatellite(b2, 48, 44);

        this.buildingTextures[`arcology_${type}_1`] = app.renderer.generateTexture(b2);

        this.generateEmptyZone(app, type, color, 'C');
    }

    private static generateIndustrialAssets(app: Application) {
        const type = 'ind';
        const color = 0xFFDD00; // Amber Gold
        
        // house_ind (1x1) - Storage Silo & Pressure Manifold
        const h = new Graphics();
        this.draw3DBlock(h, 4, 4, 24, 22, 5, 0x4F5663, 0x353A42, 0x22262C);
        h.ellipse(18, 18, 9, 8); h.fill({ color: 0x181A1E, alpha: 0.4 });
        h.ellipse(16, 16, 9, 8); h.fill(0xB88100);
        h.ellipse(16, 14, 9, 7); h.fill(0xE6A100);
        h.ellipse(16, 12, 9, 6); h.fill(0xFFC83B);
        h.rect(14, 4, 4, 10); h.fill(0x7E8896);
        this.buildingTextures[`house_${type}`] = app.renderer.generateTexture(h);
        
        // med_ind_0 (2x2) - Automated Factory Plant with Smokestacks
        const m1 = new Graphics();
        this.draw3DBlock(m1, 4, 4, 56, 52, 6, 0x4F5663, 0x353A42, 0x22262C);
        const drawStack = (sx: number, sy: number) => {
            m1.rect(sx+3, sy+3, 8, 14); m1.fill({ color: 0x181A1E, alpha: 0.4 });
            m1.rect(sx, sy, 8, 14); m1.fill(0x22262C);
            m1.rect(sx, sy, 8, 3); m1.fill(0x616A75);
            m1.circle(sx+4, sy+1, 3); m1.fill(0x101215);
        };
        drawStack(10, 14); drawStack(10, 34);
        this.draw3DBlock(m1, 28, 14, 24, 32, 6, 0x353A42, 0x22262C, 0x181A1E);
        for(let x=28; x<52; x+=8) {
            m1.rect(x, 14, 4, 4); m1.fill(0xE6A100);
        }
        this.buildingTextures[`med_${type}_0`] = app.renderer.generateTexture(m1);

        // med_ind_1 (2x2) - Hydroponic Agricultural Plant with Greenhouse Bays
        const m2 = new Graphics();
        this.draw3DBlock(m2, 4, 4, 56, 52, 6, 0x353A42, 0x22262C, 0x181A1E);
        this.draw3DBlock(m2, 8, 8, 32, 44, 4, 0x99DDFF, 0x66B2D9, 0x477D99);
        for(let y=12; y<48; y+=8) {
            m2.rect(12, y, 24, 3); m2.fill(0x3CDA3C);
        }
        m2.circle(48, 28, 7); m2.fill(0xE6A100);
        this.buildingTextures[`med_${type}_1`] = app.renderer.generateTexture(m2);

        // arcology_ind_0 (3x3) - Magma Smelter Arcology with Glowing Core
        const b1 = new Graphics();
        this.draw3DBlock(b1, 6, 6, 84, 80, 8, 0x4F5663, 0x353A42, 0x22262C);
        this.draw3DBlock(b1, 18, 18, 60, 56, 7, 0x353A42, 0x22262C, 0x181A1E);
        
        // Glowing Molten Plasma Core
        b1.circle(48, 46, 20); b1.fill(0x181A1E);
        b1.circle(48, 46, 14); b1.fill(0xFF4400);
        b1.circle(48, 46, 8); b1.fill(0xFFDD00);
        
        // Heavy Feeder Pipelines
        b1.rect(44, 10, 8, 20); b1.fill(0x7E8896);
        b1.rect(44, 62, 8, 20); b1.fill(0x7E8896);
        b1.rect(10, 42, 20, 8); b1.fill(0x7E8896);
        b1.rect(66, 42, 20, 8); b1.fill(0x7E8896);

        this.buildingTextures[`arcology_${type}_0`] = app.renderer.generateTexture(b1);

        // arcology_ind_1 (3x3) - Mega Bio-Agricultural Arcology
        const b2 = new Graphics();
        this.draw3DBlock(b2, 6, 6, 84, 80, 8, 0x2B2E36, 0x1C1E24, 0x14151A);
        this.draw3DBlock(b2, 14, 14, 68, 64, 6, 0x99DDFF, 0x66B2D9, 0x477D99);
        for(let x=20; x<76; x+=10) {
            b2.rect(x, 18, 5, 56); b2.fill(0x3CDA3C);
        }
        b2.circle(24, 24, 6); b2.fill(0xE6A100); // Nutrient Silo
        b2.circle(72, 24, 6); b2.fill(0xE6A100);

        this.buildingTextures[`arcology_${type}_1`] = app.renderer.generateTexture(b2);

        this.generateEmptyZone(app, type, color, 'I');
    }

    private static generateEmptyZone(app: Application, type: string, color: number, char: 'R' | 'C' | 'I') {
        const d = new Graphics();
        
        // One SINGLE General Outer Perimeter Border in the Zone Color on Raw Mars Red Sand!
        this.drawZoneBorder(d, 96, 96, color, 4);
        
        // Single Center Retro Letter Emblem for the entire 3x3 empty zoned plot
        d.circle(48, 48, 22); d.fill({ color: 0x300A02, alpha: 0.7 });
        d.circle(48, 48, 20); d.stroke({ color: color, width: 2 });
        this.drawRetroLetter(d, 40, 36, char, color, 0x000000, 1.6);

        this.buildingTextures[`empty_${type}`] = app.renderer.generateTexture(d);
    }
}
