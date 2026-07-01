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
import { JsonRpcProvider, BrowserProvider, Contract, getBytes } from 'ethers'
import { Address } from '@ton/core'
import { TronWeb } from 'tronweb'

import { ERC20_ABI, OFT_ABI, TRANSACTION_VALUE_HELPER_ABI } from './abi.js'

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeOptions} BridgeOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountReadOnlyEvm} WalletAccountReadOnlyEvm */

/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletConfig} EvmErc4337WalletConfig */

const FEE_TOLERANCE = 999n
const APPROVE_FEE_TOLERANCE = 120n

const BLOCKCHAINS = {
  ethereum: {
    oftContract: '0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee',
    legacyMeshContract: '0x811ed79dB9D34E83BDB73DF6c3e07961Cfb0D5c0',
    xautOftContract: '0xb9c2321BB7D0Db468f570D10A424d1Cc8EFd696C',
    eid: 30_101,
    chainId: 1
  },
  arbitrum: {
    oftContract: '0x14E4A1B13bf7F943c8ff7C51fb60FA964A298D92',
    legacyMeshContract: '0x238A52455a1EF6C987CaC94b28B4081aFE50ba06',
    xautOftContract: '0xf40542a7B66AD7C68C459EE3679635D2fDB6dF39',
    transactionValueHelper: '0xa90f03c856D01F698E7071B393387cd75a8a319A',
    eid: 30_110,
    chainId: 42_161
  },
  polygon: {
    xautOftContract: '0x5421Cf4288d8007D3c43AC4246eaFCe5b049e352',
    eid: 30_109,
    chainId: 137
  },
  berachain: {
    oftContract: '0x779Ded0c9e1022225f8E0630b35a9b54bE713736',
    eid: 30_362,
    chainId: 80_094
  },
  ink: {
    oftContract: '0x0200C29006150606B650577BBE7B6248F58470c1',
    eid: 30_339,
    chainId: 57_073
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
   * For standard (non erc-4337) accounts, users must first approve the necessary amount of tokens to the usdt0 protocol
   * using the {@link WalletAccountEvm#approve} method. For erc-4337 accounts the approval is bundled into the same user
   * operation as the bridge, so no prior approval is required.
   *
   * @param {BridgeOptions} options - The bridge's options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'> & Pick<BridgeProtocolConfig, 'bridgeMaxFee'>} [config] - If the protocol has
   *   been initialized with an erc-4337 wallet account, overrides the 'paymasterToken' option defined in its configuration and the
   *   'bridgeMaxFee' option defined in the protocol configuration.
   * @returns {Promise<BridgeResult>} The bridge's result.
   */
  async bridge (options, config) {
    if (!(this._account instanceof WalletAccountEvm) && !(this._account instanceof WalletAccountEvmErc4337)) {
      throw new Error("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
    }

    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to perform bridge operations.')
    }

    const { oftTx, approveTx, bridgeFee } = await this._getBridgeTransactions({ ...options, amount: BigInt(options.amount) })

    if (this._account instanceof WalletAccountEvmErc4337) {
      const { bridgeMaxFee } = config ?? this._config

      const { fee } = await this._account.quoteSendTransaction([approveTx, oftTx], config)

      if (bridgeMaxFee !== undefined && fee + bridgeFee >= bridgeMaxFee) {
        throw new Error('Exceeded maximum fee cost for bridge operation.')
      }

      const { hash } = await this._account.sendTransaction([approveTx, oftTx], config)

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
   * For standard (non erc-4337) accounts, users must first approve the necessary amount of tokens to the usdt0 protocol
   * using the {@link WalletAccountEvm#approve} method, otherwise the quote will fail. For erc-4337 accounts the approval
   * is bundled into the simulated user operation, so quoting works without a prior approval.
   *
   * @param {BridgeOptions} options - The bridge's options.
   * @param {Pick<EvmErc4337WalletConfig, 'paymasterToken'>} [config] - If the protocol has been initialized with an erc-4337
   *   wallet account, overrides the 'paymasterToken' option defined in its configuration.
   * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
   */
  async quoteBridge (options, config) {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to quote bridge operations.')
    }

    const { oftTx, approveTx, bridgeFee } = await this._getBridgeTransactions({ ...options, amount: BigInt(options.amount) })

    if (this._account instanceof WalletAccountReadOnlyEvmErc4337) {
      const { fee } = await this._account.quoteSendTransaction([approveTx, oftTx], config)

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
  async _getBridgeTransactions ({ targetChain, recipient, token, amount }) {
    const address = await this._account.getAddress()

    const oftContract = await this._getOftContract(targetChain, token)

    if (!oftContract) {
      throw new Error(`Token '${token}' not supported on this chain.`)
    }

    const sendParam = this._buildOftSendParam(targetChain, recipient, amount)

    if (this._account instanceof WalletAccountReadOnlyEvmErc4337) {
      const transactionValueHelper = await this._getTransactionValueHelperContract()

      const { nativeFee, lzTokenFee } = await oftContract.quoteSend(sendParam, false)

      const bridgeFee = await transactionValueHelper.quoteSend(sendParam, [nativeFee, lzTokenFee])

      const fee = { nativeFee, lzTokenFee: 0 }

      const tokenAddress = await oftContract.token()

      const erc20Contract = new Contract(tokenAddress, ERC20_ABI, this._provider)

      const approveAmount = amount + bridgeFee * APPROVE_FEE_TOLERANCE / 100n

      const approveTx = {
        to: tokenAddress,
        value: 0,
        data: erc20Contract.interface.encodeFunctionData('approve', [transactionValueHelper.target, approveAmount])
      }

      const oftTx = {
        to: transactionValueHelper.target,
        value: 0,
        data: transactionValueHelper.interface.encodeFunctionData('send', [oftContract.target, sendParam, fee])
      }

      return { oftTx, approveTx, bridgeFee }
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
      if (key === 'oftContract' && ['ton', 'tron'].includes(targetChain)) {
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
  _buildOftSendParam (targetChain, recipient, amount) {
    const options = Options.newOptions()

    let to

    if (targetChain === 'ton') {
      to = '0x' + Address.parse(recipient).toRawString().slice(2)
    } else if (targetChain === 'tron') {
      to = addressToBytes32('0x' + TronWeb.address.toHex(recipient))
    } else {
      to = addressToBytes32(recipient)
    }

    return {
      dstEid: BLOCKCHAINS[targetChain].eid,
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
