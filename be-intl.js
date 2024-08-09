// @ts-check
import { propInfo, rejected, resolved } from 'be-enhanced/cc.js';
import { BeValueAdded } from 'be-value-added/be-value-added.js';
/** @import {Actions, AllProps} from './types' */
/** @import {BEConfig, IEnhancement, BEAllProps} from './ts-refs/be-enhanced/types.d.ts' */

/**
 * @implements {Actions}
 */
class BeIntl extends BeValueAdded {
    /**
     * @type {BEConfig<AllProps & BEAllProps, Actions & IEnhancement>}
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
            resolved, rejected,
        ]
    };
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
        enhancedElement.textContent = this.intlDateFormat.format(value);
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
