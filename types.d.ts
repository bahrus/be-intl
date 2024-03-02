import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE, Declarations} from 'be-enhanced/types';
import {BVAEndUserProps, BVAAllProps} from 'be-value-added/types';

export interface EndUserProps extends BVAEndUserProps{
    format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions,
    locale?: string;
    observeAttr?: string;
}

export interface AllProps extends EndUserProps, BVAAllProps{
    intlDateFormat?: Intl.DateTimeFormat,
    intlNumberFormat?: Intl.NumberFormat,
}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>];

export interface Actions{
    formatNumber(self: this): void;
    formatDate(self: this): void;
    onFormattingChange(self: this): PAP;
}