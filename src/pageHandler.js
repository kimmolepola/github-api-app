import parseLink from 'parse-link-header';
import fetchRepositories from './services/fetchRepositories';
import fetchStatistics from './services/fetchStatistics';

export const handleStatistics = async ({
  repositoryNames,
  statistics,
  setStatistics,
  statisticsRetry,
  setStatisticsRetry,
}) => {
  if (repositoryNames.length) {
    const fetchedStatistics = await fetchStatistics(repositoryNames);
    if (fetchedStatistics) {
      const newStatistics = { ...statistics };
      const newStatisticsRetry = { ...statisticsRetry };

      fetchedStatistics.forEach((x) => {
        console.log('GitHub API server code for statistics data request:', x.statistics.status);
        if (x.statistics.status === 200) {
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
      setStatistics(newStatistics);
      setStatisticsRetry(newStatisticsRetry);
    }
  }
};

const createNewPagesObject = ({ repositoriesFetchResult, activePage, pages }) => {
  const newPagesObject = { ...pages };
  if (repositoriesFetchResult.data) {
    if (!newPagesObject[`page${activePage}`]) {
      newPagesObject[`page${activePage}`] = {};
    }
    newPagesObject[`page${activePage}`].repositories = repositoriesFetchResult.data;
  }
  if (repositoriesFetchResult.headers && repositoriesFetchResult.headers.link) {
    const links = parseLink(repositoriesFetchResult.headers.link);
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
    newPagesObject.last = null;
  }
  return newPagesObject;
};

const handleNewPage = async ({
  activePage,
  itemsPerPage,
  sort,
  pages,
  setPages,
  statistics,
  setStatistics,
  statisticsRetry,
  setStatisticsRetry,
}) => {
  if (pages[`page${activePage}`] && pages[`page${activePage}`].link) {
    const result = await fetchRepositories({ itemsPerPage, sort, link: pages[`page${activePage}`].link });
    if (result) {
      const newPagesObject = createNewPagesObject({
        activePage,
        pages,
        repositoriesFetchResult: result,
      });
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

export default handleNewPage;
