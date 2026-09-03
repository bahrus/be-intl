// @ts-check

/** @import {EMC} from './types/mount-observer/types' */;
/** @import {AllProps, Actions} from './types/be-intl/types' */
/** @import {RAConfig} from './types/roundabout/types' */

/**
 * @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions> >}
 */
export const emc = {
    enhConfig: {
        enhKey: 'BeIntl',
        spawn: 'be-intl/be-intl.js',
        withAttrs: {
            base: 'be-intl',
            // `be-intl='{ "style": "currency", "currency": "EUR" }'` — JSON object into `format`
            _base: {
                mapsTo: 'format',
                instanceOf: 'Object',
                valIfNull: {},
            },
            // Semantic sugar attributes land on top-level props; `onFormattingChange`
            // folds them into a copy of `format`. Kept flat (not `?.format?.x`) so the
            // order attributes are applied in cannot clobber the parsed JSON object.
            style: '${base}-style',
            currency: '${base}-currency',
            weekday: '${base}-weekday',
            year: '${base}-year',
            month: '${base}-month',
            day: '${base}-day',
            // Opt-in: re-derive locale when the element's lang attribute changes.
            observeLang: '${base}-observe-lang',
            _observeLang: { instanceOf: 'Boolean' },
            // Opt-in: announce re-formats to assistive tech (polite live region).
            announce: '${base}-announce',
            _announce: { instanceOf: 'Boolean' },
        }
    },
    customData: {
        weakRef: {
            properties: ['enhancedElement']
        },
        actions: {
            // Runs once, after every attribute has been read (see `initialized`).
            hydrate: {
                ifAllOf: ['enhancedElement', 'initialized'],
                ifKeyIn: ['initialized'],
            },
            // (Re)build the Intl formatter whenever locale or format settings change.
            onFormattingChange: {
                ifAllOf: ['locale', 'initialized'],
                ifKeyIn: ['locale', 'format', 'initialized'],
            },
            // Re-render textContent when the element's value changes.
            formatNumber: {
                ifAllOf: ['intlNumberFormat'],
                ifKeyIn: ['value', 'intlNumberFormat'],
            },
            formatDate: {
                ifAllOf: ['intlDateFormat'],
                ifKeyIn: ['value', 'intlDateFormat'],
            },
            // `be-intl-announce` only: arm the live region once, after the first
            // render (`rendered` is set by formatNumber/formatDate on first write).
            armLiveRegion: {
                ifAllOf: ['announce', 'rendered'],
                ifKeyIn: ['rendered'],
            },
        },
    }
}

export function render(){
    return JSON.stringify(emc, null, 4);
}

console.log(render());
