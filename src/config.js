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

export const FEE_TOLERANCE = 999n

export const BLOCKCHAINS = {
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
