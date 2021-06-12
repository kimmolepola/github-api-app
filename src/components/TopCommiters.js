import React, { useContext } from 'react';
import {
  Link,
  Tooltip,
  Avatar,
} from '@material-ui/core';
import appContext from '../context/appContext';

const TopCommiters = ({ row, amount }) => {
  const { statistics } = useContext(appContext);
  if (statistics && statistics[row.name]) {
    return (
      <div style={{ display: 'flex' }}>
        {statistics[row.name].slice(0, amount).map((x) => {
          if (x.author && x.author.avatar_url) {
            return (
              <Tooltip
                key={row.name.concat(x.author.login)}
                title={`${x.author.login} commits: ${x.total}`}
              >
                <Link rel="noopener noreferrer" target="_blank" href={x.author.html_url}>
                  <Avatar alt="avatar" style={{ width: 30, height: 30, marginRight: 1 }} src={x.author.avatar_url} />
                </Link>
              </Tooltip>
            );
          }
          return null;
        })}
      </div>
    );
  }
  return null;
};

export default TopCommiters;
