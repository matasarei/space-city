import { SimulationEngine } from '../core/simulation';
import { CityManager } from '../core/cityManager';
import { ZoneType } from '../core/zone';

export class AdvisorSystem {
    private simulation: SimulationEngine;
    private cityManager: CityManager;
    private messageElement: HTMLElement;
    private portraitElement: HTMLImageElement;
    private tempMessageTimeout: any = null;
    
    private assistantPortrait = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" shape-rendering="crispEdges"><rect width="64" height="64" fill="%23c0c0c0"/><rect x="20" y="20" width="24" height="20" fill="%23FFCCAA"/><rect x="24" y="26" width="4" height="4" fill="%23000"/><rect x="36" y="26" width="4" height="4" fill="%23000"/><rect x="28" y="34" width="8" height="2" fill="%23000"/><rect x="16" y="12" width="32" height="8" fill="%23442200"/><rect x="16" y="20" width="4" height="8" fill="%23442200"/><rect x="12" y="40" width="40" height="24" fill="%23224488"/><rect x="28" y="40" width="8" height="12" fill="%23FFF"/></svg>`;
    private engineerPortrait = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" shape-rendering="crispEdges"><rect width="64" height="64" fill="%23c0c0c0"/><rect x="20" y="20" width="24" height="20" fill="%23FFCCAA"/><rect x="24" y="28" width="4" height="4" fill="%23000"/><rect x="36" y="28" width="4" height="4" fill="%23000"/><rect x="22" y="24" width="6" height="2" fill="%23000"/><rect x="36" y="24" width="6" height="2" fill="%23000"/><rect x="28" y="36" width="8" height="2" fill="%23000"/><rect x="16" y="8" width="32" height="12" fill="%23FFAA00"/><rect x="12" y="16" width="40" height="4" fill="%23FFAA00"/><rect x="12" y="40" width="40" height="24" fill="%23884422"/></svg>`;

    constructor(sim: SimulationEngine, city: CityManager) {
         this.simulation = sim;
         this.cityManager = city;
         this.messageElement = document.getElementById('advisor-message')!;
         this.portraitElement = document.getElementById('advisor-portrait') as HTMLImageElement;
         
         setInterval(() => this.update(), 6000);
         this.update();
    }

    public showTemporaryMessage(msg: string, isError: boolean = false, character: 'assistant' | 'engineer' = 'assistant') {
         if (this.tempMessageTimeout) {
             clearTimeout(this.tempMessageTimeout);
         }
         this.messageElement.innerText = msg;
         if (isError) {
             this.messageElement.style.color = '#ff4444';
         } else {
             this.messageElement.style.color = '';
         }
         
         this.portraitElement.src = character === 'assistant' ? this.assistantPortrait : this.engineerPortrait;
         
         this.tempMessageTimeout = setTimeout(() => {
             this.messageElement.style.color = '';
             this.tempMessageTimeout = null;
             this.update(); // Revert to normal message
         }, 3000);
    }

    public update() {
         if (this.tempMessageTimeout) return;
         const zones = this.cityManager.zones;
         let unpowered = 0;
         let unconnected = 0;
         let popR = 0, popC = 0, popI = 0;
         let hasHealth = false, hasPolice = false, hasMaint = false;
         let totalBroken = 0;

         for (const z of zones) {
             if (!z.isPowered && z.type !== ZoneType.PowerPlant) unpowered++;
             if (!z.isRoadConnected && z.type !== ZoneType.PowerPlant) unconnected++;
             if (z.type === ZoneType.Residential) popR += z.population;
             if (z.type === ZoneType.Commercial) popC += z.population;
             if (z.type === ZoneType.Industrial) popI += z.population;
             
             if (z.type === ZoneType.Hospital && z.isPowered && z.isRoadConnected) hasHealth = true;
             if (z.type === ZoneType.PoliceStation && z.isPowered && z.isRoadConnected) hasPolice = true;
             if (z.type === ZoneType.MaintenanceDepot && z.isPowered && z.isRoadConnected) hasMaint = true;
             if (z.isBroken) totalBroken++;
         }

         let msg = "";
         let portrait = this.assistantPortrait;
         const warningPortrait = this.engineerPortrait;

         if (totalBroken > 0) {
             msg = `Engineer: "Mayor! ${totalBroken} buildings are breaking down! We need a functioning Maintenance Depot!"`;
             portrait = warningPortrait;
         } else if (unpowered > 0) {
             msg = `Engineer: "Mayor! ${unpowered} zones are without power! Build Power Plants and connect them with Power Lines!"`;
             portrait = warningPortrait;
         } else if (unconnected > 0) {
             msg = `Engineer: "Mayor! ${unconnected} zones have no road access! Zones won't grow without transit."`;
             portrait = warningPortrait;
         } else if (!hasMaint && (popR > 50 || popC > 50 || popI > 50)) {
             msg = `Engineer: "Mayor, without a Maintenance Depot, our buildings will start to deteriorate rapidly!"`;
             portrait = warningPortrait;
         } else if (!hasHealth && popR > 50) {
             msg = `Assistant: "Citizens are getting sick! We desperately need to fund a Hospital for healthcare."`;
         } else if (!hasPolice && popR > 100) {
             msg = `Assistant: "Crime is rising! Please build a Police Station to keep the colony safe."`;
         } else if (this.simulation.funds < 50) {
             msg = `Assistant: "We are running out of funds! We need more tax revenue from Commercial or Industrial zones."`;
         } else if (popR > (popC + popI) * 1.5 + 50) {
             msg = `Assistant: "Unemployment is too high! Citizens are demanding more Commercial and Industrial zones for jobs."`;
         } else if (popC > popR * 0.5 + 20) {
             msg = `Assistant: "Commercial zones are struggling due to lack of customers. We need more Residential zones!"`;
         } else if (popI > popR * 0.5 + 20) {
             msg = `Assistant: "Industry is begging for workers! Build more Residential zones to provide labor."`;
         } else if (zones.length === 0) {
             msg = `Assistant: "Welcome to Mars City, Mayor! Start by building a Power Plant, then connect it to Residential zones."`;
         } else {
             msg = `Assistant: "The city is operating smoothly, Mayor. Population is steadily growing!"`;
         }

         if (this.messageElement.innerText !== msg) {
             this.messageElement.innerText = msg;
         }
         
         if (this.portraitElement.src !== portrait) {
             this.portraitElement.src = portrait;
         }
    }
}
