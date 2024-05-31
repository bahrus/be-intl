import {BeHive, EnhancementMountCnfg} from 'be-hive/be-hive.js';
import {MountObserver, MOSE} from 'mount-observer/MountObserver.js';

const base = 'be-intl';

const defaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
export const emc: EnhancementMountCnfg = {
    base,
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
        const {BeIntl} = await import('./behance.js');
        return BeIntl;
    }
};

const mose = document.createElement('script') as MOSE<EnhancementMountCnfg>;
mose.id = base;
mose.synConfig = emc;

MountObserver.synthesize(document, BeHive, mose);