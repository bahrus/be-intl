import {BVAEndUserProps, BVAAllProps, BVAActions} from './ts-refs/be-value-added/types';
import {BEAllProps} from './ts-refs/be-enhanced/types';

export interface EndUserProps extends BVAEndUserProps{
    format?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions,
    locale?: string;
    observeAttr?: string;
    currency?: string;
}

export interface AllProps extends EndUserProps, BVAAllProps{
    attached?: boolean;
    intlDateFormat?: Intl.DateTimeFormat,
    intlNumberFormat: Intl.NumberFormat,
}

export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;


export interface Actions extends BVAActions {
    formatNumber(self: AP & BEAllProps): void;
    formatDate(self: this): void;
    onFormattingChange(self: this): PAP;
}