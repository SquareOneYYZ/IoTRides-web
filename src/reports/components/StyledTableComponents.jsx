import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export const TableWrapper = styled('div')({
  borderRadius: '20px',
  overflow: 'hidden',
  border: '1px solid #2a2a2a',
});

export const DarkTable = styled(Table)(({ theme }) => ({
  borderCollapse: 'separate',
  borderSpacing: 0,
  borderLeft: '1px solid #2a2a2a',
  borderRight: '1px solid #2a2a2a',
}));

export const DarkTableHead = styled(TableHead)(({ theme }) => ({
  background: '#171717',
}));

export const DarkTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: '1px solid #2a2a2a',
  color: '#e5e5e5',
  fontSize: '14px',
  padding: '12px 16px',
  '&.MuiTableCell-head': {
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
}));

export const DarkTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '#1a1a1a',
  },
  '&:last-child td': {
    borderBottom: 'none',
  },
}));

export const DarkTableBody = styled(TableBody)(({ theme }) => ({}));

export const FirstHeaderCell = styled(DarkTableCell)(({ theme }) => ({
  borderTopLeftRadius: '20px',
}));

export const ActionHeaderCell = styled(DarkTableCell)({
  width: 48,
  minWidth: 48,
  padding: 0,
});

export const LastHeaderCell = styled(DarkTableCell)(({ theme }) => ({
  borderTopRightRadius: '20px',
}));

export const TableContainer = styled('div')(({ theme }) => ({
  padding: '20px',
}));

export const ReportTable = ({ headers, children, loading, loadingComponent }) => (
  <TableContainer>
    <TableWrapper>
      <DarkTable>
        <DarkTableHead>
          <TableRow>
            {headers.map((header, index) => {
              if (index === 0) {
                return (
                  <FirstHeaderCell key={header}>
                    {header}
                  </FirstHeaderCell>
                );
              }

              if (index === headers.length - 1) {
                return (
                  <LastHeaderCell key={header}>
                    {header}
                  </LastHeaderCell>
                );
              }

              return (
                <DarkTableCell key={header}>
                  {header}
                </DarkTableCell>
              );
            })}
          </TableRow>
        </DarkTableHead>
        <DarkTableBody>
          {loading ? loadingComponent : children}
        </DarkTableBody>
      </DarkTable>
    </TableWrapper>
  </TableContainer>
);
