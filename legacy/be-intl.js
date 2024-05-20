import { XE } from 'xtal-element/XE.js';
import { BeValueAdded, beValueAddedActions, beValueAddedPropDefaults, beValueAddedPropInfo } from 'be-value-added/be-value-added.js';
export class BeIntl extends BeValueAdded {
    static get beConfig() {
        return {
            parse: true,
            primaryProp: 'format',
            primaryPropReq: true,
        };
    }
    #langObserver;
    hydrate(self) {
        const { enhancedElement } = self;
        const returnObj = super.hydrate(self);
        if (!(enhancedElement instanceof HTMLElement))
            return returnObj;
        const { observeAttr } = self;
        if (observeAttr) {
            const mutOptions = {
                attributeFilter: ['lang'],
                attributes: true
            };
            self.#langObserver = new MutationObserver(( /*mutations: MutationRecord[]*/) => {
                self.locale = enhancedElement.lang || defaultLocale;
                ;
            });
            self.#langObserver.observe(enhancedElement, mutOptions);
        }
        returnObj.locale = enhancedElement.lang || defaultLocale;
        delete returnObj.resolved;
        return returnObj;
    }
    detach(detachedElement) {
        super.detach(detachedElement);
        if (this.#langObserver !== undefined)
            this.#langObserver.disconnect();
    }
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
        const { enhancedElement, locale, format } = self;
        switch (enhancedElement.localName) {
            case 'time':
                return {
                    intlDateFormat: new Intl.DateTimeFormat(locale, format),
                    resolved: true
                };
            default:
                return {
                    intlNumberFormat: new Intl.NumberFormat(locale, format),
                    resolved: true
                };
        }
    }
}
const defaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
export const tagName = 'be-intl';
const xe = new XE({
    config: {
        tagName,
        propDefaults: {
            ...beValueAddedPropDefaults,
        },
        propInfo: {
            ...beValueAddedPropInfo,
        },
        actions: {
            ...beValueAddedActions,
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
                ifKeyIn: ['format']
            }
        }
    },
    superclass: BeIntl
});
