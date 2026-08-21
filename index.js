/**
 * @format
 */

import {Buffer} from 'buffer';
import {AppRegistry} from 'react-native';
import App from './src/app/App';
import {name as appName} from './app.json';

global.Buffer = Buffer;

AppRegistry.registerComponent(appName, () => App);
