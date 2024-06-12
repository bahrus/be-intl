import {BeHive, MountObserver, EMC, seed} from 'be-hive/be-hive.js';


const defaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
export const emc: EMC = {
    base: 'be-intl',
    branches: ['', 'style', 'currency', ],
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