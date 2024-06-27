import { BeValueAdded } from 'be-value-added/be-value-added.js';
class BeIntl extends BeValueAdded {
    static config = {
        propInfo: {
            ...(super.config.propInfo),
            locale: {},
            format: {},
            intlDateFormat: {},
            intlNumberFormat: {},
            currency: {},
        },
        actions: {
            ...(super.config.actions),
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
            ...(super.config.positractions)
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
