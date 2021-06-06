import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Card, Paper } from '@material-ui/core';

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
    trimmed = null;
  }
  return trimmed;
};

const fetchStatistics = async ({
  repositories, statistics, setStatistics,
}) => {
  try {
    const fetchedStatistics = await Promise.all(repositories.map(async (x) => {
      const result = await axios.get(
        `https://api.github.com/repos/${process.env.REACT_APP_ORGANIZATION}/${x.name}/stats/contributors`,
        { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } },
      );
      return { repository: x, statistics: result };
    }));
    console.log('fetched statistics: ', fetchedStatistics);
    const newStatistics = { ...statistics };
    const retryList = [];
    fetchedStatistics.forEach((x) => {
      if (x.statistics.status === 200) {
        newStatistics[x.repository.id] = trim(x.statistics).sort((xx, yy) => yy.total - xx.total);
      }
      if (x.statistics.status === 202) {
        retryList.push(x.repository);
      }
    });
    console.log('new statistics: ', newStatistics);
    setStatistics(newStatistics);
    if (retryList.length) {
      console.log('retry: ', retryList);
      setTimeout(
        () => fetchStatistics({ repositories: retryList, statistics, setStatistics }),
        3000,
      );
    }
  } catch (error) {
    console.error(error);
  }
};

const App = () => {
  const [repositories, setRepositories] = useState([]);
  const [statistics, setStatistics] = useState({});

  useEffect(async () => {
    try {
      const { data } = await axios.get(
        `https://api.github.com/orgs/${process.env.REACT_APP_ORGANIZATION}/repos`,
        { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } },
      );
      setRepositories(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchStatistics({
      repositories, statistics, setStatistics,
    });
  }, [repositories]);

  const asdf = ['a', 'b', 'c', 'd'];
  console.log('slice: ', asdf.slice(0, 5));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'yellow',
    }}
    >
      {repositories.map((x) => (
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
      ))}
    </div>
  );
};

export default App;
