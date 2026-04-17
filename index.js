// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */

/** @typedef {import('./src/usdt0-protocol-evm.js').BridgeOptions} BridgeOptions */

/** @typedef {import('./src/lifi-protocol-evm.js').BridgeOptions} LifiBridgeOptions */

/** @typedef {import('./src/lifi-protocol-evm.js').LifiBridgeProtocolConfig} LifiBridgeProtocolConfig */

/** @typedef {import('./src/lifi-protocol-evm.js').LifiBridgeResult} LifiBridgeResult */

// Default export preserved for backwards compatibility
export { default } from './src/usdt0-protocol-evm.js'

export { default as Usdt0ProtocolEvm } from './src/usdt0-protocol-evm.js'

export { default as LifiProtocolEvm } from './src/lifi-protocol-evm.js'
