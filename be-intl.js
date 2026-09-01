// @ts-check
/** @import {Actions, PAP, AllProps, AP} from './types/be-intl/types' */;
/** @import {RoundaboutOptions} from './types/roundabout/types' */;
/** @import {ElementEnhancementGateway, SpawnContext} from './types/assign-gingerly/types' */;
/** @import {EMC} from './types/mount-observer/types' */;
/** @import {RAConfig} from './types/roundabout/types' */;

const defaultLocale = new Intl.NumberFormat().resolvedOptions().locale;

/** Semantic sugar attributes folded into `format`. */
const SEMANTIC_KEYS = ['style', 'currency', 'weekday', 'year', 'month', 'day'];

/**
 * @implements {Actions}
 */
class BeIntl {

    /**
     * @this {AllProps & Actions}
     * @param {Element & ElementEnhancementGateway} enhancedElement
     * @param {SpawnContext} ctx
     * @param {PAP} initVals
     */
    constructor(enhancedElement, ctx, initVals){
        this.init(this, enhancedElement, ctx, initVals);
    }

    /**
     * @param {AllProps} self
     * @param {Element & ElementEnhancementGateway} enhancedElement
     * @param {SpawnContext} ctx
     * @param {PAP} initVals
     */
    async init(self, enhancedElement, ctx, initVals){
        const {customData} = /** @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions>>} */ (ctx.emc);
        /**
         * @type {RoundaboutOptions}
         */
        const raOptions = {
            ...customData,
            vm: self,
            initialPropVals: {
                enhancedElement,
                ...customData?.defaultPropVals,
                ...initVals
            }
        };
        await (await import('roundabout-lib/roundabout.js')).roundabout(raOptions);
        self.initialized = true;
    }

    /**
     * Wire up live-update observation and resolve the locale.
     * @param {AP} self
     * @returns {Promise<PAP>}
     */
    async hydrate(self){
        const {enhancedElement} = self;
        if(enhancedElement instanceof HTMLElement){
            enhancedElement.ariaLive = 'polite';
        }

        // Re-format whenever the element's underlying value property changes.
        // <data>/<output> reflect through `value`, <time> through `dateTime`.
        const valueProp = enhancedElement.localName === 'time' ? 'dateTime' : 'value';
        const inference = await infer(enhancedElement);
        const propagator = await inference.getPropagator();
        propagator.addEventListener(valueProp, () => {
            self.value = readValue(enhancedElement);
        });

        // Opt-in: track lang changes.
        if(self.observeLang && enhancedElement instanceof HTMLElement){
            const langObserver = new MutationObserver(() => {
                self.locale = enhancedElement.lang || defaultLocale;
            });
            langObserver.observe(enhancedElement, {attributes: true, attributeFilter: ['lang']});
        }

        const locale = self.locale
            || (enhancedElement instanceof HTMLElement ? enhancedElement.lang : '')
            || defaultLocale;
        return {locale};
    }

    /**
     * (Re)build the Intl formatter and seed the current value.
     * @param {AP} self
     * @returns {PAP}
     */
    onFormattingChange(self){
        const {enhancedElement, locale} = self;
        // Explicit JSON (`self.format`) wins; semantic sub-attributes fill the gaps.
        const format = {.../** @type {Record<string, any>} */ (self.format || {})};
        for(const key of SEMANTIC_KEYS){
            const val = /** @type {Record<string, any>} */ (self)[key];
            if(val !== undefined && format[key] === undefined) format[key] = val;
        }
        const value = readValue(enhancedElement);
        if(enhancedElement.localName === 'time'){
            return {
                intlDateFormat: new Intl.DateTimeFormat(locale, /** @type {Intl.DateTimeFormatOptions} */ (format)),
                value,
                resolved: true,
            };
        }
        return {
            intlNumberFormat: new Intl.NumberFormat(locale, /** @type {Intl.NumberFormatOptions} */ (format)),
            value,
            resolved: true,
        };
    }

    /**
     * @param {AP} self
     */
    formatNumber(self){
        const {enhancedElement, value, intlNumberFormat} = self;
        if(intlNumberFormat === undefined || value === undefined || value === null){
            enhancedElement.textContent = '';
            return;
        }
        enhancedElement.textContent = intlNumberFormat.format(/** @type {number} */ (value));
    }

    /**
     * @param {AP} self
     */
    formatDate(self){
        const {enhancedElement, value, intlDateFormat} = self;
        if(intlDateFormat === undefined || value === undefined || value === null) return;
        enhancedElement.textContent = intlDateFormat.format(/** @type {Date} */ (value));
    }
}

/**
 * Pull a formattable value off the enhanced element.
 * `<time>` yields a Date parsed from its datetime; everything else yields a
 * number (when the raw value is numeric) or the raw string.
 * @param {Element} el
 * @returns {number | Date | string | undefined}
 */
function readValue(el){
    if(el.localName === 'time'){
        const raw = /** @type {HTMLTimeElement} */ (el).dateTime || el.getAttribute('datetime') || '';
        return raw ? new Date(raw) : undefined;
    }
    const raw = /** @type {any} */ (el).value;
    if(raw === undefined || raw === null || raw === '') return undefined;
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
}

/**
 * Resolve the `inferencer` enhancement instance for an element. Typed loosely
 * because the `types` submodule's `Infer` declaration currently lags the
 * published `inferencer` package (no `getPropagator` / `valueProperty` yet).
 * @param {Element & ElementEnhancementGateway} from
 * @returns {Promise<any>}
 */
async function infer(from){
    return /** @type {any} */ (
        from.enh.get((await import('inferencer/inferencer.js')).registryItem)
    );
}

export { BeIntl };
