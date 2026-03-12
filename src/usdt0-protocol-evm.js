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
import { FEE_TOLERANCE, BLOCKCHAINS } from './config.js'

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountReadOnlyEvm} WalletAccountReadOnlyEvm */

/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletPaymasterTokenConfig} EvmErc4337WalletPaymasterTokenConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletSponsorshipPolicyConfig} EvmErc4337WalletSponsorshipPolicyConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletNativeCoinsConfig} EvmErc4337WalletNativeCoinsConfig */

/**
 * @typedef {object} BridgeOptions
 * @property {string} targetChain - The identifier of the destination blockchain (e.g., "arbitrum").
 * @property {string} recipient - The address of the recipient.
 * @property {string} token - The address of the token to bridge.
 * @property {number | bigint} amount - The amount of tokens to bridge to the destination chain (in base unit).
 * @property {string} [oftContractAddress] - Custom OFT contract address to use instead of auto-resolving from the source chain.
 * @property {number} [dstEid] - Custom LayerZero destination endpoint ID to override the default for the target chain.
 */

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
   * @param {BridgeOptions} options - The bridge's options. Optionally pass 'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to
   *   override the destination endpoint id.
   * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<BridgeProtocolConfig, 'bridgeMaxFee'>} [config] - If
   *   the protocol has been initialized with an erc-4337 wallet account, it can be used to override its configuration options along with the 'bridgeMaxFee' option.
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
      const { bridgeMaxFee } = { ...this._config, ...config }

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
   * @param {BridgeOptions} options - The bridge's options. Optionally pass 'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to
   *   override the destination endpoint id.
   * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig>} [config] - If the protocol has been initialized with
   *   an erc-4337 wallet account, it can be used to override its configuration options.
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
