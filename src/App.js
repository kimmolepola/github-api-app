import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Card, Paper } from '@material-ui/core';

const asdf = async () => {
  // repositories = await axios.get('https://api.github.com/orgs/Vincit/repos', { headers: { Authorization: 'Bearer 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' } });
  // const repository = await axios.get('https://api.github.com/repos/Vincit/objection.js', { headers: { Authorization: 'Bearer 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' } });
  // const statsContributors = await axios.get('https://api.github.com/repos/Vincit/objection.js/stats/contributors', { headers: { Authorization: 'Bearer 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' } });
  // console.log('repositories: ', repositories);
  // console.log('stats contributors', statsContributors);
};
asdf();

const organization = 'Vincit';

const App = () => {
  const [repositories, setRepositories] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [retryList, setRetryList] = useState([]);
  useEffect(async () => {
    const result = await axios.get(`https://api.github.com/orgs/${organization}/repos`, { headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` } });
    setRepositories(result.data);
  }, []);
  useEffect(async () => {
    const results = [];
    /// /////////////////////
    // https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
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
