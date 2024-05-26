import {config as beCnfg} from 'be-enhanced/config.js';
import {BE, BEConfig} from 'be-enhanced/BE.js';
import {Actions, AllProps, AP, ProPAP, PAP} from './types';
import {IEnhancement,  BEAllProps} from 'trans-render/be/types';
import {BeValueAdded} from 'be-value-added/be-value-added.js';
export class BeIntl extends BeValueAdded implements Actions{
    static override config: BEConfig<AP & BEAllProps, Actions & IEnhancement, any> = {
        propInfo: {
            ...(super.config.propInfo),
            locale:{}
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
            onFormattingChange:{
                ifAllOf: ['locale'],
                ifKeyIn: ['format']
            }
        },
        positractions: [
            ...(super.config.positractions)
        ]
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



export interface BeIntl extends AllProps { }