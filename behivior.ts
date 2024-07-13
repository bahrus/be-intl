import {BeHive, MountObserver, EMC, seed} from 'be-hive/be-hive.js';


const defaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
export const emc: EMC = {
    base: 'be-intl',
    branches: ['', 'style', 'currency', 'weekday', 'year', 'month', 'day'],
    map: {
        '0.0': {
            instanceOf: 'Object',
            mapsTo: 'format',
            valIfFalsy: {},
        },
        '1.0': {
            instanceOf: 'String',
            mapsTo: '?.format?.style'
        },
        '2.0': {
            instanceOf: 'String',
            mapsTo: '?.format?.currency'
        },
        '3.0': {
            instanceOf: 'String',
            mapsTo: '?.format?.weekday'
        },
        '4.0': {
            instanceOf: 'String',
            mapsTo: '?.format?.year'
        },
        '5.0': {
            instanceOf: 'String',
            mapsTo: '?.format?.month'
        },
        '6.0': {
            instanceOf: 'String',
            mapsTo: '?.format?.day'
        }
    },
    osotas: [
        {
            name: 'lang',
            valIfNull: defaultLocale,
            mapsTo: 'locale',
        }
    ],
    enhPropKey: 'beIntl',
    importEnh: async () => {
        const {BeIntl} = await import('./be-intl.js');
        return BeIntl;
    }
};

const mose = seed(emc);

MountObserver.synthesize(document, BeHive, mose);