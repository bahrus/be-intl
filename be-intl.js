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
     * Wire up live-update observation, resolve the locale, and seed the value.
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

        // Snapshot the initial reads now, before the next `await`. `inference.value`
        // and `inference.lang` resolve their element through an internal WeakRef; on
        // a slow first load a GC during the dynamic import inside `getPropagator()`
        // can clear it, so a later read yields `undefined` (seen only on cold CI).
        const initialValue = inference.value;
        const initialLang = inference.lang;

        const propagator = await inference.getPropagator();
        propagator.addEventListener(valueProp, () => {
            self.value = inference.value;
        });

        // Opt-in: track lang changes on the element itself. Container-`lang`
        // changes after mount aren't observed (rare); `inference.lang` still
        // walks ancestors + shadow hosts on each read.
        if(self.observeLang && enhancedElement instanceof HTMLElement){
            const langObserver = new MutationObserver(() => {
                self.locale = inference.lang || defaultLocale;
            });
            langObserver.observe(enhancedElement, {attributes: true, attributeFilter: ['lang']});
        }

        const locale = self.locale || initialLang || defaultLocale;
        return {locale, value: initialValue};
    }

    /**
     * (Re)build the Intl formatter. `value` is seeded by `hydrate` and kept
     * fresh by the propagator, so it isn't read here.
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
        if(enhancedElement.localName === 'time'){
            return {
                intlDateFormat: new Intl.DateTimeFormat(locale, /** @type {Intl.DateTimeFormatOptions} */ (format)),
                resolved: true,
            };
        }
        return {
            intlNumberFormat: new Intl.NumberFormat(locale, /** @type {Intl.NumberFormatOptions} */ (format)),
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
 * Resolve the `inferencer` enhancement instance for an element. Typed loosely
 * (`Promise<any>`) so the class doesn't couple to the `Infer` shape; `.value`
 * is a live, type-coerced read (`Date` for `<time>`, `number` for `<data>`),
 * `getPropagator()` emits on value-property changes.
 * @param {Element & ElementEnhancementGateway} from
 * @returns {Promise<any>}
 */
async function infer(from){
    return /** @type {any} */ (
        from.enh.get((await import('inferencer/inferencer.js')).registryItem)
    );
}

export { BeIntl };
