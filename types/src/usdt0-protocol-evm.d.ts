export default class Usdt0ProtocolEvm extends BridgeProtocol {
    /**
     * Creates a new read-only interface to the usdt0 protocol for evm blockchains.
     *
     * @overload
     * @param {IWalletAccountReadOnly} account - The wallet account to use to interact with the protocol.
     * @param {Usdt0BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: IWalletAccountReadOnly, config?: Usdt0BridgeProtocolConfig);
    /**
     * Creates a new interface to the usdt0 protocol for evm blockchains.
     *
     * @overload
     * @param {IWalletAccount} account - The wallet account to use to interact with the protocol.
     * @param {Usdt0BridgeProtocolConfig} [config] - The bridge protocol configuration.
     */
    constructor(account: IWalletAccount, config?: Usdt0BridgeProtocolConfig);
    /** @private */
    private _chainId;
    /** @private */
    private _provider;
    /**
     * Bridges a token to a different blockchain.
     *
     * Standard (non erc-4337) accounts must approve the tokens to the usdt0 protocol via the account's `approve` method,
     * unless already approved. Erc-4337 accounts bundle the approval automatically, so no prior approval is needed, and
     * reset the allowance to zero after the bridge, so none is left behind.
     *
     * @param {BridgeOptions} options - The bridge's options. Optionally pass 'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to
     *   override the destination endpoint id.
     * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<Usdt0BridgeProtocolConfig, 'bridgeMaxFee' | 'bridgeMaxTokenFee'>} [config] - If
     *   the protocol has been initialized with an erc-4337 wallet account, it can be used to override its configuration options along with the 'bridgeMaxFee' and
     *   'bridgeMaxTokenFee' options.
     * @returns {Promise<Usdt0BridgeResult>} The bridge's result.
     * @throws {Error} If the protocol has been initialized with an erc-4337 wallet account and the token cannot be bridged from it on the source chain.
     * @throws {Error} If the protocol has been initialized with an erc-4337 wallet account and the given 'oftContractAddress' does not bridge the token.
     * @throws {Error} If the protocol has been initialized with an erc-4337 wallet account and the token fee exceeds the 'bridgeMaxTokenFee' option.
     */
    bridge(options: BridgeOptions, config?: Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<Usdt0BridgeProtocolConfig, "bridgeMaxFee" | "bridgeMaxTokenFee">): Promise<Usdt0BridgeResult>;
    /**
     * Quotes the costs of a bridge operation.
     *
     * Standard (non erc-4337) accounts must approve the tokens to the usdt0 protocol via the account's `approve` method,
     * unless already approved, otherwise the quote fails. Erc-4337 accounts bundle the approval automatically, and the
     * reset of the allowance to zero after the bridge, so the quote covers both.
     *
     * @param {BridgeOptions} options - The bridge's options. Optionally pass 'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to
     *   override the destination endpoint id.
     * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig>} [config] - If the protocol has been initialized with
     *   an erc-4337 wallet account, it can be used to override its configuration options.
     * @returns {Promise<Omit<Usdt0BridgeResult, 'hash'>>} The bridge's quotes.
     * @throws {Error} If the protocol has been initialized with an erc-4337 wallet account and the token cannot be bridged from it on the source chain.
     * @throws {Error} If the protocol has been initialized with an erc-4337 wallet account and the given 'oftContractAddress' does not bridge the token.
     */
    quoteBridge(options: BridgeOptions, config?: Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig>): Promise<Omit<Usdt0BridgeResult, "hash">>;
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
    private _assertValidRecipient;
    /** @private */
    private _getTransactionValueHelperContract;
}
export type BridgeProtocolConfig = import("@tetherto/wdk-wallet/protocols").BridgeProtocolConfig;
export type BridgeResult = import("@tetherto/wdk-wallet/protocols").BridgeResult;
/**
 * The usdt0-specific options of the bridge protocol's configuration, on top of the WDK {@link BridgeProtocolConfig}.
 */
export type Usdt0BridgeProtocolConfigExtras = {
    /**
     * - The maximum token fee for bridge operations from erc-4337 accounts, in the
     * bridged token's base units: the transaction value helper's surcharge on top of the bridged amount (see 'tokenFee').
     */
    bridgeMaxTokenFee?: number | bigint;
};
/**
 * The full configuration of the usdt0 bridge protocol.
 */
export type Usdt0BridgeProtocolConfig = BridgeProtocolConfig & Usdt0BridgeProtocolConfigExtras;
/**
 * The usdt0-specific fields of a bridge's result, on top of the WDK {@link BridgeResult}.
 */
export type Usdt0BridgeResultExtras = {
    /**
     * - The transaction value helper's surcharge on top of the bridged amount, in the token's base
     * units (0 for standard accounts).
     */
    tokenFee: bigint;
};
/**
 * The full result of {@link Usdt0ProtocolEvm#bridge}.
 */
export type Usdt0BridgeResult = BridgeResult & Usdt0BridgeResultExtras;
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type IWalletAccountReadOnly = import("@tetherto/wdk-wallet").IWalletAccountReadOnly;
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
