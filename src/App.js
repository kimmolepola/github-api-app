import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@material-ui/core/styles';
import {
  IconButton,
  CssBaseline,
  Typography,
} from '@material-ui/core';
import {
  Apps as AppsIcon,
  List as ListIcon,
} from '@material-ui/icons';
import theme from './theme';
import TableView from './components/TableView';
import GridView from './components/GridView';
import AppContext from './context/appContext';
import handleNewPage, { handleStatistics } from './pageHandler';

const App = () => {
  const initialPages = {
    first: 1,
    last: null,
    page1: {
      link: `https://api.github.com/orgs/${process.env.REACT_APP_ORGANIZATION}/repos`,
      repositories: [],
    },
  };

  const [width, setWidth] = useState(window.innerWidth);
  const [viewMode, setViewMode] = useState('table');
  const [updateSpinner, setUpdateSpinner] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sort, setSort] = useState({ sortBy: 'name', direction: 'asc' });
  const [retryTimer, setRetryTimer] = useState(null);
  const [retry, setRetry] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [statisticsRetry, setStatisticsRetry] = useState({});
  const [statistics, setStatistics] = useState({});
  const [pages, setPages] = useState(initialPages);

  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  const isMobile = width <= 768;

  useEffect(() => {
    (() => {
      setPages(initialPages);
      setActivePage(1);
      setUpdateSpinner(!updateSpinner);
    })();
  }, [itemsPerPage, sort]);

  useEffect(() => {
    handleNewPage({
      itemsPerPage,
      sort,
      activePage,
      pages,
      setPages,
      statistics,
      setStatistics,
      statisticsRetry,
      setStatisticsRetry,
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
    <AppContext.Provider
      value={{
        isMobile,
        pages,
        activePage,
        setActivePage,
        itemsPerPage,
        setItemsPerPage,
        handleSortRequest,
        sort,
        rows,
        statistics,
      }}
    >
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
            <IconButton onClick={() => setViewMode('table')}><ListIcon color={viewMode === 'table' ? 'primary' : 'action'} /></IconButton>
            <IconButton onClick={() => setViewMode('grid')}><AppsIcon color={viewMode === 'grid' ? 'primary' : 'action'} /></IconButton>
          </div>
          <div style={{
            display: viewMode === 'table' ? '' : 'none', maxWidth: 1000,
          }}
          >
            <TableView />
          </div>
          <div style={{
            display: viewMode === 'grid' ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', maxWidth: 1000,
          }}
          >
            <GridView />
          </div>
        </div>
      </ThemeProvider>
    </AppContext.Provider>
  );
};

export default App;
