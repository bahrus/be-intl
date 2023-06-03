import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { BEConfig, EnhancementInfo } from 'be-enhanced/types';
import { XE } from 'xtal-element/XE.js';
import { Actions, AllProps, AP, PAP, ProPAP } from './types';
import { register } from 'be-hive/register.js';
import { AP as bePropagatingAP } from 'be-propagating/types.js';
import { ProxyPropChangeInfo } from 'trans-render/lib/types';

export class BeIntl extends BE<AP, Actions, HTMLDataElement | HTMLTimeElement | HTMLOutputElement> implements Actions {
    static override get beConfig() {
        return {
            parse: true,
            primaryProp: 'format',
            primaryPropReq: true,
        } as BEConfig
    }

    override  async attach(enhancedElement: HTMLDataElement | HTMLTimeElement | HTMLOutputElement, enhancementInfo: EnhancementInfo): Promise<void> {
        await super.attach(enhancedElement, enhancementInfo);
        import('be-propagating/be-propagating.js');
        const base = await (<any>enhancedElement).beEnhanced.whenResolved('be-propagating') as bePropagatingAP;
        const propagator = base.propagators!.get('self')!

        propagator.addEventListener('lang', e => {
            this.locale = ((e as CustomEvent).detail as ProxyPropChangeInfo).newVal;
        });
        switch (enhancedElement.localName) {
            case 'data':
            case 'output': {
                propagator.addEventListener('value', e => {
                    const newVal = ((e as CustomEvent).detail as ProxyPropChangeInfo).newVal;
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
                const val = (enhancedElement as HTMLDataElement | HTMLOutputElement).value;
                if (val !== '') {
                    this.value = JSON.parse(val);
                }
            }
            break;
            case 'time':{
                propagator.addEventListener('dateTime', e => {
                    const newVal = ((e as CustomEvent).detail as ProxyPropChangeInfo).newVal;
                    switch (typeof newVal) {
                        case 'string':
                            try {
                                this.value = new Date(newVal);
                            } catch (e) {
                                console.error(e);
                            }
                        default:
                            if (newVal instanceof Date) {
                                this.value = newVal;
                            }
                    }
                });
                const val = (enhancedElement as HTMLTimeElement).dateTime;
                if(val !== ''){
                    try {
                        this.value = new Date(val);
                    } catch (e) {
                        console.error(e);
                    }
                }
            }
            break;
        }
        this.locale = enhancedElement.lang || defaultLocale;
    }

    formatNumber(self: this): void {
        const {enhancedElement, value} = self;
        if(value === undefined){
            enhancedElement.textContent = '';
            return;
        }
        const {intlNumberFormat} = self;
        enhancedElement.textContent = intlNumberFormat!.format(value as number);

    }

    formatDate(self: this): void {
        const {enhancedElement, value, intlNumberFormat} = self;
        enhancedElement.textContent = this.intlDateFormat!.format(value as Date);
    }

    onFormattingChange(self: this): PAP {
        const {enhancedElement, locale, format} = self;
        switch(enhancedElement.localName){
            case 'time':
                return {
                    intlDateFormat: new Intl.DateTimeFormat(locale, format as Intl.DateTimeFormatOptions),
                    resolved: true
                } 
            default:
                return {
                    intlNumberFormat: new Intl.NumberFormat(locale, format as Intl.NumberFormatOptions),
                    resolved: true
                }
        }
    }
}

const defaultLocale = new Intl.NumberFormat().resolvedOptions().locale;

export interface BeIntl extends AllProps { }

const tagName = 'be-intl';
const ifWantsToBe = 'intl';
const upgrade = 'data,time,output';

const xe = new XE<AP, Actions>({
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
            onFormattingChange:{
                ifAllOf: ['locale'],
                ifKeyIn: ['format']
            }
        }
    },
    superclass: BeIntl
});

register(ifWantsToBe, upgrade, tagName);

