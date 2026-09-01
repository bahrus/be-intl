// @ts-check
import { propInfo, rejected, resolved } from 'be-enhanced/cc.js';
import { BeValueAdded } from 'be-value-added/be-value-added.js';
/** @import {Actions, AP} from './ts-refs/be-intl/types' */
/** @import {BEConfig, IEnhancement, BEAllProps} from './ts-refs/be-enhanced/types.d.ts' */
/** @import {Positraction, PropLookup, PropInfo} from './ts-refs/trans-render/froop/types.d.ts' */
/** @import {BVAActions, BVAAllProps, BVAP} from './ts-refs/be-value-added/types' */;

/**
 * @implements {Actions}
 */
class BeIntl extends BeValueAdded {
    /**
     * @type {BEConfig<AP & BEAllProps, Actions & IEnhancement>}
     */
    static config = {
        propInfo: {
            ...propInfo,
            locale: {},
            format: {},
            intlDateFormat: {},
            intlNumberFormat: {},
            currency: {},
        },
        actions: {
            
            hydrate: {
                ifAllOf: ['attached'],
            },
            formatNumber: {
                ifKeyIn: ['value'],
                ifAllOf: ['intlNumberFormat']
            },
            formatDate: {
                ifKeyIn: ['value'],
                ifAllOf: ['intlDateFormat']
            },
            onFormattingChange: {
                ifAllOf: ['locale'],
                ifKeyIn: ['format', 'currency']
            }
        },
        positractions: [
            /** @type {Positraction<BVAP & BEAllProps>} */
            (resolved), 
            /** @type {Positraction<BVAP & BEAllProps>} */
            (rejected),
        ]
    };
    /**
     * 
     * @param {AP & BEAllProps} self 
     * @returns {void}
     */
    formatNumber(self) {
        const { enhancedElement, value } = self;
        if (value === undefined) {
            enhancedElement.textContent = '';
            return;
        }
        const { intlNumberFormat } = self;
        enhancedElement.textContent = intlNumberFormat.format(value);
    }
    formatDate(self) {
        const { enhancedElement, value, intlNumberFormat } = self;
        enhancedElement.textContent = self.intlDateFormat.format(value);
    }
    onFormattingChange(self) {
        const { enhancedElement, locale, format, currency } = self;
        switch (enhancedElement.localName) {
            case 'time':
                return {
                    intlDateFormat: new Intl.DateTimeFormat(locale, format),
                    resolved: true
                };
            default:
                if (currency !== undefined)
                    format.currency = currency;
                return {
                    intlNumberFormat: new Intl.NumberFormat(locale, format),
                    resolved: true
                };
        }
    }
}
await BeIntl.bootUp();
export { BeIntl };
