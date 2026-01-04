import { hexToRgb } from './color';
import { vec3 } from 'gl-matrix';

describe('Color Utils', () => {
    test('hexToRgb valid inputs', () => {
        const white = hexToRgb('#FFFFFF');
        expect(white[0]).toBeCloseTo(1.0);
        expect(white[1]).toBeCloseTo(1.0);
        expect(white[2]).toBeCloseTo(1.0);

        const red = hexToRgb('#F00');
        expect(red[0]).toBeCloseTo(1.0);
        expect(red[1]).toBeCloseTo(0.0);
        expect(red[2]).toBeCloseTo(0.0);
    });

    test('hexToRgb invalid inputs', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        const invalid1 = hexToRgb('invalid');
        expect(invalid1).toEqual(vec3.fromValues(0, 0, 0));
        expect(consoleSpy).toHaveBeenCalledWith('Invalid hex color string format. Returning black.');

        const invalid2 = hexToRgb('#12');
        expect(invalid2).toEqual(vec3.fromValues(0, 0, 0));

        const invalid3 = hexToRgb('#1234567');
        expect(invalid3).toEqual(vec3.fromValues(0, 0, 0));

        consoleSpy.mockRestore();
    });
});
