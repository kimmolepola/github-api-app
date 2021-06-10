import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import {
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
          newStatistics[x.repositoryName] = trimStatistics(x.statistics)
            .sort((xx, yy) => yy.total - xx.total);
          delete newStatisticsRetry[x.repositoryName];
        }
        if (x.statistics.status === 202) {
          if (newStatisticsRetry[x.repositoryName] || newStatisticsRetry[x.repositoryName] === 0) {
            if (newStatisticsRetry[x.repositoryName] > 2) { // if tried to fetch three times already
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
    Object.keys(links).forEach((x) => {
      if (links[x].page) {
        if (!newPagesObject[`page${links[x].page}`]) {
          newPagesObject[`page${links[x].page}`] = {};
        }
        newPagesObject[`page${links[x].page}`].link = links[x].url;
      }
    });
  }
  return newPagesObject;
};

const fetchRepositories = async ({ link }) => {
  try {
    return await axios.get(
      link,
      { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } },
    );
  } catch (error) {
    console.error(error);
    return null;
  }
};

const handleNewPage = async ({
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
    const result = await fetchRepositories({ link: pages[`page${page}`].link });
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
  if (!statistics || !statistics[row.name]) {
    return null;
  }
  return (
    <>
      {statistics[row.name].slice(0, 3).map((x) => {
        if (x.avatar_url) {
          return (
            <img
              style={{ borderStyle: 'none', borderRadius: '50%' }}
              alt="avatar_url"
              width="30"
              height="30"
              src={x.avatar_url}
            />
          );
        }
        return null;
      })}
    </>
  );
};

const Row = ({ row, statistics }) => {
  const [open, setOpen] = useState(false);

  const classes = useRowStyles();

  const zrow = { history: [] };

  const avatarUrl = statistics
    ? statistics[row.name]
      ? statistics[row.name][0]
        ? statistics[row.name][0].avatar_url
          ? statistics[row.name][0].avatar_url
          : null
        : null
      : null
    : null;

  /*
  <img
  style={{ borderStyle: 'none', borderRadius: '50%', margin: 5 }}
  alt="avatar_url"
  width="50"
  height="50"
  src={statistics[row.name][0].avatar_url}
/>
*/

  return (
    <>
      <TableRow className={classes.root}>
        <TableCell component="th" scope="row">
          <a href={row.html_url}>{row.name}</a>
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

const CollapsibleTable = ({ rows, xRows, statistics }) => (
  <TableContainer>
    <Table aria-label="collapsible table">
      <TableHead>
        <TableRow>
          <TableCell>Repository name</TableCell>
          <TableCell>Top commiters</TableCell>
          <TableCell>Language</TableCell>
          <TableCell align="right">Date updated</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {xRows.map((row) => (
          <Row key={row.name} row={row} statistics={statistics} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

function createData(name, calories, fat, carbs, protein) {
  return {
    name,
    calories,
    fat,
    carbs,
    protein,
    history: [
      { date: '2020-01-05', customerId: '11091700', amount: 3 },
      { date: '2020-01-02', customerId: 'Anonymous', amount: 1 },
    ],
  };
}

const App = () => {
  const rows = [
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
    createData('Cupcake', 305, 3.7, 67, 4.3),
    createData('Gingerbread', 356, 16.0, 49, 3.9),
  ];

  const [timePeriodSelect, setTimePeriodSelect] = useState({});
  const [retryTimer, setRetryTimer] = useState(null);
  const [retry, setRetry] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [statisticsRetry, setStatisticsRetry] = useState({});
  const [statistics, setStatistics] = useState({});
  const [pages, setPages] = useState({
    first: 1,
    last: undefined,
    page1: {
      link: `https://api.github.com/orgs/${process.env.REACT_APP_ORGANIZATION}/repos`,
      repositories: [],
    },
  });

  useEffect(() => {
    handleNewPage({
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
  }, [activePage]);

  useEffect(() => {
    (() => {
      if (Object.keys(statisticsRetry).length && !retryTimer) {
        const timer = setInterval(() => { setRetry(true); }, 3000);
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

  const xRows = pages[`page${activePage}`] ? pages[`page${activePage}`].repositories : null;
  console.log('xRows: ', xRows);

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
        <div style={{ maxWidth: 1000, margin: 20 }}>
          <CollapsibleTable rows={rows} xRows={xRows} statistics={statistics} />
        </div>
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
                  <div key={xx.login}>
                    <div
                      style={{
                        display: 'flex', flexDirection: 'row', alignItems: 'center',
                      }}
                    >
                      <img style={{ borderStyle: 'none', borderRadius: '50%', margin: 5 }} alt="avatar_url" width="50" height="50" src={xx.avatar_url} />
                      <Typography>{xx.login}: {xx.total}</Typography>
                    </div>
                    <FormControl style={{ margin: 5, minWidth: 120 }}>
                      <InputLabel id="simple-select-label">Time period</InputLabel>
                      <Select
                        labelId="simple-select-label"
                        id="simple-select"
                        value={timePeriodSelect[xx.login]}
                        onChange={(xxx) => setTimePeriodSelect({
                          ...timePeriodSelect,
                          [xx.login]: xxx.target.value,
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
    </ThemeProvider>
  );
};

export default App;
