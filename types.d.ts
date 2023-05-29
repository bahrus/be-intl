import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE, Declarations} from 'be-enhanced/types';

export interface EndUserProps extends IBE<HTMLDataElement | HTMLTimeElement | HTMLOutputElement>{
    format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions,
    value?: number | Date;
    locale?: string;
}

export interface AllProps extends EndUserProps{
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