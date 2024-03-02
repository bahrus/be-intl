import { register } from 'be-hive/register.js';
import { tagName } from './be-intl.js';
import './be-intl.js';
const ifWantsToBe = 'intl';
const upgrade = 'data,time,output';
register(ifWantsToBe, upgrade, tagName);
