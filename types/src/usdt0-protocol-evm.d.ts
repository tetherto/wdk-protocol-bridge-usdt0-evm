/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeProtocolConfig} BridgeProtocolConfig */
/** @typedef {import('@tetherto/wdk-wallet/protocols').BridgeResult} BridgeResult */
/** @typedef {import('@tetherto/wdk-wallet-evm').WalletAccountReadOnlyEvm} WalletAccountReadOnlyEvm */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletPaymasterTokenConfig} EvmErc4337WalletPaymasterTokenConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletSponsorshipPolicyConfig} EvmErc4337WalletSponsorshipPolicyConfig */
/** @typedef {import('@tetherto/wdk-wallet-evm-erc-4337').EvmErc4337WalletNativeCoinsConfig} EvmErc4337WalletNativeCoinsConfig */
/**
 * A chain supported by the protocol, in the canonical WDK swidge shape.
 *
 * Mirrors `SwidgeSupportedChain` from `@tetherto/wdk-wallet/protocols`; declared locally until the swidge migration.
 *
 * @typedef {Object} SwidgeSupportedChain
 * @property {string | number} id - The provider-specific chain identifier.
 * @property {string} name - The human-readable chain name.
 * @property {string} type - The chain or virtual machine type (e.g., 'evm', 'svm', 'ton', 'tvm').
 * @property {string} nativeToken - The symbol of the chain's native token.
 */
/**
 * A token supported by the protocol, in the canonical WDK swidge shape.
 *
 * Mirrors `SwidgeSupportedToken` from `@tetherto/wdk-wallet/protocols`; declared locally until the swidge migration.
 *
 * @typedef {Object} SwidgeSupportedToken
 * @property {string} token - The provider-specific token identifier to use in operations.
 * @property {string | number} chain - The chain on which the token is available.
 * @property {string} symbol - The token symbol.
 * @property {number} decimals - The number of decimal places for the token's base unit.
 * @property {string} [address] - The token contract address, if applicable.
 * @property {string} [name] - The token's full name.
 */
/**
 * Optional filters for chain- or route-scoped token discovery.
 *
 * Mirrors `SwidgeSupportedTokensOptions` from `@tetherto/wdk-wallet/protocols`; declared locally until the swidge migration.
 *
 * @typedef {Object} SwidgeSupportedTokensOptions
 * @property {string | number} [fromChain] - The optional source chain for route-scoped discovery.
 * @property {string} [fromToken] - The optional source token for route-scoped discovery.
 * @property {string | number} [toChain] - The optional destination chain for route-scoped discovery.
 */
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
    constructor(account: WalletAccountReadOnlyEvm | WalletAccountReadOnlyEvmErc4337, config?: BridgeProtocolConfig);
    /**
     * Creates a new interface to the usdt0 protocol for evm blockchains.
     *
     * @overload
     * @param {WalletAccountEvm | WalletAccountEvmErc4337} account - The wallet account to use to interact with the protocol.
     * @param {BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: WalletAccountEvm | WalletAccountEvmErc4337, config?: BridgeProtocolConfig);
    /** @private */
    private _chainId;
    /** @private */
    private _provider;
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
    bridge(options: BridgeOptions, config?: Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<BridgeProtocolConfig, "bridgeMaxFee">): Promise<BridgeResult>;
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
    quoteBridge(options: BridgeOptions, config?: Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig>): Promise<Omit<BridgeResult, "hash">>;
    /**
     * Retrieves the chains supported by the protocol for bridge operations.
     *
     * Derived from the static config, in the canonical WDK swidge shape.
     *
     * @returns {Promise<SwidgeSupportedChain[]>} The supported chains.
     */
    getSupportedChains(): Promise<SwidgeSupportedChain[]>;
    /**
     * Retrieves the tokens supported by the protocol for bridge operations.
     *
     * Derived from the static config; the on-chain token `address` is not resolved and is omitted.
     *
     * @param {SwidgeSupportedTokensOptions} [options] - Optional filters for chain- or token-scoped discovery.
     * @returns {Promise<SwidgeSupportedToken[]>} The supported tokens.
     */
    getSupportedTokens(options?: SwidgeSupportedTokensOptions): Promise<SwidgeSupportedToken[]>;
    /** @private */
    private _resolveChainKey;
    /** @private */
    private _getChainId;
    /** @private */
    private _getBridgeTransactions;
    /** @private */
    private _getOftContract;
    /** @private */
    private _getSourceChainConfiguration;
    /** @private */
    private _buildOftSendParam;
    /** @private */
    private _getTransactionValueHelperContract;
}
export type BridgeProtocolConfig = import("@tetherto/wdk-wallet/protocols").BridgeProtocolConfig;
export type BridgeResult = import("@tetherto/wdk-wallet/protocols").BridgeResult;
export type WalletAccountReadOnlyEvm = import("@tetherto/wdk-wallet-evm").WalletAccountReadOnlyEvm;
export type EvmErc4337WalletPaymasterTokenConfig = import("@tetherto/wdk-wallet-evm-erc-4337").EvmErc4337WalletPaymasterTokenConfig;
export type EvmErc4337WalletSponsorshipPolicyConfig = import("@tetherto/wdk-wallet-evm-erc-4337").EvmErc4337WalletSponsorshipPolicyConfig;
export type EvmErc4337WalletNativeCoinsConfig = import("@tetherto/wdk-wallet-evm-erc-4337").EvmErc4337WalletNativeCoinsConfig;
/**
 * A chain supported by the protocol, in the canonical WDK swidge shape.
 *
 * Mirrors `SwidgeSupportedChain` from `@tetherto/wdk-wallet/protocols`; declared locally until the swidge migration.
 */
export type SwidgeSupportedChain = {
    /**
     * - The provider-specific chain identifier.
     */
    id: string | number;
    /**
     * - The human-readable chain name.
     */
    name: string;
    /**
     * - The chain or virtual machine type (e.g., 'evm', 'svm', 'ton', 'tvm').
     */
    type: string;
    /**
     * - The symbol of the chain's native token.
     */
    nativeToken: string;
};
/**
 * A token supported by the protocol, in the canonical WDK swidge shape.
 *
 * Mirrors `SwidgeSupportedToken` from `@tetherto/wdk-wallet/protocols`; declared locally until the swidge migration.
 */
export type SwidgeSupportedToken = {
    /**
     * - The provider-specific token identifier to use in operations.
     */
    token: string;
    /**
     * - The chain on which the token is available.
     */
    chain: string | number;
    /**
     * - The token symbol.
     */
    symbol: string;
    /**
     * - The number of decimal places for the token's base unit.
     */
    decimals: number;
    /**
     * - The token contract address, if applicable.
     */
    address?: string;
    /**
     * - The token's full name.
     */
    name?: string;
};
/**
 * Optional filters for chain- or route-scoped token discovery.
 *
 * Mirrors `SwidgeSupportedTokensOptions` from `@tetherto/wdk-wallet/protocols`; declared locally until the swidge migration.
 */
export type SwidgeSupportedTokensOptions = {
    /**
     * - The optional source chain for route-scoped discovery.
     */
    fromChain?: string | number;
    /**
     * - The optional source token for route-scoped discovery.
     */
    fromToken?: string;
    /**
     * - The optional destination chain for route-scoped discovery.
     */
    toChain?: string | number;
};
export type BridgeOptions = {
    /**
     * - The identifier of the destination blockchain (e.g., "arbitrum").
     */
    targetChain: string;
    /**
     * - The address of the recipient.
     */
    recipient: string;
    /**
     * - The address of the token to bridge.
     */
    token: string;
    /**
     * - The amount of tokens to bridge to the destination chain (in base unit).
     */
    amount: number | bigint;
    /**
     * - Custom OFT contract address to use instead of auto-resolving from the source chain.
     */
    oftContractAddress?: string;
    /**
     * - Custom LayerZero destination endpoint ID to override the default for the target chain.
     */
    dstEid?: number;
};
import { BridgeProtocol } from '@tetherto/wdk-wallet/protocols';
import { WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm';
import { WalletAccountEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337';
