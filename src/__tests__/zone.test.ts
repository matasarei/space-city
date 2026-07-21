import { describe, it, expect } from 'vitest';
import { ZoneType, ZoneEntity } from '../core/zone';

describe('ZoneEntity', () => {
    it('should initialize correctly', () => {
        const entity = new ZoneEntity('123', ZoneType.Residential, 5, 5);
        
        expect(entity.id).toBe('123');
        expect(entity.type).toBe(ZoneType.Residential);
        expect(entity.centerX).toBe(5);
        expect(entity.centerY).toBe(5);
        
        // Default properties
        expect(entity.population).toBe(0);
        expect(entity.densityLevel).toBe(1);
        expect(entity.isPowered).toBe(false);
        expect(entity.isRoadConnected).toBe(false);
        expect(entity.isBroken).toBe(false);
        expect(entity.trafficPenalty).toBe(0);
    });
});
