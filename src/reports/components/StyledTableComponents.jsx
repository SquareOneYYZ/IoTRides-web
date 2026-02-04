import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';

export const TableWrapper = styled('div')(({ theme }) => ({
  borderRadius: '20px',
  overflow: 'hidden',
  border: `1px solid ${theme.palette.divider}`,
}));

export const DarkTable = styled(Table)(({ theme }) => ({
  borderCollapse: 'separate',
  borderSpacing: 0,
  borderLeft: `1px solid ${theme.palette.divider}`,
  borderRight: `1px solid ${theme.palette.divider}`,
}));

export const DarkTableHead = styled(TableHead)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)' // Subtle highlight in dark mode
    : 'rgba(0, 0, 0, 0.02)', // Subtle grey in light mode
}));

export const DarkTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
  fontSize: '14px',
  padding: '12px 16px',
  '&.MuiTableCell-head': {
    color: theme.palette.text.primary,
    fontWeight: 600,
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
}));

export const DarkTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.2s',
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
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
