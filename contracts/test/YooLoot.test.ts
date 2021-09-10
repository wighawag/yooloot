import {expect} from './chai-setup';
import {
  ethers,
  deployments,
  getUnnamedAccounts,
  getNamedAccounts,
} from 'hardhat';
import {Loot, YooLoot} from '../typechain';
import {
  getLatestBlockTimestamp,
  increaseTime,
  setupUser,
  setupUsers,
  waitFor,
} from './utils';
import {solidityKeccak256} from 'ethers/lib/utils';
import {Wallet} from '@ethersproject/wallet';

type Deck = [number, number, number, number, number, number, number, number];

type DeckInfo = {
  deck: Deck;
  deckHash: string;
  secret: string;
};

type FullDeckInfo = DeckInfo & {tokenId: string; user: User};

function createDeck(tokenId: string, deck: Deck): DeckInfo {
  const secret = Wallet.createRandom().privateKey;
  const deckHash = solidityKeccak256(
    ['bytes32', 'uint256', 'uint8[8]'],
    [secret, tokenId, deck]
  );
  return {
    deck,
    deckHash,
    secret,
  };
}

type User = {
  address: string;
  YooLoot: YooLoot;
  Loot: Loot;
};

async function participate(
  user: User,
  tokenIdChosen?: string
): Promise<FullDeckInfo> {
  const tokenId = tokenIdChosen || '' + Math.floor(Math.random() * 7000);
  await waitFor(user.Loot.claim(tokenId));
  await waitFor(user.Loot.setApprovalForAll(user.YooLoot.address, true));
  const {deck, deckHash, secret} = createDeck(
    tokenId,
    [8, 7, 6, 5, 4, 3, 2, 1]
  );

  const deckPower = await user.YooLoot.getDeckPower(tokenId, deck, false);
  // console.log({
  //   // tokenURI,
  //   tokenId,
  //   address: user.address,
  //   deckPower,
  // });

  await waitFor(user.YooLoot.commitLootDeck(tokenId, deckHash));
  return {
    deck,
    deckHash,
    secret,
    tokenId,
    user,
  };
}

async function reveal(deckInfo: FullDeckInfo): Promise<void> {
  await waitFor(
    deckInfo.user.YooLoot.revealLootDeck(
      deckInfo.tokenId,
      deckInfo.deck,
      deckInfo.secret
    )
  );
}

const setup = deployments.createFixture(async () => {
  await deployments.fixture(['YooLoot']);
  const contracts = {
    YooLoot: <YooLoot>await ethers.getContract('YooLoot'),
    Loot: <Loot>await ethers.getContract('Loot'),
  };
  const {deployer: deployerAddress} = await getNamedAccounts();
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  const deployer = await setupUser(deployerAddress, contracts);
  return {
    ...contracts,
    users,
    deployer,
  };
});

describe('YooLoot', function () {
  it('commitLootDeck', async function () {
    const {users, YooLoot} = await setup();
    const tokenId = 1;
    await waitFor(users[0].Loot.claim(tokenId));
    await waitFor(users[0].Loot.setApprovalForAll(YooLoot.address, true));
    await waitFor(
      users[0].YooLoot.commitLootDeck(
        tokenId,
        '0x1111111111111111111111111111111111111111111111111111111111111111'
      )
    );
  });

  // it('find loot with same range of power', async function () {
  //   const {YooLoot} = await setup();

  //   const deckPowers: {[deck: string]: number} = {};
  //   for (let tokenId = 7000; tokenId < 8001; tokenId++) {
  //     const deckPower = await YooLoot.getDeckPower(
  //       tokenId,
  //       [1, 2, 3, 4, 5, 6, 7, 8],
  //       false
  //     );
  //     const id = deckPower.join(',');
  //     console.log(`"${id}",`);
  //     const already = deckPowers[id];
  //     if (already) {
  //       console.log({tokenId, already});
  //       break;
  //     } else {
  //       deckPowers[id] = tokenId;
  //     }
  //   }
  // });

  it('commit wait, reveal, withdraw', async function () {
    const {users, YooLoot} = await setup();
    const tokenId = '1';
    await waitFor(users[0].Loot.claim(tokenId));
    await waitFor(users[0].Loot.setApprovalForAll(YooLoot.address, true));

    const {deck, deckHash, secret} = createDeck(
      tokenId,
      [1, 2, 3, 4, 5, 6, 7, 8]
    );
    await waitFor(users[0].YooLoot.commitLootDeck(tokenId, deckHash));

    await increaseTime(7 * 24 * 60 * 60);

    await waitFor(users[0].YooLoot.revealLootDeck(tokenId, deck, secret));

    await increaseTime(7 * 24 * 60 * 60, true);

    const winner = await YooLoot.winner();
    console.log({winner, user0: users[0].address});

    await increaseTime(7 * 24 * 60 * 60, true);

    await users[0].YooLoot.withdrawAndGetXP(tokenId);
  });

  it('2 players: commit wait, reveal, withdraw', async function () {
    const {users, YooLoot} = await setup();

    const user0 = await participate(users[0]);
    const user1 = await participate(users[1]);

    await increaseTime(7 * 24 * 60 * 60);

    await reveal(user0);
    await reveal(user1);

    await increaseTime(7 * 24 * 60 * 60, true);

    const {winnerAddress, winnerLootId, winnerScore} = await YooLoot.winner();
    const scoreFor0 = (await YooLoot.individualScore(user0.tokenId)).toNumber();
    const scoreFor1 = (await YooLoot.individualScore(user1.tokenId)).toNumber();
    console.log({
      winnerAddress,
      winnerLootId: winnerLootId.toString(),
      winnerScore: winnerScore.toNumber(),
      user0: users[0].address,
      user1: users[1].address,
      scoreFor0,
      scoreFor1,
    });

    await increaseTime(7 * 24 * 60 * 60, true);

    await users[0].YooLoot.withdrawAndGetXP(user0.tokenId);

    await users[1].YooLoot.withdrawAndGetXP(user1.tokenId);
  });

  it('4 players: commit wait, reveal, withdraw', async function () {
    const {users, YooLoot} = await setup();

    const user0 = await participate(users[0], '1510');
    const user1 = await participate(users[1], '1407');
    const user2 = await participate(users[2], '6131');
    const user3 = await participate(users[3], '5165');

    await increaseTime(7 * 24 * 60 * 60);

    await reveal(user0);
    await reveal(user1);
    await reveal(user2);
    await reveal(user3);

    await increaseTime(7 * 24 * 60 * 60, true);

    const {winnerAddress, winnerLootId, winnerScore} = await YooLoot.winner();
    const scoreFor0 = (await YooLoot.individualScore(user0.tokenId)).toNumber();
    const scoreFor1 = (await YooLoot.individualScore(user1.tokenId)).toNumber();
    const scoreFor2 = (await YooLoot.individualScore(user2.tokenId)).toNumber();
    const scoreFor3 = (await YooLoot.individualScore(user3.tokenId)).toNumber();
    console.log({
      winnerAddress,
      winnerLootId: winnerLootId.toString(),
      winnerScore: winnerScore.toNumber(),
      user0: users[0].address,
      user1: users[1].address,
      scoreFor0,
      scoreFor1,
      user2: users[2].address,
      user3: users[3].address,
      scoreFor2,
      scoreFor3,
    });

    await increaseTime(7 * 24 * 60 * 60, true);

    await users[0].YooLoot.withdrawAndGetXP(user0.tokenId);

    await users[1].YooLoot.withdrawAndGetXP(user1.tokenId);
  });

  it('4 players: commit wait, reveal, withdraw', async function () {
    const {users, YooLoot} = await setup();

    const participants = [];
    for (let i = 0; i < users.length; i++) {
      participants.push(await participate(users[i], '' + (i + 1)));
    }

    await increaseTime(7 * 24 * 60 * 60);

    for (const participant of participants) {
      await reveal(participant);
    }

    await increaseTime(7 * 24 * 60 * 60, true);

    const {winnerAddress, winnerLootId, winnerScore} = await YooLoot.winner();
    console.log({
      winnerAddress,
      winnerLootId: winnerLootId.toString(),
      winnerScore: winnerScore.toNumber(),
    });

    await increaseTime(7 * 24 * 60 * 60, true);
    // TODO check
  });
});
