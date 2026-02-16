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

import { BridgeProtocol } from '@tetherto/wdk-wallet/protocols'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import { WalletAccountEvmErc4337, WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337'

import { addressToBytes32, Options } from '@layerzerolabs/lz-v2-utilities'
import { JsonRpcProvider, BrowserProvider, Contract, getBytes, decodeBase58, zeroPadValue, toBeHex } from 'ethers'
import { Address } from '@ton/core'
import { TronWeb } from 'tronweb'

import { OFT_ABI, TRANSACTION_VALUE_HELPER_ABI } from './abi.js'

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountReadOnlyEvm} WalletAccountReadOnlyEvm */

/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletConfig} EvmErc4337WalletConfig */

/**
 * @typedef {object} EvmBridgeOptions
 * @property {string} targetChain - The identifier of the destination blockchain (e.g., "arbitrum").
 * @property {string} recipient - The address of the recipient.
 * @property {string} token - The address of the token to bridge.
 * @property {number | bigint} amount - The amount of tokens to bridge to the destination chain (in base unit).
 * @property {string} [oftContractAddress] - Custom OFT contract address to use instead of auto-resolving from the source chain.
 * @property {number} [dstEid] - Custom LayerZero destination endpoint ID to override the default for the target chain.
 */

/**
 * @typedef {object} EvmBridgeConfig
 * @property {{ address: string }} [paymasterToken] - The paymaster token configuration.
 * @property {number | bigint} [bridgeMaxFee] - The maximum fee amount for bridge operations.
 */

const FEE_TOLERANCE = 999n

const BLOCKCHAINS = {
  ethereum: {
    oftContract: '0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee',
    legacyMeshContract: '0x1F748c76dE468e9D11bd340fA9D5CBADf315dFB0',
    xautOftContract: '0xb9c2321BB7D0Db468f570D10A424d1Cc8EFd696C',
    eid: 30_101,
    chainId: 1
  },
  arbitrum: {
    oftContract: '0x14E4A1B13bf7F943c8ff7C51fb60FA964A298D92',
    legacyMeshContract: '0x77652D5aba086137b595875263FC200182919B92',
    xautOftContract: '0xf40542a7B66AD7C68C459EE3679635D2fDB6dF39',
    transactionValueHelper: '0xa90f03c856D01F698E7071B393387cd75a8a319A',
    eid: 30_110,
    chainId: 42_161
  },
  berachain: {
    oftContract: '0x3Dc96399109df5ceb2C226664A086140bD0379cB',
    eid: 30_362,
    chainId: 80_094
  },
  conflux: {
    oftContract: '0xC57efa1c7113D98BdA6F9f249471704Ece5dd84A',
    eid: 30_212,
    chainId: 1_030
  },
  corn: {
    oftContract: '0x3f82943338a8a76c35BFA0c1828aA27fd43a34E4',
    eid: 30_331,
    chainId: 21_000_000
  },
  flare: {
    oftContract: '0x567287d2A9829215a37e3B88843d32f9221E7588',
    eid: 30_295,
    chainId: 14
  },
  hyperevm: {
    oftContract: '0x904861a24F30EC96ea7CFC3bE9EA4B476d237e98',
    xautOftContract: '0x4E41cfc3F3B19E29E323D2c36F8f202a1e151dAF',
    eid: 30_367,
    chainId: 999
  },
  ink: {
    oftContract: '0x1cB6De532588fCA4a21B7209DE7C456AF8434A65',
    xautOftContract: '0xA1bE1572B4beef24f812EfDc58bdc41D56a0dAB2',
    eid: 30_339,
    chainId: 57_073
  },
  mantle: {
    oftContract: '0xcb768e263FB1C62214E7cab4AA8d036D76dc59CC',
    eid: 30_181,
    chainId: 5_000
  },
  megaeth: {
    oftContract: '0x9151434b16b9763660705744891fa906f660ecc5',
    eid: 30_398,
    chainId: 4_326
  },
  monad: {
    oftContract: '0x9151434b16b9763660705744891fA906F660EcC5',
    xautOftContract: '0x21cAef8A43163Eea865baeE23b9C2E327696A3bf',
    eid: 30_390,
    chainId: 143
  },
  morph: {
    oftContract: '0xcb768e263FB1C62214E7cab4AA8d036D76dc59CC',
    eid: 30_322,
    chainId: 2_818
  },
  optimism: {
    oftContract: '0xF03b4d9AC1D5d1E7c4cEf54C2A313b9fe051A0aD',
    eid: 30_111,
    chainId: 10
  },
  plasma: {
    oftContract: '0x02ca37966753bDdDf11216B73B16C1dE756A7CF9',
    xautOftContract: '0x63aB93cBC9d4ecD9c4947b1A38F458147C08E6F7',
    eid: 30_383,
    chainId: 9_745
  },
  polygon: {
    oftContract: '0x6BA10300f0DC58B7a1e4c0e41f5daBb7D7829e13',
    xautOftContract: '0x5421Cf4288d8007D3c43AC4246eaFCe5b049e352',
    eid: 30_109,
    chainId: 137
  },
  rootstock: {
    oftContract: '0x1a594d5d5d1c426281C1064B07f23F57B2716B61',
    eid: 30_333,
    chainId: 30
  },
  sei: {
    oftContract: '0x56Fe74A2e3b484b921c447357203431a3485CC60',
    eid: 30_280,
    chainId: 1_329
  },
  stable: {
    oftContract: '0xedaba024be4d87974d5aB11C6Dd586963CcCB027',
    xautOftContract: '0xD8479f87686ed263D00Ca7505F86327dbeD4171A',
    eid: 30_396,
    chainId: 988
  },
  unichain: {
    oftContract: '0xc07bE8994D035631c36fb4a89C918CeFB2f03EC3',
    eid: 30_320,
    chainId: 130
  },
  xlayer: {
    oftContract: '0x94bcca6bdfd6a61817ab0e960bfede4984505554',
    eid: 30_274,
    chainId: 196
  },
  avalanche: {
    xautOftContract: '0x7E7866bc840aFf9f517a49AfDbfC9e7C7Aba9a68',
    eid: 30_106,
    chainId: 43_114
  },
  celo: {
    legacyMeshContract: '0xf10E161027410128E63E75D0200Fb6d34b2db243',
    xautOftContract: '0x21caef8a43163eea865baee23b9c2e327696a3bf',
    eid: 30_125,
    chainId: 42_220
  },
  solana: {
    eid: 30_168,
    chainId: 30_168
  },
  ton: {
    eid: 30_343,
    chainId: 30_343
  },
  tron: {
    eid: 30_420,
    chainId: 728_126_428
  }
}

export default class Usdt0ProtocolEvm extends BridgeProtocol {
  /**
   * Creates a new read-only interface to the usdt0 protocol for evm blockchains.
   *
   * @overload
   * @param {WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337} account - The wallet account to use to interact with the protocol.
   * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
   */

  /**
   * Creates a new interface to the usdt0 protocol for evm blockchains.
   *
   * @overload
   * @param {WalletAccountEvm | WalletAccountEvmErc4337} account - The wallet account to use to interact with the protocol.
   * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
   */
  constructor (account, config = {}) {
    super(account, config)

    /** @private */
    this._chainId = undefined

    if (account._config.provider) {
      const { provider } = account._config

      /** @private */
      this._provider = typeof provider === 'string'
        ? new JsonRpcProvider(provider)
        : new BrowserProvider(provider)
    }
  }

  /**
   * Bridges a token to a different blockchain.
   *
   * Users must first approve the necessary amount of tokens to the usdt0 protocol using the {@link WalletAccountEvm#approve} or the {@link WalletAccountEvmErc4337#approve} method.
   *
   * @param {EvmBridgeOptions} options - The bridge's options. Optionally pass
   *   'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to override
   *   the destination endpoint id.
   * @param {EvmBridgeConfig} [config] - If the protocol has been initialized with an erc-4337 wallet account, overrides the
   *   'paymasterToken' option defined in its configuration and the 'bridgeMaxFee' option defined in the protocol configuration.
   * @returns {Promise<BridgeResult>} The bridge's result.
   */
  async bridge (options, config) {
    if (!(this._account instanceof WalletAccountEvm) && !(this._account instanceof WalletAccountEvmErc4337)) {
      throw new Error("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
    }

    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to perform bridge operations.')
    }

    const { oftTx, bridgeFee } = await this._getBridgeTransactions({ ...options, amount: BigInt(options.amount) })

    if (this._account instanceof WalletAccountEvmErc4337) {
      const { bridgeMaxFee } = config ?? this._config

      const { fee } = await this._account.quoteSendTransaction([oftTx], config)

      if (bridgeMaxFee !== undefined && fee + bridgeFee >= bridgeMaxFee) {
        throw new Error('Exceeded maximum fee cost for bridge operation.')
      }

      const { hash } = await this._account.sendTransaction([oftTx], config)

      return { hash, fee, bridgeFee }
    }

    const { fee } = await this._account.quoteSendTransaction(oftTx)

    if (this._config.bridgeMaxFee !== undefined && fee + bridgeFee >= this._config.bridgeMaxFee) {
      throw new Error('Exceeded maximum fee cost for bridge operation.')
    }

    const { hash } = await this._account.sendTransaction(oftTx)

    return { hash, fee, bridgeFee }
  }

  /**
   * Quotes the costs of a bridge operation.
   *
   * Users must first approve the necessary amount of tokens to the usdt0 protocol using the {@link WalletAccountEvm#approve} or the {@link WalletAccountEvmErc4337#approve} method.
   *
   * @param {EvmBridgeOptions} options - The bridge's options. Optionally pass
   *   'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to override
   *   the destination endpoint id.
   * @param {Omit<EvmBridgeConfig, 'bridgeMaxFee'>} [config] - If the protocol has been initialized with an erc-4337
   *   wallet account, overrides the 'paymasterToken' option defined in its configuration.
   * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
   */
  async quoteBridge (options, config) {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to quote bridge operations.')
    }

    const { oftTx, bridgeFee } = await this._getBridgeTransactions({ ...options, amount: BigInt(options.amount) })

    if (this._account instanceof WalletAccountReadOnlyEvmErc4337) {
      const { fee } = await this._account.quoteSendTransaction([oftTx], config)

      return { fee, bridgeFee }
    }

    const { fee } = await this._account.quoteSendTransaction(oftTx)

    return { fee, bridgeFee }
  }

  /** @private */
  async _getChainId () {
    if (!this._chainId) {
      const network = await this._provider.getNetwork()

      this._chainId = Number(network.chainId)
    }

    return this._chainId
  }

  /** @private */
  async _getBridgeTransactions ({ targetChain, recipient, token, amount, oftContractAddress, dstEid }) {
    const address = await this._account.getAddress()

    let oftContract

    if (oftContractAddress) {
      oftContract = new Contract(oftContractAddress, OFT_ABI, this._provider)
    } else {
      oftContract = await this._getOftContract(targetChain, token)
    }

    if (!oftContract) {
      throw new Error(`Token '${token}' not supported on this chain.`)
    }

    const sendParam = this._buildOftSendParam(targetChain, recipient, amount, dstEid)

    if (this._account instanceof WalletAccountEvmErc4337) {
      const transactionValueHelper = await this._getTransactionValueHelperContract()

      const { nativeFee, lzTokenFee } = await oftContract.quoteSend(sendParam, false)

      const bridgeFee = await transactionValueHelper.quoteSend(sendParam, [nativeFee, lzTokenFee])

      const fee = { nativeFee, lzTokenFee: 0 }

      const oftTx = {
        to: transactionValueHelper.target,
        value: 0,
        data: transactionValueHelper.interface.encodeFunctionData('send', [oftContract.target, sendParam, fee])
      }

      return { oftTx, bridgeFee }
    }

    const { nativeFee: bridgeFee } = await oftContract.quoteSend(sendParam, false)

    const fee = { nativeFee: bridgeFee, lzTokenFee: 0 }

    const oftTx = {
      to: oftContract.target,
      value: bridgeFee,
      data: oftContract.interface.encodeFunctionData('send', [sendParam, fee, address])
    }

    return { oftTx, bridgeFee }
  }

  /** @private */
  async _getOftContract (targetChain, token) {
    if (!BLOCKCHAINS[targetChain]) {
      throw new Error(`Target chain '${targetChain}' not supported.`)
    }

    const configuration = await this._getSourceChainConfiguration()

    if (!configuration) {
      throw new Error(`Source chain with id '${configuration.chainId}' not supported.`)
    }

    if (configuration.chainId === BLOCKCHAINS[targetChain].chainId) {
      throw new Error('The target chain cannot be equal to the source chain.')
    }

    for (const key of ['oftContract', 'legacyMeshContract', 'xautOftContract']) {
      if (key === 'oftContract' && ['solana', 'ton', 'tron'].includes(targetChain)) {
        continue
      }

      if (configuration[key]) {
        const contract = new Contract(configuration[key], OFT_ABI, this._provider)

        const contractToken = await contract.token()

        if (contractToken.toLowerCase() === token.toLowerCase()) {
          return contract
        }
      }
    }

    return null
  }

  /** @private */
  async _getSourceChainConfiguration () {
    const chainId = await this._getChainId()

    for (const blockchain of Object.values(BLOCKCHAINS)) {
      if (blockchain.chainId === chainId) {
        return blockchain
      }
    }

    return null
  }

  /** @private */
  _buildOftSendParam (targetChain, recipient, amount, dstEidOverride) {
    const options = Options.newOptions()

    let to

    if (targetChain === 'ton') {
      to = '0x' + Address.parse(recipient).toRawString().slice(2)
    } else if (targetChain === 'tron') {
      to = addressToBytes32('0x' + TronWeb.address.toHex(recipient))
    } else if (targetChain === 'solana') {
      to = zeroPadValue(toBeHex(decodeBase58(recipient)), 32)
    } else {
      to = addressToBytes32(recipient)
    }

    return {
      dstEid: dstEidOverride ?? BLOCKCHAINS[targetChain].eid,
      to,
      amountLD: amount,
      minAmountLD: amount * FEE_TOLERANCE / 1_000n,
      extraOptions: options.toBytes(),
      composeMsg: getBytes('0x'),
      oftCmd: getBytes('0x')
    }
  }

  /** @private */
  async _getTransactionValueHelperContract () {
    const configuration = await this._getSourceChainConfiguration()

    if (!configuration?.transactionValueHelper) {
      throw new Error(`Erc-4337 account abstraction not supported on chain with id ${configuration.chainId}.`)
    }

    const contract = new Contract(configuration.transactionValueHelper, TRANSACTION_VALUE_HELPER_ABI, this._provider)

    return contract
  }
}
