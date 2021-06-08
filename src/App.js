import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Card, Paper } from '@material-ui/core';
import parseLink from 'parse-link-header';

const trim = (result) => {
  let trimmed;
  if (result && result.status === 200) {
    trimmed = result.data.map((x) => ({
      login: x.author ? x.author.login ? x.author.login : null : null,
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
  statistics, setStatistics, statisticsRetry, setStatisticsRetry, repositoryNames,
}) => {
  if (repositoryNames.length) {
    const fetchedStatistics = await fetchStatistics(repositoryNames);
    if (fetchedStatistics) {
      const newStatistics = { ...statistics };

      const newStatisticsRetry = { ...statisticsRetry };

      fetchedStatistics.forEach((x) => {
        if (x.statistics.status === 200) {
          newStatistics[x.repositoryName] = trim(x.statistics)
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
  page, pages, setPages, statistics, setStatistics, statisticsRetry, setStatisticsRetry,
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
      });
    }
  }
};

const App = () => {
  const [retryTimer, setRetryTimer] = useState(null);
  const [asdf, setAsdf] = useState(false);
  const [retry, setRetry] = useState(false);
  const [activePage, setActivePage] = useState(15);
  const [statisticsRetry, setStatisticsRetry] = useState({});
  const [statistics, setStatistics] = useState({});
  const [pages, setPages] = useState({
    first: 1,
    last: undefined,
    page1: {
      link: `https://api.github.com/orgs/${process.env.REACT_APP_ORGANIZATION}/repos`,
      repositories: [],
    },
    page15: {
      link: `https://api.github.com/orgs/${process.env.REACT_APP_ORGANIZATION}/repos?page=15`,
    },
  });

  useEffect(() => {
    if (asdf) {
      setAsdf(false);
      setActivePage(activePage + 1);
      setTimeout(() => setAsdf(true), 8000);
    }
  }, [asdf]);

  useEffect(() => {
    // setTimeout(() => setAsdf(true), 10000);
  }, []);

  useEffect(() => {
    handleNewPage({
      page: activePage,
      pages,
      setPages,
      statistics,
      setStatistics,
      statisticsRetry,
      setStatisticsRetry,
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
        });
      }
    })();
  }, [statisticsRetry, retry]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'yellow',
    }}
    >
      {pages[`page${activePage}`] ? pages[`page${activePage}`].repositories ? pages[`page${activePage}`].repositories.map((x) => (
        <Paper
          key={x.id}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 5, padding: 50,
          }}
        >
          <Typography variant="h6">{x.name}</Typography>
          <Typography>{x.language}</Typography>
          <Typography>Stargazers: {x.stargazers_count}</Typography>
          <Typography>Forks: {x.fork_count}</Typography>
          <Typography>Created at: {x.created_at}</Typography>
          <Typography>Updated at: {x.updated_at}</Typography>
          <Typography variant="subtitle1" style={{ marginTop: 5 }}>Most commits</Typography>
          { statistics[x.id]
            ? statistics[x.id].slice(0, 3).map((xx) => (
              <Typography key={xx.login}>{xx.login}: {xx.total}</Typography>
            ))
            : null }
        </Paper>
      )) : null : null}
    </div>
  );
};

export default App;
