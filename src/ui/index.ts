import { ZoneType } from '../core/zone';
import { CityManager } from '../core/cityManager';
import { GameRenderer } from '../renderer/index';

export class UIManager {
    public selectedTool: ZoneType | 'Clear' | null = null;
    
    constructor(private cityManager: CityManager, private renderer: GameRenderer) {
        this.setupEventListeners();
    }

    private setupEventListeners() {
        const buttons = document.querySelectorAll('.tool-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                const target = e.currentTarget as HTMLElement;
                target.classList.add('active');
                
                this.selectedTool = target.dataset.tool as any;
                this.renderer.currentTool = this.selectedTool; // Tell renderer to draw the correct hover ghost
                
                // Close menu on mobile after selection
                const toolbar = document.getElementById('toolbar');
                if (toolbar) toolbar.classList.remove('open');
            });
        });

        const btnExpand = document.getElementById('btn-expand-tools');
        const toolbar = document.getElementById('toolbar');
        btnExpand?.addEventListener('click', () => {
            toolbar?.classList.toggle('expanded');
            // Flip the arrow
            if (toolbar?.classList.contains('expanded')) {
                btnExpand.innerHTML = '<svg width="24" height="24" viewBox="0 0 16 16" fill="black" shape-rendering="crispEdges"><polygon points="3,11 13,11 8,5"/></svg>';
            } else {
                btnExpand.innerHTML = '<svg width="24" height="24" viewBox="0 0 16 16" fill="black" shape-rendering="crispEdges"><polygon points="3,5 13,5 8,11"/></svg>';
            }
        });

        const btnZoomIn = document.getElementById('zoom-in');
        const btnZoomOut = document.getElementById('zoom-out');
        const btnZoomReset = document.getElementById('zoom-reset');
        const btnBudget = document.getElementById('btn-budget');
        const modalBudget = document.getElementById('budget-modal');
        const btnCloseBudget = document.getElementById('btn-close-budget');

        // Collapsible toolbar logic relies entirely on CSS media queries now.

        btnZoomIn?.addEventListener('click', () => this.renderer.zoomIn());
        btnZoomOut?.addEventListener('click', () => this.renderer.zoomOut());
        btnZoomReset?.addEventListener('click', () => this.renderer.zoomReset());

        btnBudget?.addEventListener('click', () => {
            if (modalBudget) modalBudget.style.display = 'block';
        });

        btnCloseBudget?.addEventListener('click', () => {
            if (modalBudget) modalBudget.style.display = 'none';
        });

        this.renderer.onCanvasClick = (x, y) => this.handleCanvasClick(x, y);
    }

    private handleCanvasClick(gridX: number, gridY: number) {
        if (!this.selectedTool) return;
        
        let success = false;
        if (this.selectedTool === 'Clear') {
            success = this.cityManager.clearZone(gridX, gridY);
        } else {
            success = this.cityManager.placeZone(gridX, gridY, this.selectedTool as ZoneType);
        }
        
        if (success) {
            this.renderer.requestRender();
        }
    }
}
