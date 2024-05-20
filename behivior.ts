import './behance.js';
import {BeHive} from 'be-hive/be-hive.js';

BeHive.registry.register({
    base: 'be-intl',
    enhPropKey: 'beIntl',
    map: {
        
    },
    do: {
        mount:{
            import: async() => {
                const {BeIntl} = await import('./be-intl.js');
                return BeIntl;
            }
        }
    }
});