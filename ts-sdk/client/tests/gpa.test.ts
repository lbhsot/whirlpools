import { describe, it } from "mocha";
import assert from "assert";
import { FeeTierArgs, getFeeTierEncoder } from "../src/generated/accounts/feeTier";
import { Address, createDefaultRpcTransport, createSolanaRpcFromTransport, generateKeyPairSigner, getBase58Encoder, GetProgramAccountsApi, GetProgramAccountsMemcmpFilter, ReadonlyUint8Array, Rpc } from "@solana/web3.js";
import { feeTierFeeRateFilter, feeTierTickSpacingFilter, feeTierWhirlpoolsConfigFilter, fetchAllFeeTierWithFilter } from "../src/gpa/feeTier";
import { getPositionEncoder, PositionArgs } from "../src/generated/accounts/position";
import { fetchAllPositionWithFilter, positionMintFilter, positionTickLowerIndexFilter, positionTickUpperIndexFilter, positionWhirlpoolFilter } from "../src/gpa/position";
import { getPositionBundleEncoder, PositionBundleArgs } from "../src/generated/accounts/positionBundle";
import { fetchAllPositionBundleWithFilter, positionBundleMintFilter } from "../src/gpa/positionBundle";
import { getTickArrayEncoder, TickArrayArgs } from "../src/generated/accounts/tickArray";
import { fetchAllTickArrayWithFilter, tickArrayStartTickIndexFilter, tickArrayWhirlpoolFilter } from "../src/gpa/tickArray";
import { TickArgs } from "../src/generated/types/tick";
import { getTokenBadgeEncoder, TokenBadgeArgs } from "../src/generated/accounts/tokenBadge";
import { fetchAllTokenBadgeWithFilter, tokenBadgeTokenMintFilter, tokenBadgeWhirlpoolsConfigFilter } from "../src/gpa/tokenBadge";
import { getWhirlpoolEncoder, WhirlpoolArgs } from "../src/generated/accounts/whirlpool";
import { fetchAllWhirlpoolWithFilter, whirlpoolFeeRateFilter, whirlpoolProtocolFeeRateFilter, whirlpoolRewardMint1Filter, whirlpoolRewardMint2Filter, whirlpoolRewardMint3Filter, whirlpoolRewardVault1Filter, whirlpoolRewardVault2Filter, whirlpoolRewardVault3Filter, whirlpoolTickSpacingFilter, whirlpoolTokenMintAFilter, whirlpoolTokenMintBFilter, whirlpoolTokenVaultAFilter, whirlpoolTokenVaultBFilter, whirlpoolWhirlpoolConfigFilter } from "../src/gpa/whirlpool";
import { getWhirlpoolsConfigEncoder, WhirlpoolsConfigArgs } from "../src/generated/accounts/whirlpoolsConfig";
import { fetchAllWhirlpoolsConfigWithFilter, whirlpoolsConfigCollectProtocolFeesAuthorityFilter, whirlpoolsConfigDefaultProtocolFeeRateFilter, whirlpoolsConfigFeeAuthorityFilter, whirlpoolsConfigRewardEmissionsSuperAuthorityFilter } from "../src/gpa/whirlpoolsConfig";
import { getWhirlpoolsConfigExtensionEncoder, WhirlpoolsConfigExtensionArgs } from "../src/generated/accounts/whirlpoolsConfigExtension";
import { fetchAllWhirlpoolsConfigExtensionWithFilter, whirlpoolsConfigExtensionConfigExtensionAuthorityFilter, whirlpoolsConfigExtensionConfigTokenBadgeAuthorityFilter, whirlpoolsConfigExtensionWhirlpoolsConfigFilter } from "../src/gpa/whirlpoolsConfigExtension";
import { SinonStub, mock, stub } from "sinon";
import * as gpa from "../src/gpa/utils";

describe("get program account memcmp filters", () => {
  const mockRpc = createSolanaRpcFromTransport(createDefaultRpcTransport({ url: "" }));
  let addresses: Address[] = [];
  let gpaMock: SinonStub;

  before(async () => {
    addresses = await Promise.all(
      [...Array(25).keys()].map(async () => generateKeyPairSigner().then(x => x.address))
    );
  });

  beforeEach(() => {
    gpaMock = stub(gpa, "fetchDecodedProgramAccounts").returns(Promise.resolve([]));
  });

  afterEach(() => {
    gpaMock.restore();
  });

  function assertFilters(data: ReadonlyUint8Array) {
    const filters = gpaMock.getCall(0).args[2] as GetProgramAccountsMemcmpFilter[];
    for (const filter of filters) {
      const offset = Number(filter.memcmp.offset);
      const actual = getBase58Encoder().encode(filter.memcmp.bytes);
      const expected = data.subarray(offset, offset + actual.length);
      assert.deepStrictEqual(actual, expected);
    }
  }

  it("feeTier", async () => {
    const feeTierStruct: FeeTierArgs = {
      whirlpoolsConfig: addresses[0],
      tickSpacing: 1234,
      defaultFeeRate: 4321,
    }
    await fetchAllFeeTierWithFilter(
      mockRpc,
      feeTierWhirlpoolsConfigFilter(feeTierStruct.whirlpoolsConfig),
      feeTierTickSpacingFilter(feeTierStruct.tickSpacing),
      feeTierFeeRateFilter(feeTierStruct.defaultFeeRate),
    );
    const data = getFeeTierEncoder().encode(feeTierStruct);
    assertFilters(data);
  });

  it("Position", async () => {
    const positionStruct: PositionArgs = {
      whirlpool: addresses[0],
      positionMint: addresses[1],
      liquidity: 1234,
      tickLowerIndex: 5678,
      tickUpperIndex: 9012,
      feeGrowthCheckpointA: 3456,
      feeOwedA: 7890,
      feeGrowthCheckpointB: 2345,
      feeOwedB: 6789,
      rewardInfos: [
        { growthInsideCheckpoint: 9876, amountOwed: 5432 },
        { growthInsideCheckpoint: 8765, amountOwed: 4321 },
        { growthInsideCheckpoint: 7654, amountOwed: 3210 },
      ]
    }
    await fetchAllPositionWithFilter(
      mockRpc,
      positionWhirlpoolFilter(positionStruct.whirlpool),
      positionMintFilter(positionStruct.positionMint),
      positionTickLowerIndexFilter(positionStruct.tickLowerIndex),
      positionTickUpperIndexFilter(positionStruct.tickUpperIndex),
    );
    const data = getPositionEncoder().encode(positionStruct);
    assertFilters(data);
  });

  it("PositionBundle", async () => {
    const positionBundleStruct: PositionBundleArgs = {
      positionBundleMint: addresses[0],
      positionBitmap: new Uint8Array(88),
    };
    await fetchAllPositionBundleWithFilter(
      mockRpc,
      positionBundleMintFilter(positionBundleStruct.positionBundleMint),
    );
    const data = getPositionBundleEncoder().encode(positionBundleStruct);
    assertFilters(data);
  });

  it("TickArray", async () => {
    const tickStruct: TickArgs = {
      initialized: true,
      liquidityNet: 1234,
      liquidityGross: 5678,
      feeGrowthOutsideA: 9012,
      feeGrowthOutsideB: 3456,
      rewardGrowthsOutside: [1234, 5678, 9012],
    }
    const tickArrayStruct: TickArrayArgs = {
      startTickIndex: 1234,
      ticks: Array(88).fill(tickStruct),
      whirlpool: addresses[0],
    }
    await fetchAllTickArrayWithFilter(
      mockRpc,
      tickArrayStartTickIndexFilter(tickArrayStruct.startTickIndex),
      tickArrayWhirlpoolFilter(tickArrayStruct.whirlpool),
    );
    const data = getTickArrayEncoder().encode(tickArrayStruct);
    assertFilters(data);
  });

  it("TokenBadge", async () => {
    const tokenBadgeStruct: TokenBadgeArgs = {
      whirlpoolsConfig: addresses[0],
      tokenMint: addresses[1],
    };
    await fetchAllTokenBadgeWithFilter(
      mockRpc,
      tokenBadgeWhirlpoolsConfigFilter(tokenBadgeStruct.whirlpoolsConfig),
      tokenBadgeTokenMintFilter(tokenBadgeStruct.tokenMint),
    );
    const data = getTokenBadgeEncoder().encode(tokenBadgeStruct);
    assertFilters(data);
  });

  it("Whirlpool", async () => {
    const whirlpoolStruct: WhirlpoolArgs = {
      whirlpoolsConfig: addresses[0],
      whirlpoolBump: [0],
      tickSpacing: 1234,
      tickSpacingSeed: [1, 2],
      feeRate: 4321,
      protocolFeeRate: 5678,
      liquidity: 9012,
      sqrtPrice: 3456,
      tickCurrentIndex: 7890,
      protocolFeeOwedA: 2345,
      protocolFeeOwedB: 6789,
      tokenMintA: addresses[1],
      tokenVaultA: addresses[2],
      feeGrowthGlobalA: 9876,
      tokenMintB: addresses[3],
      tokenVaultB: addresses[4],
      feeGrowthGlobalB: 5432,
      rewardLastUpdatedTimestamp: 2109,
      rewardInfos: [
        { mint: addresses[5], vault: addresses[6], authority: addresses[7], emissionsPerSecondX64: 8514, growthGlobalX64: 2841 },
        { mint: addresses[8], vault: addresses[9], authority: addresses[10], emissionsPerSecondX64: 5815, growthGlobalX64: 1185 },
        { mint: addresses[11], vault: addresses[12], authority: addresses[13], emissionsPerSecondX64: 1821, growthGlobalX64: 1256 },
      ]
    };
    await fetchAllWhirlpoolWithFilter(
      mockRpc,
      whirlpoolWhirlpoolConfigFilter(whirlpoolStruct.whirlpoolsConfig),
      whirlpoolTickSpacingFilter(whirlpoolStruct.tickSpacing),
      whirlpoolFeeRateFilter(whirlpoolStruct.feeRate),
      whirlpoolProtocolFeeRateFilter(whirlpoolStruct.protocolFeeRate),
      whirlpoolTokenMintAFilter(whirlpoolStruct.tokenMintA),
      whirlpoolTokenVaultAFilter(whirlpoolStruct.tokenVaultA),
      whirlpoolTokenMintBFilter(whirlpoolStruct.tokenMintB),
      whirlpoolTokenVaultBFilter(whirlpoolStruct.tokenVaultB),
      whirlpoolRewardMint1Filter(whirlpoolStruct.rewardInfos[0].mint),
      whirlpoolRewardVault1Filter(whirlpoolStruct.rewardInfos[0].vault),
      whirlpoolRewardMint2Filter(whirlpoolStruct.rewardInfos[1].mint),
      whirlpoolRewardVault2Filter(whirlpoolStruct.rewardInfos[1].vault),
      whirlpoolRewardMint3Filter(whirlpoolStruct.rewardInfos[2].mint),
      whirlpoolRewardVault3Filter(whirlpoolStruct.rewardInfos[2].vault),
    );
    const data = getWhirlpoolEncoder().encode(whirlpoolStruct);
    assertFilters(data);
  });

  it("WhirlpoolsConfig", async () => {
    const whirlpoolsConfigStruct: WhirlpoolsConfigArgs = {
      feeAuthority: addresses[0],
      collectProtocolFeesAuthority: addresses[1],
      rewardEmissionsSuperAuthority: addresses[2],
      defaultProtocolFeeRate: 1234,
    };
    await fetchAllWhirlpoolsConfigWithFilter(
      mockRpc,
      whirlpoolsConfigFeeAuthorityFilter(whirlpoolsConfigStruct.feeAuthority),
      whirlpoolsConfigCollectProtocolFeesAuthorityFilter(whirlpoolsConfigStruct.collectProtocolFeesAuthority),
      whirlpoolsConfigRewardEmissionsSuperAuthorityFilter(whirlpoolsConfigStruct.rewardEmissionsSuperAuthority),
      whirlpoolsConfigDefaultProtocolFeeRateFilter(whirlpoolsConfigStruct.defaultProtocolFeeRate),
    );
    const data = getWhirlpoolsConfigEncoder().encode(whirlpoolsConfigStruct);
    assertFilters(data);
  });

  it("WhirlpoolsConfigExtension", async () => {
    const whirlpoolsConfigExtensionStruct: WhirlpoolsConfigExtensionArgs = {
      whirlpoolsConfig: addresses[0],
      configExtensionAuthority: addresses[1],
      tokenBadgeAuthority: addresses[2],
    };
    await fetchAllWhirlpoolsConfigExtensionWithFilter(
      mockRpc,
      whirlpoolsConfigExtensionWhirlpoolsConfigFilter(whirlpoolsConfigExtensionStruct.whirlpoolsConfig),
      whirlpoolsConfigExtensionConfigExtensionAuthorityFilter(whirlpoolsConfigExtensionStruct.configExtensionAuthority),
      whirlpoolsConfigExtensionConfigTokenBadgeAuthorityFilter(whirlpoolsConfigExtensionStruct.tokenBadgeAuthority)
    );
    const data = getWhirlpoolsConfigExtensionEncoder().encode(whirlpoolsConfigExtensionStruct);
    assertFilters(data);
  });

});