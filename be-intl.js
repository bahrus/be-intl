import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
import { register } from 'be-hive/register.js';
export class BeIntl extends BE {
    static get beConfig() {
        return {
            parse: true,
            primaryProp: 'format',
            primaryPropReq: true,
        };
    }
    async attach(enhancedElement, enhancementInfo) {
        await super.attach(enhancedElement, enhancementInfo);
        import('be-propagating/be-propagating.js');
        const base = await enhancedElement.beEnhanced.whenResolved('be-propagating');
        const propagator = base.propagators.get('self');
        propagator.addEventListener('lang', e => {
            this.locale = e.detail.newVal;
        });
        switch (enhancedElement.localName) {
            case 'data':
            case 'output':
                {
                    propagator.addEventListener('value', e => {
                        const newVal = e.detail.newVal;
                        switch (typeof newVal) {
                            case 'string':
                                if (!newVal) {
                                    this.value = 0;
                                }
                                break;
                            default:
                                this.value = newVal;
                        }
                    });
                    const val = enhancedElement.value;
                    if (val !== '') {
                        this.value = JSON.parse(val);
                    }
                }
                break;
            case 'time':
                {
                    propagator.addEventListener('dateTime', e => {
                        const newVal = e.detail.newVal;
                        switch (typeof newVal) {
                            case 'string':
                                try {
                                    this.value = new Date(newVal);
                                }
                                catch (e) {
                                    console.error(e);
                                }
                            default:
                                if (newVal instanceof Date) {
                                    this.value = newVal;
                                }
                        }
                    });
                    const val = enhancedElement.dateTime;
                    if (val !== '') {
                        try {
                            this.value = new Date(val);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
                break;
        }
        this.locale = enhancedElement.lang || defaultLocale;
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
const tagName = 'be-intl';
const ifWantsToBe = 'intl';
const upgrade = 'data,time,output';
const xe = new XE({
    config: {
        tagName,
        propDefaults: {
            ...propDefaults,
        },
        propInfo: {
            ...propInfo,
            value: {
                notify: {
                    dispatch: true
                }
            }
        },
        actions: {
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
register(ifWantsToBe, upgrade, tagName);
