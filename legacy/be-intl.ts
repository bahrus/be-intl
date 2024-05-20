import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { BEConfig, EnhancementInfo } from 'be-enhanced/types';
import { XE } from 'xtal-element/XE.js';
import { Actions, AllProps, AP, PAP, ProPAP } from '../types';
import { AP as bePropagatingAP } from 'be-propagating/types.js';
import { ProxyPropChangeInfo } from 'trans-render/lib/types';
import {BeValueAdded, beValueAddedActions, beValueAddedPropDefaults, beValueAddedPropInfo} from 'be-value-added/be-value-added.js';

export class BeIntl extends BeValueAdded{
    static override get beConfig() {
        return {
            parse: true,
            primaryProp: 'format',
            primaryPropReq: true,
        } as BEConfig
    }

    #langObserver: MutationObserver | undefined;
    override hydrate(self: this){
        const {enhancedElement} = self;
        const returnObj = super.hydrate(self) as PAP;
        if(!(enhancedElement instanceof HTMLElement)) return returnObj;
        
        const {observeAttr} = self;
        if(observeAttr){
            
            const mutOptions: MutationObserverInit = {
                attributeFilter: ['lang'],
                attributes: true
            };
            self.#langObserver = new MutationObserver((/*mutations: MutationRecord[]*/) => {
                self.locale = enhancedElement.lang  || defaultLocale;;
            });
            
            self.#langObserver.observe(enhancedElement, mutOptions);
        }
        returnObj.locale = enhancedElement.lang  || defaultLocale;
        delete returnObj.resolved;
        return returnObj;
    }

    override detach(detachedElement: HTMLLinkElement | HTMLMetaElement | HTMLDataElement | HTMLTimeElement | HTMLOutputElement): void {
        super.detach(detachedElement);
        if(this.#langObserver !== undefined) this.#langObserver.disconnect();
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

export const tagName = 'be-intl';


const xe = new XE<AP, Actions>({
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
            onFormattingChange:{
                ifAllOf: ['locale'],
                ifKeyIn: ['format']
            }
        }
    },
    superclass: BeIntl
});
