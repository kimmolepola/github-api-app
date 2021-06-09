import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ThemeProvider } from '@material-ui/core/styles';
import {
  Typography, Card, Paper, InputLabel, FormControl, Select, MenuItem, CssBaseline,
} from '@material-ui/core';
import parseLink from 'parse-link-header';
import theme from './theme';

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

const App = () => {
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{
        background: 'red', padding: 15,
      }}
      >
        <Typography
          variant="subtitle1"
          style={{
            marginLeft: 20, color: 'white',
          }}
        >
          Github API App
        </Typography>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white',
      }}
      >
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
