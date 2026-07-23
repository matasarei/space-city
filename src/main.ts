import { CityManager } from './core/cityManager';
import { GameRenderer } from './renderer/index';
import { UIManager } from './ui/index';
import { SimulationEngine } from './core/simulation';
import { AdvisorSystem } from './ui/advisor';

console.log("SpaceCity Initialization started...");

async function bootstrap() {
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = '<h1>SpaceCity Loading...</h1>';
    }

    const cityManager = new CityManager(250, 250);
    const simulation = new SimulationEngine(cityManager);
    
    const renderer = new GameRenderer(cityManager);
    await renderer.init();

    const advisor = new AdvisorSystem(simulation, cityManager);
    new UIManager(cityManager, renderer, simulation, advisor);

    // Setup Simulation Loop
    const uiDate = document.getElementById('ui-date');
    const uiPop = document.getElementById('ui-pop');
    const uiFunds = document.getElementById('ui-funds');

    setInterval(() => {
        simulation.tick();
        if (uiDate) uiDate.innerText = simulation.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        if (uiPop) uiPop.innerText = simulation.population.toString();
        if (uiFunds) uiFunds.innerText = simulation.funds.toString();
        
        const rev = simulation.lastRevenue;
        const exp = simulation.lastExpenses;
        const totRev = rev.r + rev.c + rev.i;
        const totExp = exp.power + exp.health + exp.police + exp.maint;
        const net = totRev - totExp;
        
        const e = (id: string) => document.getElementById(id);
        if (e('budget-rev-r')) {
            e('budget-rev-r')!.innerText = '$' + rev.r;
            e('budget-rev-c')!.innerText = '$' + rev.c;
            e('budget-rev-i')!.innerText = '$' + rev.i;
            e('budget-rev-total')!.innerText = '$' + totRev;
            
            e('budget-exp-p')!.innerText = '$' + exp.power;
            e('budget-exp-h')!.innerText = '$' + exp.health;
            e('budget-exp-pol')!.innerText = '$' + exp.police;
            e('budget-exp-m')!.innerText = '$' + exp.maint;
            e('budget-exp-total')!.innerText = '$' + totExp;
            
            const netEl = e('budget-net')!;
            netEl.innerText = (net >= 0 ? '+$' : '-$') + Math.abs(net);
            netEl.style.color = net >= 0 ? 'green' : 'red';
        }
        
        
        if (simulation.funds <= -1000) {
            const modal = document.getElementById('game-over-modal');
            if (modal) modal.style.display = 'block';
        }
        
        renderer.requestRender();
    }, 4000); // 1 in-game month every 4 seconds

    const btnRestart = document.getElementById('btn-restart');
    btnRestart?.addEventListener('click', () => {
        window.location.reload();
    });
}

bootstrap();
