import axios from 'axios';

const fetchStatistics = async (repositoryNames) => {
  try {
    return await Promise.all(repositoryNames.map(async (repositoryName) => {
      const result = await axios.get(
        `https://api.github.com/repos/${process.env.REACT_APP_ORGANIZATION}/${repositoryName}/stats/contributors`,
        {
          timeout: 15000,
          headers: { Authorization: `Bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}` },
        },
      );
      return { repositoryName, statistics: result };
    }));
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default fetchStatistics;
