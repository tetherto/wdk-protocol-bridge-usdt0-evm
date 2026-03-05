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
     * @param {BridgeOptions} options - The bridge's options. Optionally pass
     *   'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to override
     *   the destination endpoint id.
     * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<BridgeProtocolConfig, 'bridgeMaxFee'>} [config] - Allows
     *   to override the 'swapMaxFee' option. If the protocol has been initialized with an erc-4337 wallet account, it also allows to override its configuration options.
     * @returns {Promise<BridgeResult>} The bridge's result.
     */
    bridge(options: BridgeOptions, config?: Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig> & Pick<BridgeProtocolConfig, "bridgeMaxFee">): Promise<BridgeResult>;
    /**
     * Quotes the costs of a bridge operation.
     *
     * Users must first approve the necessary amount of tokens to the usdt0 protocol using the {@link WalletAccountEvm#approve} or the {@link WalletAccountEvmErc4337#approve} method.
     *
     * @param {BridgeOptions} options - The bridge's options. Optionally pass
     *   'oftContractAddress' to use a custom OFT contract address instead of the auto-resolved one, and/or 'dstEid' to override
     *   the destination endpoint id.
     * @param {Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig>} [config] - If the protocol has been initialized with
     *   an erc-4337 wallet account, allows to override its configuration options.
     * @returns {Promise<Omit<BridgeResult, 'hash'>>} The bridge's quotes.
     */
    quoteBridge(options: BridgeOptions, config?: Partial<EvmErc4337WalletPaymasterTokenConfig | EvmErc4337WalletSponsorshipPolicyConfig | EvmErc4337WalletNativeCoinsConfig>): Promise<Omit<BridgeResult, "hash">>;
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
