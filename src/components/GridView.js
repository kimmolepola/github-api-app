import React, { useContext } from 'react';
import { PaginationItem, Pagination } from '@material-ui/lab';
import {
  Grid,
  Card,
  Link,
  MenuItem,
  Select,
  FormControl,
  Typography,
} from '@material-ui/core';
import TopCommiters from './TopCommiters';
import appContext from '../context/appContext';

const GridView = () => {
  const {
    itemsPerPage,
    setItemsPerPage,
    pages,
    activePage,
    setActivePage,
  } = useContext(appContext);
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', margin: 30 }}>
        <div style={{ marginBottom: 10 }}>
          <FormControl size="small" style={{ minWidth: 100 }}>
            <Select
              disableUnderline
              style={{ fontSize: 12 }}
              renderValue={() => `Items per page: ${itemsPerPage}`}
              labelId="rows-label"
              id="rows-select"
              value={itemsPerPage}
              onChange={(x) => setItemsPerPage(x.target.value)}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </div>
        <Grid container spacing={4}>
          {pages[`page${activePage}`]
            ? pages[`page${activePage}`].repositories
              ? pages[`page${activePage}`].repositories.map((x) => (
                <Grid xs={12} sm={6} md={4} item key={x.name} style={{ display: 'flex' }}>
                  <Card style={{ flex: 1, padding: 15 }}>
                    <Link color="inherit" rel="noopener noreferrer" target="_blank" href={x.html_url}>
                      <Typography variant="h6">{x.name}</Typography>
                    </Link>
                    <Typography variant="body2">{x.description}</Typography>
                    <Typography style={{ marginTop: 15 }} variant="subtitle2">Top commiters</Typography>
                    <div style={{ marginTop: 10 }}>
                      <TopCommiters row={x} amount={7} />
                    </div>
                  </Card>
                </Grid>
              )) : <Grid /> : <Grid /> }
        </Grid>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination
          style={{ margin: 30 }}
          onChange={(event, value) => setActivePage(value)}
          count={Number.isInteger(parseInt(pages.last, 10))
            ? parseInt(pages.last, 10)
            : activePage}
          page={activePage}
          variant="outlined"
          color="primary"
          showFirstButton
          showLastButton
          renderItem={(item) => {
            const newItem = { ...item };
            if (!pages[`page${item.page}`]) {
              newItem.disabled = true;
            }
            return <PaginationItem {...newItem} />;
          }}
        />
      </div>
    </div>
  );
};

export default GridView;
