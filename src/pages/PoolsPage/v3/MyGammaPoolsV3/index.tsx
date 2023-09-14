import React, { useEffect, useState } from 'react';
import { Box, Button } from '@material-ui/core';
import { useActiveWeb3React } from 'hooks';
import Loader from 'components/Loader';
import { useWalletModalToggle } from 'state/application/hooks';
import { useTranslation } from 'react-i18next';
import GammaLPList from './GammaLPList';
import { useQuery } from '@tanstack/react-query';
import { getAllGammaPairs, getGammaData, getGammaPositions } from 'utils';
import { useMasterChefContracts } from 'hooks/useContract';
import {
  useMultipleContractMultipleData,
  useMultipleContractSingleData,
} from 'state/multicall/v3/hooks';
import GammaPairABI from 'constants/abis/gamma-hypervisor.json';
import { formatUnits, Interface } from 'ethers/lib/utils';
import { Token } from '@uniswap/sdk';
import { useTokenBalances } from 'state/wallet/hooks';
import { useLastTransactionHash } from 'state/transactions/hooks';

export default function MyGammaPoolsV3() {
  const { t } = useTranslation();
  const { chainId, account } = useActiveWeb3React();

  const showConnectAWallet = Boolean(!account);

  const toggleWalletModal = useWalletModalToggle();

  const fetchGammaPositions = async () => {
    if (!account || !chainId) return;
    const gammaPositions = await getGammaPositions(account, chainId);
    return gammaPositions;
  };

  const fetchGammaData = async () => {
    const gammaData = await getGammaData(chainId);
    return gammaData;
  };

  const lastTxHash = useLastTransactionHash();

  const {
    isLoading: dataLoading,
    data: gammaData,
    refetch: refetchGammaData,
  } = useQuery({
    queryKey: ['fetchGammaDataPools', lastTxHash, chainId],
    queryFn: fetchGammaData,
  });

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      const _currentTime = Math.floor(Date.now() / 1000);
      setCurrentTime(_currentTime);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    refetchGammaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  const allGammaPairsToFarm = getAllGammaPairs(chainId);

  const masterChefContracts = useMasterChefContracts();

  const stakedAmountData = useMultipleContractMultipleData(
    account ? masterChefContracts : [],
    'userInfo',
    account
      ? masterChefContracts.map((_, ind) =>
          allGammaPairsToFarm
            .filter((pair) => (pair.masterChefIndex ?? 0) === ind)
            .map((pair) => [pair.pid, account]),
        )
      : [],
  );

  const stakedAmounts = stakedAmountData.map((callStates, ind) => {
    const gammaPairsFiltered = allGammaPairsToFarm.filter(
      (pair) => (pair.masterChefIndex ?? 0) === ind,
    );
    return callStates.map((callData, index) => {
      const amount =
        !callData.loading && callData.result && callData.result.length > 0
          ? formatUnits(callData.result[0], 18)
          : '0';
      const gPair =
        gammaPairsFiltered.length > index
          ? gammaPairsFiltered[index]
          : undefined;
      return {
        amount,
        pid: gPair?.pid,
        masterChefIndex: ind,
      };
    });
  });

  const lpsWithStakedAmount = allGammaPairsToFarm.map((item) => {
    const masterChefIndex = item.masterChefIndex ?? 0;
    const sItem =
      stakedAmounts && stakedAmounts.length > masterChefIndex
        ? stakedAmounts[masterChefIndex].find(
            (sAmount) => sAmount.pid === item.pid,
          )
        : undefined;
    return { ...item, stakedAmount: sItem ? Number(sItem.amount) : 0 };
  });
  const lpAddresses = lpsWithStakedAmount.map((item) => item.address);

  const lpBalances = useMultipleContractSingleData(
    lpAddresses,
    new Interface(GammaPairABI),
    'balanceOf',
    [account ?? undefined],
  );

  const lpTotalAmounts = useMultipleContractSingleData(
    lpAddresses,
    new Interface(GammaPairABI),
    'getTotalAmounts',
  );
  const lpTotalSupply = useMultipleContractSingleData(
    lpAddresses,
    new Interface(GammaPairABI),
    'totalSupply',
  );

  const stakedLoading = !!stakedAmountData.find(
    (callStates) => !!callStates.find((callData) => callData.loading),
  );
  const lpBalanceLoading = !!lpBalances.find((callData) => callData.loading);
  const lpTotalAmountsLoading = !!lpTotalAmounts.find(
    (callData) => callData.loading,
  );
  const lpTotalSupplyLoading = !!lpTotalSupply.find(
    (callData) => callData.loading,
  );
  const loading =
    stakedLoading ||
    lpBalanceLoading ||
    lpTotalAmountsLoading ||
    lpTotalSupplyLoading ||
    dataLoading;

  const gammaPositions = lpsWithStakedAmount
    .map((lp, ind) => {
      const totalAmountsCalldata = lpTotalAmounts[ind];
      const totalSupplyCalldata = lpTotalSupply[ind];
      const lpBalanceCallData = lpBalances[ind];
      const totalAmount0 =
        !totalAmountsCalldata.loading &&
        totalAmountsCalldata.result &&
        totalAmountsCalldata.result.length > 0
          ? totalAmountsCalldata.result[0]
          : undefined;
      const totalAmount1 =
        !totalAmountsCalldata.loading &&
        totalAmountsCalldata.result &&
        totalAmountsCalldata.result.length > 1
          ? totalAmountsCalldata.result[1]
          : undefined;
      const totalSupply =
        !totalSupplyCalldata.loading &&
        totalSupplyCalldata.result &&
        totalSupplyCalldata.result.length > 0
          ? Number(formatUnits(totalSupplyCalldata.result[0], 18))
          : 0;
      const lpBalance =
        !lpBalanceCallData.loading &&
        lpBalanceCallData.result &&
        lpBalanceCallData.result.length > 0
          ? Number(formatUnits(lpBalanceCallData.result[0], 18))
          : 0;

      const lpData = gammaData
        ? gammaData[lp.address.toLowerCase()]
        : undefined;
      const lpUSD =
        lpData && lpData.totalSupply && Number(lpData.totalSupply) > 0
          ? (Number(lpData.tvlUSD) / Number(lpData.totalSupply)) * 10 ** 18
          : 0;

      const balanceUSD = (lpBalance + lp.stakedAmount) * lpUSD;

      return {
        totalAmount0,
        totalAmount1,
        totalSupply,
        balanceUSD,
        lpAmount: lpBalance + lp.stakedAmount,
        pairAddress: lp.address,
        token0Address: lp.token0Address,
        token1Address: lp.token1Address,
        farming: lp.stakedAmount > 0,
      };
    })
    .filter((item) => item.lpAmount > 0);

  return (
    <Box>
      {loading ? (
        <Box mt={2} className='flex justify-center'>
          <Loader stroke='white' size={'2rem'} />
        </Box>
      ) : gammaPositions.length > 0 ? (
        <GammaLPList gammaPositions={gammaPositions} />
      ) : (
        <Box mt={2} textAlign='center'>
          <p>{t('noLiquidityPositions')}.</p>
          {showConnectAWallet && (
            <Box maxWidth={250} margin='20px auto 0'>
              <Button fullWidth onClick={toggleWalletModal}>
                {t('connectWallet')}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
