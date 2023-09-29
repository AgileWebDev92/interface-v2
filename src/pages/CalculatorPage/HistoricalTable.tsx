import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box } from '@material-ui/core';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function createData(
  name: string,
  calories: number,
  fat: number,
  carbs: number,
  protein: number,
) {
  return { name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];

interface HistoricalPrice {
  date: string;
  price: number;
  difference: number;
  change: number;
}

export const HistoricalTable: React.FC<{
  prices: number[];
  dates: number[];
}> = ({ prices, dates }) => {
  const [data, setData] = useState<HistoricalPrice[]>([]);

  useEffect(() => {
    if (Array.isArray(prices) && Array.isArray(dates)) {
      let lastPrice: number | undefined = undefined;
      const pricePonints: HistoricalPrice[] = prices.map((p, i) => {
        const dt = dates[i];
        const difference = lastPrice ? p - lastPrice : 0;
        const change = lastPrice ? (difference * 100) / lastPrice : 0;
        const value: HistoricalPrice = {
          date: new Date(dt * 1000).toUTCString().substring(4, 16),
          price: p,
          difference,
          change,
        };

        lastPrice = p;

        return value;
      });

      pricePonints.reverse().pop();
      setData(pricePonints);
    }
  }, [prices, dates]);

  const { t } = useTranslation();
  return (
    <Box width='100%' mb={3}>
      <Box mb={3}>
        <Box className='sub-heading sub-heading-20'>
          {t('ethHistoricalTableHeading')}
        </Box>
      </Box>
      <Box>
        <TableContainer component={Paper} style={{ background: '#1b1e29' }}>
          <Table aria-label='simple table'>
            <TableHead>
              <TableRow>
                <TableCell className='text-dark dark-border'>Date</TableCell>
                <TableCell className='text-dark dark-border' align='center'>
                  Difference
                </TableCell>
                <TableCell className='text-dark dark-border' align='center'>
                  0.01 ETH to USD
                </TableCell>
                <TableCell className='text-dark dark-border' align='right'>
                  Change
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.date}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell className='text-light'>{row.date}</TableCell>
                  <TableCell className='text-light' align='center'>
                    {row.price.toFixed(3)}
                  </TableCell>
                  <TableCell className='text-light' align='center'>
                    {row.difference.toFixed(3)}
                  </TableCell>
                  <TableCell
                    className={
                      row.change > 0
                        ? 'text-success dark-border'
                        : 'text-danger dark-border'
                    }
                    align='right'
                  >
                    {row.change.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};
