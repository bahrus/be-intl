import { BeHive } from 'be-hive/be-hive.js';
import { MountObserver } from 'mount-observer/MountObserver.js';
const base = 'be-intl';
const defaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
export const emc = {
    base,
    branches: ['', 'style', 'currency',],
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
        const { BeIntl } = await import('./behance.js');
        return BeIntl;
    }
};
const mose = document.createElement('script');
mose.id = base;
mose.synConfig = emc;
MountObserver.synthesize(document, BeHive, mose);
