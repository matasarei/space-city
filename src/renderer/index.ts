import { Application, Graphics, Container, Sprite } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { CityManager } from '../core/cityManager';
import { TerrainType } from '../core/terrain';
import { ZoneType } from '../core/zone';
import { AssetFactory } from './assetFactory';

interface ActiveDrone {
    sprite: Graphics;
    lights: Graphics;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    progress: number;
    speed: number;
    returning: boolean;
}

export class GameRenderer {
    private app: Application;
    private viewport: Viewport | null = null;
    private cityManager: CityManager;
    private TILE_SIZE = 32;
    public onCanvasClick: ((x: number, y: number) => void) | null = null;
    public currentTool: string | null = null;
    
    // Layers
    private terrainLayer = new Container();
    private powerLineLayer = new Container();
    private zoneLayer = new Container();
    private droneLayer = new Container();
    private ghostGraphics = new Graphics();

    // Sprite Caching
    private terrainSprites: Sprite[][] = [];
    private powerLineSprites: Sprite[][] = [];
    private zoneContainers: Map<string, Container> = new Map();
    
    private activeDrones: ActiveDrone[] = [];
    private droneSpawnTimer = 0;

    constructor(cityManager: CityManager) {
        this.cityManager = cityManager;
        this.app = new Application();
    }

    public async init() {
        const appContainer = document.getElementById('app')!;
        await this.app.init({
            resizeTo: appContainer,
            backgroundColor: 0x111111,
            resolution: window.devicePixelRatio || 1,
        });
        
        appContainer.innerHTML = '';
        appContainer.appendChild(this.app.canvas);

        AssetFactory.generateAll(this.app);

        this.viewport = new Viewport({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            worldWidth: this.cityManager.grid.width * this.TILE_SIZE,
            worldHeight: this.cityManager.grid.height * this.TILE_SIZE,
            events: this.app.renderer.events
        });

        this.app.stage.addChild(this.viewport);
        
        this.viewport.addChild(this.terrainLayer);
        this.viewport.addChild(this.powerLineLayer);
        this.viewport.addChild(this.zoneLayer);
        this.viewport.addChild(this.droneLayer);
        this.viewport.addChild(this.ghostGraphics);

        // Map Control Requirements Setup
        const isMobile = window.innerWidth <= 760;
        const dpr = window.devicePixelRatio || 1;
        // Adjust default zoom by devicePixelRatio to maintain consistent visual size
        const defaultZoom = (isMobile ? 0.5 : 1.0) / dpr;
        const minZoom = 0.2 / dpr;
        const maxZoom = 3.0;

        this.viewport.scale.set(defaultZoom);
        this.viewport.drag().pinch().decelerate();

        appContainer?.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (!this.viewport) return;
            
            if (e.ctrlKey) {
                // Zoom
                const zoomFactor = Math.pow(0.99, e.deltaY);
                const currentScale = this.viewport.scale.x;
                const newScale = Math.max(minZoom, Math.min(maxZoom, currentScale * zoomFactor));
                
                // Zoom towards mouse
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                
                const worldX = (mouseX - this.viewport.x) / currentScale;
                const worldY = (mouseY - this.viewport.y) / currentScale;
                
                this.viewport.scale.set(newScale);
                
                this.viewport.x = mouseX - (worldX * newScale);
                this.viewport.y = mouseY - (worldY * newScale);
                
            } else {
                // Pan
                this.viewport.x -= e.deltaX;
                this.viewport.y -= e.deltaY;
            }
            this.requestRender();
        }, { passive: false });
        
        // Enforce zoom limits on pinch
        this.viewport.on('zoomed', () => {
            if (this.viewport!.scale.x < minZoom) this.viewport!.scale.set(minZoom);
            if (this.viewport!.scale.x > maxZoom) this.viewport!.scale.set(maxZoom);
        });

        this.viewport.on('clicked', (e: any) => {
            const worldCoords = this.viewport!.toWorld(e.screen.x, e.screen.y);
            const gridX = Math.floor(worldCoords.x / this.TILE_SIZE);
            const gridY = Math.floor(worldCoords.y / this.TILE_SIZE);
            if (this.onCanvasClick) this.onCanvasClick(gridX, gridY);
        });

        this.viewport.on('pointermove', (e: any) => {
            const worldCoords = this.viewport!.toWorld(e.screen.x, e.screen.y);
            const gridX = Math.floor(worldCoords.x / this.TILE_SIZE);
            const gridY = Math.floor(worldCoords.y / this.TILE_SIZE);
            this.updateGhost(gridX, gridY);
        });

        this.viewport.on('pointerout', () => {
             this.ghostGraphics.clear();
        });
        
        for (let y = 0; y < this.cityManager.grid.height; y++) {
            const tRow: Sprite[] = [];
            const pRow: Sprite[] = [];
            for (let x = 0; x < this.cityManager.grid.width; x++) {
                const ts = new Sprite(AssetFactory.terrainTextures['redsand']);
                ts.x = x * this.TILE_SIZE; ts.y = y * this.TILE_SIZE; ts.width = this.TILE_SIZE; ts.height = this.TILE_SIZE;
                this.terrainLayer.addChild(ts);
                tRow.push(ts);

                const ps = new Sprite(AssetFactory.powerLineTextures[0]);
                ps.x = x * this.TILE_SIZE; ps.y = y * this.TILE_SIZE; ps.width = this.TILE_SIZE; ps.height = this.TILE_SIZE;
                ps.visible = false;
                this.powerLineLayer.addChild(ps);
                pRow.push(ps);
            }
            this.terrainSprites.push(tRow);
            this.powerLineSprites.push(pRow);
        }

        this.renderGrid();

        // Custom, bulletproof bounds checking (Requirement: no move outside the map)
        this.app.ticker.add(() => {
            if (!this.viewport) return;
            
            this.droneSpawnTimer += this.app.ticker.deltaTime;
            if (this.droneSpawnTimer > 60) { // approx every 1 second
                this.droneSpawnTimer = 0;
                this.spawnRandomDrone();
            }
            this.updateDrones(this.app.ticker.deltaTime);

            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            
            const scaledWorldW = this.cityManager.grid.width * this.TILE_SIZE * this.viewport.scale.x;
            const scaledWorldH = this.cityManager.grid.height * this.TILE_SIZE * this.viewport.scale.y;
            
            if (scaledWorldW < screenW) {
                this.viewport.x = (screenW - scaledWorldW) / 2;
            } else {
                const minX = screenW - scaledWorldW;
                if (this.viewport.x > 0) this.viewport.x = 0;
                if (this.viewport.x < minX) this.viewport.x = minX;
            }
            
            if (scaledWorldH < screenH) {
                this.viewport.y = (screenH - scaledWorldH) / 2;
            } else {
                const minY = screenH - scaledWorldH;
                if (this.viewport.y > 0) this.viewport.y = 0;
                if (this.viewport.y < minY) this.viewport.y = minY;
            }
        });

        // Requirement: Focus on top-left corner on start
        const centerCamera = () => {
            if (!this.viewport) return;
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            
            if (screenW > 0 && screenH > 0) {
                // Focus strictly on the top-left corner of the map
                this.viewport.x = 0;
                this.viewport.y = 0;
            } else {
                requestAnimationFrame(centerCamera);
            }
        };
        requestAnimationFrame(centerCamera);
    }

    private spawnRandomDrone() {
        const droneTypes = [];
        const launchpads = this.cityManager.zones.filter(z => z.type === ZoneType.DroneStation || z.type === ZoneType.Launchpad);
        const police = this.cityManager.zones.filter(z => z.type === ZoneType.PoliceStation);
        const hospitals = this.cityManager.zones.filter(z => z.type === ZoneType.Hospital);
        const targets = this.cityManager.zones.filter(z => z.type === ZoneType.Residential || z.type === ZoneType.Commercial || z.type === ZoneType.Industrial);

        if (launchpads.length >= 2) droneTypes.push('cargo');
        if (police.length > 0 && targets.length > 0) droneTypes.push('police');
        if (hospitals.length > 0 && targets.length > 0) droneTypes.push('ambulance');

        if (droneTypes.length === 0) return;

        const type = droneTypes[Math.floor(Math.random() * droneTypes.length)];

        let startNode;
        let endNode;
        let drone = new Graphics();
        let lights = new Graphics();
        drone.addChild(lights);

        const drawProps = (cx: number, cy: number, g: Graphics) => {
            g.rect(cx-6, cy-5, 3, 1); g.fill(0xAAAAAA); g.rect(cx-5, cy-6, 1, 3); g.fill(0xAAAAAA);
            g.rect(cx+3, cy-5, 3, 1); g.fill(0xAAAAAA); g.rect(cx+4, cy-6, 1, 3); g.fill(0xAAAAAA);
            g.rect(cx-6, cy+4, 3, 1); g.fill(0xAAAAAA); g.rect(cx-5, cy+3, 1, 3); g.fill(0xAAAAAA);
            g.rect(cx+3, cy+4, 3, 1); g.fill(0xAAAAAA); g.rect(cx+4, cy+3, 1, 3); g.fill(0xAAAAAA);

            g.rect(cx-4, cy-4, 2, 2); g.fill(0x555555); g.rect(cx+2, cy-4, 2, 2); g.fill(0x555555);
            g.rect(cx-4, cy+2, 2, 2); g.fill(0x555555); g.rect(cx+2, cy+2, 2, 2); g.fill(0x555555);
        };

        if (type === 'cargo') {
            if (Math.random() > 0.3) return; // Cargo is common but not overwhelming
            startNode = launchpads[Math.floor(Math.random() * launchpads.length)];
            endNode = launchpads[Math.floor(Math.random() * launchpads.length)];
            while (endNode === startNode) endNode = launchpads[Math.floor(Math.random() * launchpads.length)];
            
            drawProps(0, 0, drone);
            lights.rect(-5, -5, 1, 1); lights.fill(0xFF0000); lights.rect(4, -5, 1, 1); lights.fill(0xFF0000);
            lights.rect(-5, 4, 1, 1); lights.fill(0x00FF00); lights.rect(4, 4, 1, 1); lights.fill(0x00FF00);
            drone.rect(-2, -2, 4, 4); drone.fill(0x00FFFF);
            drone.rect(-1, -1, 2, 2); drone.fill(0x222222);
            drone.rect(-1, -3, 2, 1); drone.fill(0xFFFFFF); // camera
        } else if (type === 'police') {
            if (Math.random() > 0.05) return; // Police is very rare
            startNode = police[Math.floor(Math.random() * police.length)];
            endNode = targets[Math.floor(Math.random() * targets.length)];
            
            drawProps(0, 0, drone);
            lights.rect(-5, -5, 1, 1); lights.fill(0xFF0000); lights.rect(4, -5, 1, 1); lights.fill(0x0000FF);
            lights.rect(-5, 4, 1, 1); lights.fill(0xFF0000); lights.rect(4, 4, 1, 1); lights.fill(0x0000FF);
            drone.rect(-2, -2, 4, 4); drone.fill(0x113388);
            drone.rect(-1, -1, 2, 2); drone.fill(0xFFDD00);
            drone.rect(-1, -3, 2, 1); drone.fill(0xFFFFFF); // camera
        } else {
            if (Math.random() > 0.05) return; // Ambulance is very rare
            startNode = hospitals[Math.floor(Math.random() * hospitals.length)];
            endNode = targets[Math.floor(Math.random() * targets.length)];
            
            drawProps(0, 0, drone);
            lights.rect(-5, -5, 1, 1); lights.fill(0xFF0000); lights.rect(4, -5, 1, 1); lights.fill(0xFF0000);
            lights.rect(-5, 4, 1, 1); lights.fill(0xFF0000); lights.rect(4, 4, 1, 1); lights.fill(0xFF0000);
            drone.rect(-2, -2, 4, 4); drone.fill(0xFFFFFF);
            drone.rect(-1, -2, 2, 4); drone.fill(0xCC0000);
            drone.rect(-2, -1, 4, 2); drone.fill(0xCC0000);
            drone.rect(-1, -3, 2, 1); drone.fill(0xFFFFFF); // camera
        }
        
        this.droneLayer.addChild(drone);
        
        const startX = startNode.centerX * this.TILE_SIZE;
        const startY = startNode.centerY * this.TILE_SIZE;
        const endX = endNode.centerX * this.TILE_SIZE;
        const endY = endNode.centerY * this.TILE_SIZE;
        
        drone.x = startX;
        drone.y = startY;
        
        const dist = Math.hypot(endX - startX, endY - startY);
        const speed = 2.0 / dist; // consistent flight speed
        
        this.activeDrones.push({
            sprite: drone,
            lights,
            startX, startY,
            targetX: endX, targetY: endY,
            progress: 0,
            speed,
            returning: false
        });
    }

    private updateDrones(dt: number) {
        for (let i = this.activeDrones.length - 1; i >= 0; i--) {
            const d = this.activeDrones[i];
            d.progress += d.speed * dt;
            
            // Blink lights every ~250ms
            d.lights.visible = Math.floor(Date.now() / 250) % 2 === 0;
            
            if (d.progress >= 1) {
                if (!d.returning) {
                    d.returning = true;
                    d.progress = 0;
                    const tempX = d.startX;
                    const tempY = d.startY;
                    d.startX = d.targetX;
                    d.startY = d.targetY;
                    d.targetX = tempX;
                    d.targetY = tempY;
                } else {
                    this.droneLayer.removeChild(d.sprite);
                    d.sprite.destroy({ children: true });
                    this.activeDrones.splice(i, 1);
                }
            } else {
                d.sprite.x = d.startX + (d.targetX - d.startX) * d.progress;
                d.sprite.y = d.startY + (d.targetY - d.startY) * d.progress;
                d.sprite.rotation = Math.sin(d.progress * Math.PI * 40) * 0.1; 
            }
        }
    }

    public updateGhost(gridX: number, gridY: number) {
        if (!this.currentTool) {
            this.ghostGraphics.visible = false;
            return;
        }

        this.ghostGraphics.visible = true;
        this.ghostGraphics.clear();
        
        let color = 0xFFFFFF;
        if (this.currentTool === 'Clear') color = 0xFF0000;
        
        const isMacro = [
            'Residential', 'Commercial', 'Industrial', 
            'PowerPlant', 'Hospital', 'PoliceStation', 'MaintenanceDepot', 'Launchpad'
        ].includes(this.currentTool);
        
        const size = isMacro ? 3 : 1;
        const offset = isMacro ? 1 : 0;
        
        const startX = (gridX - offset) * this.TILE_SIZE;
        const startY = (gridY - offset) * this.TILE_SIZE;
        const width = size * this.TILE_SIZE;
        
        this.ghostGraphics.rect(startX, startY, width, width);
        this.ghostGraphics.fill({ color, alpha: 0.3 });
        this.ghostGraphics.stroke({ color: 0xFFFFFF, alpha: 0.8, width: 2 });
    }

    public zoomIn() {
        if (!this.viewport) return;
        this.viewport.scale.x *= 1.3;
        this.viewport.scale.y *= 1.3;
    }
    
    public zoomOut() {
        if (!this.viewport) return;
        this.viewport.scale.x /= 1.3;
        this.viewport.scale.y /= 1.3;
    }

    public zoomReset() {
        if (!this.viewport) return;
        this.viewport.scale.x = 1;
        this.viewport.scale.y = 1;
    }

    public requestRender() {
        this.renderGrid();
    }
    
    private getRoadBitmask(x: number, y: number): number {
        let mask = 0;
        const n = this.cityManager.grid.getCell(x, y - 1);
        const e = this.cityManager.grid.getCell(x + 1, y);
        const s = this.cityManager.grid.getCell(x, y + 1);
        const w = this.cityManager.grid.getCell(x - 1, y);
        
        if (n && n.zone === ZoneType.Transit) mask |= 1;
        if (e && e.zone === ZoneType.Transit) mask |= 2;
        if (s && s.zone === ZoneType.Transit) mask |= 4;
        if (w && w.zone === ZoneType.Transit) mask |= 8;
        
        return mask;
    }
    
    private getPowerLineBitmask(x: number, y: number): number {
        let mask = 0;
        const n = this.cityManager.grid.getCell(x, y - 1);
        const e = this.cityManager.grid.getCell(x + 1, y);
        const s = this.cityManager.grid.getCell(x, y + 1);
        const w = this.cityManager.grid.getCell(x - 1, y);
        
        const conducts = (c: import('../core/cell').Cell | null) => c && (c.hasPowerLine || c.zoneEntity != null);
        
        if (conducts(n)) mask |= 1;
        if (conducts(e)) mask |= 2;
        if (conducts(s)) mask |= 4;
        if (conducts(w)) mask |= 8;
        return mask;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
        }
        return Math.abs(hash);
    }

    private renderGrid() {
        if (!this.viewport) return;
        // ... (replace loop body)

        
        for (let y = 0; y < this.cityManager.grid.height; y++) {
            for (let x = 0; x < this.cityManager.grid.width; x++) {
                const cell = this.cityManager.grid.getCell(x, y);
                const tSprite = this.terrainSprites[y][x];
                const pSprite = this.powerLineSprites[y][x];
                if (!cell) continue;

                // Powerlines render as an overlay overlay
                if (cell.hasPowerLine) {
                    pSprite.texture = AssetFactory.powerLineTextures[this.getPowerLineBitmask(x, y)];
                    pSprite.visible = true;
                } else {
                    pSprite.visible = false;
                }

                // Terrain/Roads
                if (cell.zone === ZoneType.Transit) {
                    if (cell.traffic > 150) {
                        tSprite.texture = AssetFactory.roadTexturesRed[this.getRoadBitmask(x, y)];
                    } else if (cell.traffic > 50) {
                        tSprite.texture = AssetFactory.roadTexturesYellow[this.getRoadBitmask(x, y)];
                    } else {
                        tSprite.texture = AssetFactory.roadTexturesCyan[this.getRoadBitmask(x, y)];
                    }
                    tSprite.tint = 0xFFFFFF;
                } else if (cell.zoneEntity != null) {
                    tSprite.texture = AssetFactory.terrainTextures['redsand'];
                    tSprite.tint = 0xFFFFFF;
                } else {
                    tSprite.tint = 0xFFFFFF; 
                    switch (cell.terrain) {
                        case TerrainType.Rock: tSprite.texture = AssetFactory.terrainTextures['rock']; break;
                        case TerrainType.Iron: tSprite.texture = AssetFactory.terrainTextures['iron']; break;
                        case TerrainType.Crater: tSprite.texture = AssetFactory.terrainTextures['crater']; break;
                        case TerrainType.Ice: tSprite.texture = AssetFactory.terrainTextures['ice']; break;
                        case TerrainType.RedSand: 
                        default:
                            tSprite.texture = AssetFactory.terrainTextures['redsand']; 
                            break;
                    }
                }
            }
        }
        
        const currentZoneIds = new Set(this.cityManager.zones.map(z => z.id));
        
        for (const [id, container] of this.zoneContainers.entries()) {
            if (!currentZoneIds.has(id)) {
                this.zoneLayer.removeChild(container);
                container.destroy({ children: true });
                this.zoneContainers.delete(id);
            }
        }
        
        for (const zone of this.cityManager.zones) {
            let container = this.zoneContainers.get(zone.id);
            if (!container) {
                container = new Container();
                this.zoneLayer.addChild(container);
                this.zoneContainers.set(zone.id, container);
            }
            
            if (zone.type === ZoneType.DroneStation) {
                container.x = zone.centerX * this.TILE_SIZE;
                container.y = zone.centerY * this.TILE_SIZE;
            } else {
                container.x = (zone.centerX - 1) * this.TILE_SIZE;
                container.y = (zone.centerY - 1) * this.TILE_SIZE;
            }
            
            container.removeChildren();
            
            const seed = this.hashString(zone.id);

            if (zone.type === ZoneType.PowerPlant) {
                container.addChild(new Sprite(AssetFactory.buildingTextures['powerplant']));
            } else if (zone.type === ZoneType.Hospital) {
                container.addChild(new Sprite(AssetFactory.buildingTextures['hospital']));
            } else if (zone.type === ZoneType.PoliceStation) {
                container.addChild(new Sprite(AssetFactory.buildingTextures['policestation']));
            } else if (zone.type === ZoneType.MaintenanceDepot) {
                container.addChild(new Sprite(AssetFactory.buildingTextures['maintenancedepot']));
            } else if (zone.type === ZoneType.Launchpad) {
                container.addChild(new Sprite(AssetFactory.buildingTextures['launchpad']));
            } else if (zone.type === ZoneType.DroneStation) {
                container.addChild(new Sprite(AssetFactory.buildingTextures['dronestation']));
            } else if (zone.type === ZoneType.LandingBase) {
                container.addChild(new Sprite(AssetFactory.buildingTextures['landingbase']));
            } else {
                let typeStr = 'res';
                if (zone.type === ZoneType.Commercial) typeStr = 'com';
                if (zone.type === ZoneType.Industrial) typeStr = 'ind';
                
                // Always add the 96x96 Zone Foundation with the ONE GENERAL OUTER BORDER first!
                const zoneBg = new Sprite(AssetFactory.buildingTextures[`empty_${typeStr}`]);
                container.addChild(zoneBg);

                if (zone.population > 0 && zone.population < 40) {
                    const numHouses = Math.min(8, Math.max(1, Math.floor(zone.population / 5)));
                    const positions = [[0,0], [1,0], [2,0], [0,1], [2,1], [0,2], [1,2], [2,2]];
                    
                    for (let i = positions.length - 1; i > 0; i--) {
                        const j = (seed + i) % (i + 1);
                        [positions[i], positions[j]] = [positions[j], positions[i]];
                    }

                    for(let i=0; i<numHouses; i++) {
                        const s = new Sprite(AssetFactory.buildingTextures[`house_${typeStr}`]);
                        s.x = positions[i][0] * this.TILE_SIZE;
                        s.y = positions[i][1] * this.TILE_SIZE;
                        container.addChild(s);
                    }
                } else if (zone.population >= 40 && zone.population < 80) {
                    const varIndex = seed % 2;
                    const m = new Sprite(AssetFactory.buildingTextures[`med_${typeStr}_${varIndex}`]);
                    
                    const corner = seed % 4; 
                    const mx = (corner % 2) * this.TILE_SIZE;
                    const my = Math.floor(corner / 2) * this.TILE_SIZE;
                    m.x = mx; m.y = my;
                    container.addChild(m);
                    
                    const remaining = [];
                    for(let y=0; y<3; y++) {
                        for(let x=0; x<3; x++) {
                            if (x*this.TILE_SIZE < mx || x*this.TILE_SIZE >= mx + 64 || 
                                y*this.TILE_SIZE < my || y*this.TILE_SIZE >= my + 64) {
                                remaining.push([x, y]);
                            }
                        }
                    }
                    const extraHouses = 1 + (seed % 4);
                    for(let i=0; i<extraHouses; i++) {
                        const pos = remaining[(seed + i) % remaining.length];
                        const s1 = new Sprite(AssetFactory.buildingTextures[`house_${typeStr}`]);
                        s1.x = pos[0] * this.TILE_SIZE; s1.y = pos[1] * this.TILE_SIZE;
                        container.addChild(s1);
                    }
                } else if (zone.population >= 80) {
                    const varIndex = seed % 2;
                    const b = new Sprite(AssetFactory.buildingTextures[`arcology_${typeStr}_${varIndex}`]);
                    b.x = 0; b.y = 0;
                    container.addChild(b);
                }
            }
            
            const warningBoxes: number[] = [];
            
            if (zone.isBroken) {
                container.children.forEach(c => (c as Sprite).tint = 0x555555);
                warningBoxes.push(0xFF6600);
            } else if (!zone.isPowered || !zone.isRoadConnected) {
                container.children.forEach(c => (c as Sprite).tint = 0x555555);
                if (!zone.isPowered) warningBoxes.push(0xFFFF00);
                if (!zone.isRoadConnected) warningBoxes.push(0xFF0000);
            }
            
            if (warningBoxes.length > 0 && Math.floor(Date.now() / 500) % 2 === 0) {
                const color = warningBoxes[Math.floor(Date.now() / 1000) % warningBoxes.length];
                const warning = new Graphics();
                const warningSize = zone.type === ZoneType.DroneStation ? 32 : 96;
                warning.rect(0, 0, warningSize, warningSize);
                warning.fill(color);
                warning.alpha = 0.5;
                container.addChild(warning);
            }
            
            this.zoneLayer.addChild(container);
        }
    }
}
