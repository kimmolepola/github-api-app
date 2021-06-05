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
  repositories, statistics, retryList, setStatistics, setRetryList,
}) => {
  try {
    const fetchedStatistics = await Promise.all(repositories.map(async (x) => {
      const result = await axios.get(
        `https://api.github.com/repos/${process.env.REACT_APP_ORGANIZATION}/${x.name}/stats/contributors`,
        { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } },
      );
      return { repository: x, statistics: result };
    }));
    const newStatistics = { ...statistics };
    const newRetryList = [...retryList];
    fetchedStatistics.forEach((x) => {
      if (x.statistics.status === 200) {
        newStatistics[x.repository.id] = trim(x.statistics);
      }
      if (x.statistics.status === 202) {
        newRetryList.push(x.repository);
      }
    });
    setStatistics(newStatistics);
    setRetryList(newRetryList);
  } catch (error) {
    console.error(error);
  }
};

const retryFetchStatistics = ({
  repositories, statistics, retryList, setStatistics, setRetryList,
}) => {

};

const App = () => {
  const [repositories, setRepositories] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [retryList, setRetryList] = useState([]);

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
      repositories, statistics, retryList, setStatistics, setRetryList,
    });
  }, [repositories]);

  /// /////////////////////
  // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop

  /*
   const results = [];
    repositories.forEach((repo) => { // for of
      const fetch = async () => {
        const result = await axios.get(`https://api.github.com/repos/${organization}/${repo.name}/stats/contributors`, { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } });
        console.log(result);
        if (result && result.status === 200) {
          const trimmedResult = result.data.map((x) => ({
            login: x.author ? x.author.login ? x.author.login : null : null,
            total: x.total,
            weeks: x.weeks.reduce((acc, cur) => {
              if (cur.a && cur.c && cur.d) {
                return acc.concat(cur);
              }
              return acc;
            }, []),
          }));
          const newStatistics = { ...statistics };
          newStatistics[repo.id] = trimmedResult;
          setStatistics(newStatistics);
          console.log('trimmed: ', trimmedResult);
          sessionStorage.setItem(repo.id, JSON.stringify(trimmedResult));
        }
        if (result && result.status === 202) {
          setRetryList([...retryList, repo]);
        }
      };
      if (!sessionStorage.getItem(repo.id)) {
        fetch();
      }
    });
  }, [repositories]);
  console.log('reps: ', repositories);
  console.log('statistics: ', statistics);
  console.log('retryList: ', retryList);
  console.log('session storage: ', sessionStorage);
  // localStorage.clear();

  const retryLoop = () => {
    if (retryList.length) {
      /// //////////////////
      // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
      // promise.all map ?
      retryList.forEach((repo) => { // for of
        const fetch = async () => {
          const result = await axios.get(`https://api.github.com/repos/${organization}/${repo.name}/stats/contributors`, { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } });
          console.log(result);
          if (result && result.status === 200) {
            const trimmedResult = result.data.map((x) => ({
              login: x.author ? x.author.login ? x.author.login : null : null,
              total: x.total,
              weeks: x.weeks.reduce((acc, cur) => {
                if (cur.a && cur.c && cur.d) {
                  return acc.concat(cur);
                }
                return acc;
              }, []),
            }));
            const newStatistics = { ...statistics };
            newStatistics[repo.id] = trimmedResult;
            setStatistics(newStatistics);
            console.log('trimmed: ', trimmedResult);
            sessionStorage.setItem(repo.id, JSON.stringify(trimmedResult));
          }
        };
        fetch();
      });
      setTimeout(() => retryLoop(), 30000);
    }
  };
*/

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
        </Paper>
      ))}
    </div>
  );
};

export default App;
