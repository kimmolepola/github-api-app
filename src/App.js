import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import { Pagination, AvatarGroup } from '@material-ui/lab';
import {
  TableFooter,
  TablePagination,
  TableSortLabel,
  Avatar,
  TableContainer,
  TableBody,
  Collapse,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  IconButton,
  CssBaseline,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Paper,
} from '@material-ui/core';
import parseLink from 'parse-link-header';
import {
  LastPage as LastPageIcon,
  FirstPage as FirstPageIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  KeyboardArrowLeft as KeyboardArrowLeftIcon,
  ArrowDropDown as ArrowDropDownIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Apps as AppsIcon,
  List as ListIcon,
} from '@material-ui/icons';
import theme from './theme';
import timeDifference from './timeDifference';

const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
  },
});

const trimStatistics = (result) => {
  let trimmed;
  if (result && result.status === 200) {
    trimmed = result.data.map((x) => ({
      avatar_url: x.author ? x.author.avatar_url : null,
      login: x.author ? x.author.login : null,
      total: x.total,
      weeks: x.weeks.reduce((acc, cur) => {
        if (cur.a && cur.c && cur.d) {
          return acc.concat(cur);
        }
        return acc;
      }, []),
    }));
  }
  if (result && result.status === 202) {
    trimmed = [];
  }
  return trimmed;
};

const fetchStatistics = async (repositoryNames) => {
  try {
    return await Promise.all(repositoryNames.map(async (repositoryName) => {
      const result = await axios.get(
        `https://api.github.com/repos/${process.env.REACT_APP_ORGANIZATION}/${repositoryName}/stats/contributors`,
        { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } },
      );
      return { repositoryName, statistics: result };
    }));
  } catch (error) {
    console.error(error);
    return null;
  }
};

const handleStatistics = async ({
  statistics,
  setStatistics,
  statisticsRetry,
  setStatisticsRetry,
  repositoryNames,
  timePeriodSelect,
  setTimePeriodSelect,
}) => {
  if (repositoryNames.length) {
    const fetchedStatistics = await fetchStatistics(repositoryNames);
    if (fetchedStatistics) {
      const newStatistics = { ...statistics };
      const newStatisticsRetry = { ...statisticsRetry };
      const newTimePeriodSelect = { ...timePeriodSelect };

      fetchedStatistics.forEach((x) => {
        if (x.statistics.status === 200) {
          x.statistics.data.forEach((xx) => {
            newTimePeriodSelect[xx.author.login] = 0; // dropdown menu initial state
          });
          newStatistics[x.repositoryName] = x.statistics.data.sort((xx, yy) => yy.total - xx.total);
          delete newStatisticsRetry[x.repositoryName];
        }
        if (x.statistics.status === 202) {
          if (newStatisticsRetry[x.repositoryName] || newStatisticsRetry[x.repositoryName] === 0) {
            if (newStatisticsRetry[x.repositoryName] > 4) { // if tried to fetch five times already
              delete newStatisticsRetry[x.repositoryName]; // don't try to fetch anymore
            } else {
              newStatisticsRetry[x.repositoryName] += 1; // increase fetch count
            }
          } else {
            newStatisticsRetry[x.repositoryName] = 0; // create new
          }
        }
      });
      setTimePeriodSelect(newTimePeriodSelect);
      setStatistics(newStatistics);
      setStatisticsRetry(newStatisticsRetry);
    }
  }
};

const createNewPagesObject = ({ pages, page, repositoriesFetchResult }) => {
  const newPagesObject = { ...pages };
  if (repositoriesFetchResult.data) {
    if (!newPagesObject[`page${page}`]) {
      newPagesObject[`page${page}`] = {};
    }
    newPagesObject[`page${page}`].repositories = repositoriesFetchResult.data;
  }
  if (repositoriesFetchResult.headers && repositoriesFetchResult.headers.link) {
    const links = parseLink(repositoriesFetchResult.headers.link);
    console.log('links: ', links);
    Object.keys(links).forEach((x) => {
      if (x === 'last') {
        newPagesObject.last = links[x].page;
      }
      if (links[x].page) {
        if (!newPagesObject[`page${links[x].page}`]) {
          newPagesObject[`page${links[x].page}`] = {};
        }
        newPagesObject[`page${links[x].page}`].link = links[x].url;
      }
    });
  } else if (repositoriesFetchResult.headers) {
    newPagesObject.last = -1;
  }
  return newPagesObject;
};

const fetchRepositories = async ({ itemsPerPage, sort, link }) => {
  try {
    return await axios.get(
      link,
      {
        params: {
          per_page: itemsPerPage,
          sort: sort.sortBy === 'name' ? 'full_name' : 'updated',
          direction: sort.direction,
        },
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}`,
        },
      },
    );
  } catch (error) {
    console.error(error);
    return null;
  }
};

const handleNewPage = async ({
  itemsPerPage,
  sort,
  page,
  pages,
  setPages,
  statistics,
  setStatistics,
  statisticsRetry,
  setStatisticsRetry,
  timePeriodSelect,
  setTimePeriodSelect,
}) => {
  if (pages[`page${page}`] && pages[`page${page}`].link) {
    const result = await fetchRepositories({ itemsPerPage, sort, link: pages[`page${page}`].link });
    console.log('result: ', result);
    if (result) {
      const newPagesObject = createNewPagesObject({ pages, page, repositoriesFetchResult: result });
      setPages(newPagesObject);
      handleStatistics({
        statistics,
        setStatistics,
        statisticsRetry,
        setStatisticsRetry,
        repositoryNames: result.data ? result.data.map((x) => x.name) : [],
        timePeriodSelect,
        setTimePeriodSelect,
      });
    }
  }
};

const TopCommiters = ({ row, statistics }) => {
  if (statistics && statistics[row.name]) {
    return (
      <div style={{ display: 'flex' }}>
        {statistics[row.name].slice(0, 3).map((x) => {
          if (x.author && x.author.avatar_url) {
            return (
              <Avatar key={row.name.concat(x.author.login)} alt="avatar" style={{ width: 30, height: 30, marginRight: 1 }} src={x.author.avatar_url} />
            );
          }
          return null;
        })}
      </div>
    );
  }
  return null;
};

const Row = ({ row, statistics }) => {
  const [open, setOpen] = useState(false);

  const classes = useRowStyles();

  const zrow = { history: [] };

  return (
    <>
      <TableRow className={classes.root}>
        <TableCell component="th" scope="row">
          {row.name}
        </TableCell>
        <TableCell>
          <TopCommiters row={row} statistics={statistics} />
        </TableCell>
        <TableCell>{row.language}</TableCell>
        <TableCell align="right">{timeDifference(Date.now(), new Date(row.updated_at).getTime())}</TableCell>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>

      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Asdf
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>asdf</TableCell>
                    <TableCell>asdf</TableCell>
                    <TableCell align="right">asdf</TableCell>
                    <TableCell align="right">asdf</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {zrow.history.map((historyRow) => (
                    <TableRow key={historyRow.date}>
                      <TableCell component="th" scope="row">
                        {historyRow.date}
                      </TableCell>
                      <TableCell>{historyRow.customerId}</TableCell>
                      <TableCell align="right">{historyRow.amount}</TableCell>
                      <TableCell align="right">
                        {Math.round(historyRow.amount * row.price * 100) / 100}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const TablePaginationActions = (props) => {
  const {
    count, page, rowsPerPage, onChangePage,
  } = props;

  const handleFirstPageButtonClick = (event) => {
    onChangePage(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onChangePage(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onChangePage(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <div style={{ flexShrink: 0, marginLeft: 15 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
        <KeyboardArrowLeftIcon />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRightIcon />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </div>
  );
};

const maxRowsLabel = ({ rows, pagesLast, rowsPerPage }) => {
  // If query result includes all rows, page information doesn't exist
  if (pagesLast === -1) {
    return { label: 'All', value: 100 };
  }
  // If all rows <= 100, say 'All'. Github API query max 100 results.
  return pagesLast * rowsPerPage <= 100 ? { label: 'All', value: 100 } : 100;
};

const CollapsibleTable = ({
  pages,
  activePage,
  setActivePage,
  rowsPerPage,
  setRowsPerPage,
  handleSortRequest,
  sort,
  rows,
  statistics,
}) => (
  <TableContainer>
    <Table aria-label="collapsible table">
      <TableHead>
        <TableRow>
          <TableCell sortDirection={sort.sortBy === 'name' ? sort.direction : false}>
            <TableSortLabel
              active={sort.sortBy === 'name'}
              direction={sort.sortBy === 'name' ? sort.direction : 'asc'}
              onClick={() => handleSortRequest('name')}
            >
              Repository name
            </TableSortLabel>
          </TableCell>
          <TableCell>Top commiters</TableCell>
          <TableCell>Language</TableCell>
          <TableCell align="right" sortDirection={sort.sortBy === 'name' ? sort.direction : false}>
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
          <Row key={row.name} row={row} statistics={statistics} />
        )) : null}
      </TableBody>
      <TableFooter>
        <TableRow>
          {console.log('last and active: ', pages.last, parseInt(activePage, 10))}
          <TablePagination
            rowsPerPageOptions={[
              5,
              10,
              25,
              maxRowsLabel({ rows, pagesLast: pages.last, rowsPerPage }),
            ]}
            colSpan={5}
            count={pages.last
              && pages.last !== -1
              && parseInt(pages.last, 10) !== activePage
              ? pages.last * rowsPerPage
              : rows ? pages.last === -1
                ? -rows.length
                : -((pages.last - 1) * rowsPerPage + rows.length)
                : -1}
            rowsPerPage={rowsPerPage}
            page={activePage - 1}
            SelectProps={{
              inputProps: { 'aria-label': 'rows per page' },
              native: true,
            }}
            labelDisplayedRows={({ from, to, count }) => (Number.isNaN(from) || Number.isNaN(to) || Number.isNaN(count) ? '' : count > 0 ? `${from}-${to} of about ${count}` : `${from}-${-to} of ${-count}`)}
            onChangePage={(event, newPage) => setActivePage(newPage + 1)}
            onChangeRowsPerPage={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setActivePage(1);
            }}
            ActionsComponent={TablePaginationActions}
          />
        </TableRow>
      </TableFooter>
    </Table>
  </TableContainer>
);

const countSiblings = ({ activePage, pages }) => {
  const maxSiblingDistance = 2;
  let siblingDistance = 0;
  for (let i = 0; i < maxSiblingDistance; i += 1) {
    if (pages[`page${activePage + i + 1}`] && (pages[`page${activePage - i - 1}`] || activePage - i - 1 < 1)) {
      siblingDistance += 1;
    } else {
      break;
    }
  }
  console.log('sibling distance: ', siblingDistance);
  return siblingDistance;
};

const App = () => {
  const initialPages = {
    first: 1,
    last: undefined,
    page1: {
      link: `https://api.github.com/orgs/${process.env.REACT_APP_ORGANIZATION}/repos`,
      repositories: [],
    },
  };

  const [updateSpinner, setUpdateSpinner] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sort, setSort] = useState({ sortBy: 'name', direction: 'asc' });
  const [timePeriodSelect, setTimePeriodSelect] = useState({});
  const [retryTimer, setRetryTimer] = useState(null);
  const [retry, setRetry] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [statisticsRetry, setStatisticsRetry] = useState({});
  const [statistics, setStatistics] = useState({});
  const [pages, setPages] = useState(initialPages);

  useEffect(() => {
    (() => {
      setPages(initialPages);
      setActivePage(1);
      setUpdateSpinner(!updateSpinner);
    })();
  }, [rowsPerPage, sort]);

  useEffect(() => {
    handleNewPage({
      itemsPerPage: rowsPerPage,
      sort,
      page: activePage,
      pages,
      setPages,
      statistics,
      setStatistics,
      statisticsRetry,
      setStatisticsRetry,
      timePeriodSelect,
      setTimePeriodSelect,
    });
  }, [activePage, updateSpinner]);

  useEffect(() => {
    (() => {
      if (Object.keys(statisticsRetry).length && !retryTimer) {
        const timer = setInterval(() => { setRetry(true); }, 5000);
        setRetryTimer(timer);
      }
      if (Object.keys(statisticsRetry).length === 0 && retryTimer) {
        clearInterval(retryTimer);
      }
      if (retry) {
        setRetry(false);
        handleStatistics({
          statistics,
          setStatistics,
          statisticsRetry,
          setStatisticsRetry,
          repositoryNames: Object.keys(statisticsRetry),
          timePeriodSelect,
          setTimePeriodSelect,
        });
      }
    })();
  }, [statisticsRetry, retry]);

  const handleSortRequest = (cell) => {
    if (cell === 'name') {
      if (sort.sortBy === 'name') {
        setSort({
          sortBy: 'name',
          direction: sort.direction === 'asc' ? 'desc' : 'asc',
        });
      } else {
        setSort({
          sortBy: 'name',
          direction: 'asc',
        });
      }
    } else if (sort.sortBy === 'name') {
      setSort({
        sortBy: 'updated',
        direction: 'desc',
      });
    } else {
      setSort({
        sortBy: 'updated',
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      });
    }
  };

  const rows = pages[`page${activePage}`] ? pages[`page${activePage}`].repositories : null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{
        background: theme.palette.primary.main, padding: 15,
      }}
      >
        <Typography
          color="secondary"
          variant="subtitle1"
          style={{
            marginLeft: 20, fontWeight: 'bold',
          }}
        >
          Github API App
        </Typography>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
      >
        <div style={{ alignSelf: 'flex-end', display: 'flex' }}>
          <IconButton><ListIcon /></IconButton>
          <IconButton><AppsIcon /></IconButton>
        </div>
        <div style={{
          maxWidth: 1000, marginLeft: 20, marginRight: 20, marginBottom: 20,
        }}
        >
          <FormControl size="small" style={{ display: 'none', margin: 5, minWidth: 100 }}>
            <Select
              disableUnderline
              style={{ fontSize: 12 }}
              renderValue={() => `Rows per page: ${rowsPerPage}`}
              labelId="rows-label"
              id="rows-select"
              value={rowsPerPage}
              onChange={(x) => setRowsPerPage(x.target.value)}
            >
              <MenuItem value="5">5</MenuItem>
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="25">25</MenuItem>
              <MenuItem value="100">100</MenuItem>
            </Select>
          </FormControl>
          <CollapsibleTable
            pages={pages}
            activePage={activePage}
            setActivePage={setActivePage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            handleSortRequest={handleSortRequest}
            sort={sort}
            rows={rows}
            statistics={statistics}
          />
        </div>
        <Pagination
          style={{ display: 'none' }}
          onChange={(x) => console.log(x.target.value)}
          showFirstButton
          showLastButton
          page={activePage}
          boundaryCount={1}
          siblingCount={1}
          count={10}
          variant="outlined"
          color="primary"
        />

        <div style={{ display: 'none' }}>
          {pages[`page${activePage}`] ? pages[`page${activePage}`].repositories ? pages[`page${activePage}`].repositories.map((x) => (
            <Paper
              key={x.id}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 5, padding: 50, background: 'pink',
              }}
            >
              <Typography variant="h6">{x.name}</Typography>
              <Typography>{x.language}</Typography>
              <Typography>Stargazers: {x.stargazers_count}</Typography>
              <Typography>Forks: {x.fork_count}</Typography>
              <Typography>Created at: {x.created_at}</Typography>
              <Typography>Updated at: {x.updated_at}</Typography>
              <Typography variant="subtitle1" style={{ marginTop: 5 }}>Most commits</Typography>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'left' }}>
                { statistics[x.name]
                  ? statistics[x.name].slice(0, 3).map((xx) => (
                    <div key={xx.author.login}>
                      <div
                        style={{
                          display: 'flex', flexDirection: 'row', alignItems: 'center',
                        }}
                      >
                        <img style={{ borderStyle: 'none', borderRadius: '50%', margin: 5 }} alt="avatar_url" width="50" height="50" src={xx.avatar_url} />
                        <Typography>{xx.author.login}: {xx.total}</Typography>
                      </div>
                      <FormControl style={{ margin: 5, minWidth: 120 }}>
                        <InputLabel id="simple-select-label">Time period</InputLabel>
                        <Select
                          labelId="simple-select-label"
                          id="simple-select"
                          value={timePeriodSelect[xx.author.login]}
                          onChange={(xxx) => setTimePeriodSelect({
                            ...timePeriodSelect,
                            [xx.author.login]: xxx.target.value,
                          })}
                        >
                          <MenuItem value={0}>Zero</MenuItem>
                          <MenuItem value={10}>Ten</MenuItem>
                          <MenuItem value={20}>Twenty</MenuItem>
                          <MenuItem value={30}>Thirty</MenuItem>
                        </Select>
                      </FormControl>
                    </div>
                  ))
                  : null }
              </div>
            </Paper>
          )) : null : null}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
