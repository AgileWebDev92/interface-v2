import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps, InferGetServerSidePropsType } from 'next';
import { useActiveWeb3React } from 'hooks';
import { getConfig } from 'config';

const FarmPage = (
  _props: InferGetServerSidePropsType<typeof getStaticProps>,
) => {
  const router = useRouter();
  const { asPath } = router;
  const { chainId } = useActiveWeb3React();

  const config = getConfig(chainId);
  const farmAvailable = config['farm']['available'];
  const v3 = config['v3'];
  const v2 = config['v2'];

  useEffect(() => {
    if (!farmAvailable) {
      router.push('/');
    } else {
      const version = v2 && v3 ? 'v3' : v2 ? 'v2' : 'v3';
      router.push(asPath.replace('/farm', `/farm/${version}`));
    }
  }, [farmAvailable, v2, v3, asPath]);

  return (
    <Box width='100%' height={400} className='flex items-center justify-center'>
      <CircularProgress />
    </Box>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};

export default FarmPage;
