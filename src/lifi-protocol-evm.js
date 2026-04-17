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
import { JsonRpcProvider, BrowserProvider, Contract } from 'ethers'

import { LIFI_API_URL, CHAINS } from './lifi-config.js'

/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */

/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountEvm} WalletAccountEvm */
/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountReadOnlyEvm} WalletAccountReadOnlyEvm */

/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').WalletAccountEvmErc4337} WalletAccountEvmErc4337 */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletPaymasterTokenConfig} EvmErc4337WalletPaymasterTokenConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletSponsorshipPolicyConfig} EvmErc4337WalletSponsorshipPolicyConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletNativeCoinsConfig} EvmErc4337WalletNativeCoinsConfig */

/**
 * @typedef {'RECOMMENDED' | 'FASTEST' | 'CHEAPEST'} LifiRouteOrder
 */

/**
 * @typedef {Object} LifiBridgeProtocolConfig
 * @property {number | bigint} [bridgeMaxFee] - The maximum combined fee (gas + bridge fee) allowed for a bridge operation.
 * @property {string} [integrator] - LI.FI integrator identifier, sent as the x-lifi-integrator header.
 * @property {string} [apiKey] - LI.FI API key for higher rate limits, sent as x-lifi-api-key. Never expose client-side.
 * @property {LifiRouteOrder} [order] - Route selection strategy passed to the LI.FI quote API.
 *   - `'RECOMMENDED'` (default) — LI.FI's best overall route.
 *   - `'FASTEST'` — prioritises shortest settlement time; useful when users should not wait hours.
 *   - `'CHEAPEST'` — minimises total fees (gas + bridge fee).
 * @property {string[]} [allowBridges] - Whitelist of bridge protocol names to route through (e.g. `['stargate', 'cctp']`).
 *   When set, LI.FI will only consider routes using these bridges. Takes precedence over `denyBridges`.
 * @property {string[]} [denyBridges] - Blacklist of bridge protocol names to exclude (e.g. `['across']`).
 *   When set, LI.FI will not route through these bridges.
 */

/**
 * @typedef {Object} BridgeOptions
 * @property {string | number} targetChain - The WDK chain name (e.g., "arbitrum") or a raw LI.FI
 *   numeric chain ID (e.g., 8453 for Base). Numeric IDs bypass the name map and are forwarded
 *   directly to the quote API, allowing any LI.FI-supported chain to be targeted without a map entry.
 * @property {string} recipient - The address of the recipient on the target chain.
 * @property {string} token - The contract address of the token to bridge on the source chain.
 * @property {number | bigint} amount - The amount of tokens to bridge (in base units).
 * @property {string} [toToken] - The token address or symbol to receive on the target chain. When omitted,
 *   the module resolves the source token's symbol via the LI.FI token API and uses that on the destination
 *   chain, ensuring the correct contract address is used on each chain (e.g., USDT has different addresses
 *   on Arbitrum and Optimism).
 */

/**
 * @typedef {Object} LifiBridgeResult
 * @property {string} hash - Transaction hash of the executed bridge operation.
 * @property {bigint} fee - Estimated gas cost in native token wei.
 * @property {bigint} bridgeFee - Protocol fee in source token base units.
 * @property {string} [approveHash] - Transaction hash of the ERC-20 approval, present when an approval was required.
 * @property {string} [resetAllowanceHash] - Transaction hash of the allowance reset to zero, present when an existing
 *   non-zero allowance had to be cleared first (e.g., USDT on Ethereum).
 */

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
]

export default class LifiProtocolEvm extends BridgeProtocol {
  /**
   * Creates a new read-only interface to LI.FI bridge protocol for EVM blockchains.
   *
   * @overload
   * @param {WalletAccountReadOnlyEvm} account - The wallet account to use to interact with the protocol.
   * @param {LifiBridgeProtocolConfig} [config] - The bridge protocol configuration.
   */

  /**
   * Creates a new interface to the LI.FI bridge protocol for EVM blockchains.
   *
   * @overload
   * @param {WalletAccountEvm | WalletAccountEvmErc4337} account - The wallet account to use to interact with the protocol.
   * @param {LifiBridgeProtocolConfig} [config] - The bridge protocol configuration.
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
   * Bridges a token to a different EVM blockchain via LI.FI.
   *
   * Handles ERC-20 approval automatically, granting only the exact amount required.
   * For tokens like USDT on Ethereum that disallow changing a non-zero allowance directly,
   * a reset-to-zero transaction is sent first.
   *
   * @param {BridgeOptions} options - The bridge options.
   * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<LifiBridgeProtocolConfig, 'bridgeMaxFee'>} [config] - If
   *   the protocol has been initialised with an ERC-4337 wallet account, this can override its configuration
   *   options along with the 'bridgeMaxFee' option.
   * @returns {Promise<LifiBridgeResult>} The bridge result.
   */
  async bridge (options, config) {
    if (!this._isWritableEvmAccount()) {
      throw new Error("The 'bridge(options)' method requires the protocol to be initialized with a non read-only account.")
    }

    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to perform bridge operations.')
    }

    const { bridgeMaxFee } = this._isErc4337Account()
      ? { ...this._config, ...config }
      : this._config

    const amount = BigInt(options.amount)
    const fromAddress = await this._account.getAddress()
    const fromChainId = await this._getChainId()
    const quote = await this._fetchQuote({ ...options, fromAddress, fromChainId, amount })

    const { fee, bridgeFee } = this._extractFees(quote)

    if (bridgeMaxFee !== undefined && fee + bridgeFee >= BigInt(bridgeMaxFee)) {
      throw new Error('Exceeded maximum fee cost for bridge operation.')
    }

    const { approveHash, resetAllowanceHash } = await this._handleApproval(
      options.token,
      fromAddress,
      quote.estimate.approvalAddress,
      amount,
      quote.estimate.skipApproval,
      config
    )

    const bridgeTx = this._buildBridgeTx(quote)

    let hash
    if (this._isErc4337Account()) {
      ;({ hash } = await this._account.sendTransaction([bridgeTx], config))
    } else {
      ;({ hash } = await this._account.sendTransaction(bridgeTx))
    }

    const result = { hash, fee, bridgeFee }
    if (approveHash) result.approveHash = approveHash
    if (resetAllowanceHash) result.resetAllowanceHash = resetAllowanceHash

    return result
  }

  /**
   * Quotes the costs of a bridge operation without executing it.
   *
   * @param {BridgeOptions} options - The bridge options.
   * @returns {Promise<{
   *   fee: bigint,
   *   bridgeFee: bigint,
   *   fromAmount: string,
   *   toAmount: string,
   *   toAmountMin: string,
   *   fromAmountUSD?: string,
   *   toAmountUSD?: string,
   *   gasCostUSD: string,
   *   executionDuration?: number,
   *   fromToken: { symbol: string, decimals: number },
   *   toToken: { symbol: string, decimals: number },
   *   tool?: string
   * }>} Estimated fees and full route details.
   */
  async quoteBridge (options) {
    if (!this._provider) {
      throw new Error('The wallet must be connected to a provider in order to quote bridge operations.')
    }

    const fromAddress = await this._account.getAddress()
    const fromChainId = await this._getChainId()
    const quote = await this._fetchQuote({ ...options, fromAddress, fromChainId, amount: BigInt(options.amount) })

    const { fee, bridgeFee } = this._extractFees(quote)
    const { estimate, action, toolDetails, tool } = quote

    const gasCostUSD = (estimate.gasCosts || [])
      .reduce((sum, gc) => sum + parseFloat(gc.amountUSD || 0), 0)
      .toFixed(4)

    return {
      fee,
      bridgeFee,
      fromAmount: estimate.fromAmount,
      toAmount: estimate.toAmount,
      toAmountMin: estimate.toAmountMin,
      fromAmountUSD: estimate.fromAmountUSD,
      toAmountUSD: estimate.toAmountUSD,
      gasCostUSD,
      executionDuration: estimate.executionDuration,
      fromToken: { symbol: action.fromToken.symbol, decimals: action.fromToken.decimals },
      toToken: { symbol: action.toToken.symbol, decimals: action.toToken.decimals },
      tool: toolDetails?.name || tool
    }
  }

  /**
   * Fetches the status of a previously submitted bridge transaction.
   *
   * @param {string} txHash - The transaction hash returned by `bridge()`.
   * @param {{ fromChain?: number, toChain?: number }} [options] - Optional chain IDs to speed up the lookup.
   * @returns {Promise<Object>} Status response from LI.FI. Key fields:
   *   - `status`: 'NOT_FOUND' | 'INVALID' | 'PENDING' | 'DONE' | 'FAILED'
   *   - `substatus`: granular status string (e.g., 'COMPLETED', 'PARTIAL', 'REFUNDED')
   *   - `substatusMessage`: human-readable description
   *   - `sending`: source-side transaction details
   *   - `receiving`: destination-side transaction details
   */
  async getStatus (txHash, { fromChain, toChain } = {}) {
    const params = new URLSearchParams({ txHash })
    if (fromChain !== undefined) params.set('fromChain', String(fromChain))
    if (toChain !== undefined) params.set('toChain', String(toChain))

    const response = await fetch(`${LIFI_API_URL}/status?${params}`, {
      headers: this._buildHeaders()
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`LI.FI status request failed: ${error.message || response.statusText}`)
    }

    return response.json()
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
  async _fetchQuote ({ targetChain, recipient, token, toToken, amount, fromAddress, fromChainId }) {
    let toChainId
    if (typeof targetChain === 'number') {
      toChainId = targetChain
    } else {
      toChainId = CHAINS[targetChain]
      if (!toChainId) {
        throw new Error(`Target chain '${targetChain}' is not supported by the LI.FI bridge module.`)
      }
    }

    if (fromChainId === toChainId) {
      throw new Error('The target chain cannot be equal to the source chain.')
    }

    // If no destination token is specified, resolve the source token's symbol so LI.FI can
    // find the correct contract address on the destination chain. Token addresses differ per
    // chain (e.g. USDT on Arbitrum !== USDT on Optimism), but the symbol is universal.
    const resolvedToToken = toToken || await this._resolveTokenSymbol(fromChainId, token)

    const params = new URLSearchParams({
      fromChain: String(fromChainId),
      toChain: String(toChainId),
      fromToken: token,
      toToken: resolvedToToken,
      fromAmount: String(amount),
      fromAddress,
      toAddress: recipient
    })

    const { order, allowBridges, denyBridges } = this._config
    if (order) params.set('order', order)
    if (allowBridges?.length) params.set('allowBridges', allowBridges.join(','))
    if (denyBridges?.length) params.set('denyBridges', denyBridges.join(','))

    const response = await fetch(`${LIFI_API_URL}/quote?${params}`, {
      headers: this._buildHeaders()
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(`LI.FI quote request failed: ${error.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Resolves a token contract address to its symbol using the LI.FI token API.
   * The symbol (e.g. "USDT") is accepted by LI.FI as a chain-agnostic token identifier,
   * allowing it to find the correct contract on any destination chain.
   *
   * @private
   */
  async _resolveTokenSymbol (chainId, tokenAddress) {
    const params = new URLSearchParams({ chain: String(chainId), token: tokenAddress })

    const response = await fetch(`${LIFI_API_URL}/token?${params}`, {
      headers: this._buildHeaders()
    })

    if (!response.ok) return tokenAddress

    const { symbol } = await response.json()
    return symbol || tokenAddress
  }

  /** @private */
  _extractFees (quote) {
    const fee = (quote.estimate.gasCosts || []).reduce(
      (sum, gc) => sum + BigInt(gc.amount),
      0n
    )

    const bridgeFee = (quote.estimate.feeCosts || []).reduce(
      (sum, fc) => sum + BigInt(fc.amount),
      0n
    )

    return { fee, bridgeFee }
  }

  /** @private */
  _buildBridgeTx (quote) {
    const { transactionRequest } = quote
    return {
      to: transactionRequest.to,
      data: transactionRequest.data,
      value: BigInt(transactionRequest.value ?? 0),
      gasLimit: BigInt(transactionRequest.gasLimit)
    }
  }

  /**
   * Handles ERC-20 approval for the LI.FI Diamond contract.
   * Grants the exact minimum amount required. For tokens that revert on a direct
   * non-zero-to-non-zero approval (e.g., USDT on Ethereum), resets to zero first.
   *
   * @private
   */
  async _handleApproval (token, fromAddress, approvalAddress, amount, skipApproval, config) {
    if (skipApproval) return {}

    const tokenContract = new Contract(token, ERC20_ABI, this._provider)
    const currentAllowance = await tokenContract.allowance(fromAddress, approvalAddress)

    if (currentAllowance >= amount) return {}

    let resetAllowanceHash

    if (currentAllowance > 0n) {
      const resetTx = {
        to: token,
        data: tokenContract.interface.encodeFunctionData('approve', [approvalAddress, 0n])
      }
      const result = this._isErc4337Account()
        ? await this._account.sendTransaction([resetTx], config)
        : await this._account.sendTransaction(resetTx)
      resetAllowanceHash = result.hash
    }

    const approveTx = {
      to: token,
      data: tokenContract.interface.encodeFunctionData('approve', [approvalAddress, amount])
    }
    const result = this._isErc4337Account()
      ? await this._account.sendTransaction([approveTx], config)
      : await this._account.sendTransaction(approveTx)

    return { approveHash: result.hash, resetAllowanceHash }
  }

  /**
   * Returns true if the account is an ERC-4337 smart account.
   * Uses prototype-chain name matching instead of instanceof so the check is
   * immune to module identity issues that arise when the same package is
   * installed in multiple node_modules trees (e.g. local file: dependencies).
   *
   * @private
   */
  _isErc4337Account () {
    let proto = this._account
    while (proto && proto !== Object.prototype) {
      if (proto.constructor?.name === 'WalletAccountEvmErc4337') return true
      proto = Object.getPrototypeOf(proto)
    }
    return false
  }

  /**
   * Returns true if the account can sign and send transactions (i.e. is not read-only).
   *
   * @private
   */
  _isWritableEvmAccount () {
    let proto = this._account
    while (proto && proto !== Object.prototype) {
      const name = proto.constructor?.name
      if (name === 'WalletAccountEvm' || name === 'WalletAccountEvmErc4337') return true
      proto = Object.getPrototypeOf(proto)
    }
    return false
  }

  /** @private */
  _buildHeaders () {
    const headers = {}
    if (this._config.integrator) headers['x-lifi-integrator'] = this._config.integrator
    if (this._config.apiKey) headers['x-lifi-api-key'] = this._config.apiKey
    return headers
  }
}
