import React, { useContext } from 'react';
import {
  TableFooter,
  TablePagination,
  TableSortLabel,
  TableContainer,
  TableBody,
  Table,
  TableHead,
  TableRow,
  TableCell,
} from '@material-ui/core';
import appContext from '../context/appContext';
import TablePaginationActions from './TablePaginationActions';
import Row from './TableViewRow';

const maxRowsLabel = () => {
  const { pages, itemsPerPage } = useContext(appContext);
  // If query result includes all rows, page information doesn't exist
  if (!pages.last) {
    return { label: 'All', value: 100 };
  }
  // If all rows <= 100, say 'All'. Github API query max 100 results.
  return pages.last * itemsPerPage <= 100 ? { label: 'All', value: 100 } : 100;
};

const labelDisplayedRows = ({
  from, to, count,
}) => {
  const { pages, activePage } = useContext(appContext);
  if (!pages.last || parseInt(pages.last, 10) === activePage) {
    return `${from}-${to} of ${count}`;
  }
  return `${from}-${to} of about ${count}`;
};

const rowCount = () => {
  const {
    rows, itemsPerPage, pages, activePage,
  } = useContext(appContext);
  if (!rows || !rows.length) {
    return 0;
  }
  if (!pages.last) {
    // no pages, currently loadeded rows assumed as all rows
    return rows.length;
  }
  const lastPageNumber = parseInt(pages.last, 10);
  // exact row count is known when last page is loaded
  if (!Number.isNaN(lastPageNumber)
    && lastPageNumber === activePage) { // if we are at the last page
    return (lastPageNumber - 1) * itemsPerPage + rows.length; // exact row count
  }
  if (!Number.isNaN(lastPageNumber)) { // if we are not at the last page
    return lastPageNumber * itemsPerPage; // row count about
  }
  return 0;
};

const CollapsibleTable = () => {
  const {
    isMobile,
    activePage,
    setActivePage,
    itemsPerPage,
    setItemsPerPage,
    handleSortRequest,
    sort,
    rows,
  } = useContext(appContext);
  return (
    <TableContainer>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell style={isMobile ? { width: '1px' } : {}} sortDirection={sort.sortBy === 'name' ? sort.direction : false}>
              <TableSortLabel
                active={sort.sortBy === 'name'}
                direction={sort.sortBy === 'name' ? sort.direction : 'asc'}
                onClick={() => handleSortRequest('name')}
              >
                Repository name
              </TableSortLabel>
            </TableCell>
            <TableCell style={isMobile ? { width: '1px' } : {}}>Top commiters</TableCell>
            <TableCell style={{ display: isMobile ? 'none' : '' }}>Language</TableCell>
            <TableCell style={isMobile ? { width: '1px' } : {}} align="right" sortDirection={sort.sortBy === 'name' ? sort.direction : false}>
              <TableSortLabel
                active={sort.sortBy === 'updated'}
                direction={sort.sortBy === 'updated' ? sort.direction : 'desc'}
                onClick={() => handleSortRequest('updated')}
              >
                Date updated
              </TableSortLabel>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows ? rows.map((row) => (
            <Row key={row.name} row={row} />
          )) : null}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              style={isMobile ? { width: '1px' } : {}}
              rowsPerPageOptions={[
                5,
                10,
                25,
                maxRowsLabel(),
              ]}
              colSpan={isMobile ? 3 : 5}
              count={rowCount()}
              rowsPerPage={itemsPerPage}
              page={rows ? activePage - 1 : 0}
              SelectProps={{
                inputProps: { 'aria-label': 'rows per page' },
                native: true,
              }}
              labelDisplayedRows={({ from, to, count }) => labelDisplayedRows({
                from,
                to,
                count,
              })}
              onChangePage={(event, newPage) => setActivePage(newPage + 1)}
              onChangeRowsPerPage={(event) => {
                setItemsPerPage(parseInt(event.target.value, 10));
                setActivePage(1);
              }}
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default CollapsibleTable;
